import { supabase, getSupabaseWithAuth } from '../supabase.js'

export interface DimensionRow {
  id: string
  slug: string
  label: string
  allow_hierarchy: boolean
  sort_order: number
}

export interface ValueRow {
  id: string
  dimension_id: string
  parent_id: string | null
  slug: string
  label: string
  sort_order: number
}

export interface LinkRow {
  id: string
  url: string
  title: string
  description: string | null
  sort_order: number
  created_at: string
  is_featured?: boolean
  featured_sort_order?: number
  favicon_url?: string | null
}

export interface DimensionWithValues {
  id: string
  slug: string
  label: string
  allowHierarchy: boolean
  sortOrder: number
  values: ValueTree[]
}

export interface ValueTree {
  id: string
  slug: string
  label: string
  sortOrder: number
  children?: ValueTree[]
}

export interface LinkWithValues {
  id: string
  url: string
  title: string
  description: string | null
  sortOrder: number
  createdAt: string
  valueIds: string[]
  isFeatured?: boolean
  featuredSortOrder?: number
  faviconUrl?: string | null
}

/** 분류 축 + 값 트리 조회 */
export async function getDimensionsWithValues(): Promise<
  DimensionWithValues[]
> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')

  const { data: dims, error: dimError } = await client
    .from('classification_dimensions')
    .select('*')
    .order('sort_order', { ascending: true })

  if (dimError) throw dimError
  if (!dims?.length) return []

  const { data: values, error: valError } = await client
    .from('classification_values')
    .select('*')
    .order('sort_order', { ascending: true })

  if (valError) throw valError

  return dims.map((d) => {
    const dimValues = (values ?? []).filter((v) => v.dimension_id === d.id)
    const topLevel = dimValues.filter((v) => !v.parent_id)
    const buildTree = (parentId: string | null): ValueTree[] =>
      dimValues
        .filter((v) => v.parent_id === parentId)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((v) => ({
          id: v.id,
          slug: v.slug,
          label: v.label,
          sortOrder: v.sort_order,
          children: d.allow_hierarchy ? buildTree(v.id) : undefined,
        }))

    return {
      id: d.id,
      slug: d.slug,
      label: d.label,
      allowHierarchy: d.allow_hierarchy,
      sortOrder: d.sort_order,
      values: buildTree(null),
    }
  })
}

/** 링크 목록 조회 (필터: valueIds, q 검색) */
export async function getLinks(filters?: {
  valueIds?: string[]
  q?: string
}): Promise<LinkWithValues[]> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')

  // sort_order 동순 시 순서가 요청마다 바뀌지 않도록 2차·3차 키 필수 (UPDATE 후 카드 위치 점프 방지)
  const { data: links, error } = await client
    .from('links')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (error) throw error
  if (!links?.length) return []

  const linkIds = links.map((l) => l.id)
  const { data: relations, error: relError } = await client
    .from('link_value_relations')
    .select('link_id, value_id')
    .in('link_id', linkIds)

  if (relError) throw relError

  const relationsByLink = new Map<string, string[]>()
  for (const r of relations ?? []) {
    const arr = relationsByLink.get(r.link_id) ?? []
    arr.push(r.value_id)
    relationsByLink.set(r.link_id, arr)
  }

  let result: LinkWithValues[] = links.map((l) => ({
    id: l.id,
    url: l.url,
    title: l.title,
    description: l.description,
    sortOrder: l.sort_order,
    createdAt: l.created_at,
    valueIds: relationsByLink.get(l.id) ?? [],
    isFeatured: l.is_featured ?? false,
    featuredSortOrder: l.featured_sort_order ?? 0,
    faviconUrl: l.favicon_url ?? null,
  }))

  if (filters?.valueIds?.length) {
    result = result.filter((l) =>
      filters.valueIds!.some((vid) => l.valueIds.includes(vid))
    )
  }

  if (filters?.q?.trim()) {
    const q = filters.q.trim().toLowerCase()
    result = result.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.description?.toLowerCase().includes(q) ?? false) ||
        l.url.toLowerCase().includes(q)
    )
  }

  return result
}

/** 메인 추천 링크 목록 조회 (공개). featured_sort_order 기준 정렬 */
export async function getFeaturedLinks(): Promise<LinkWithValues[]> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')

  const { data: links, error } = await client
    .from('links')
    .select('*')
    .eq('is_featured', true)
    .order('featured_sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (error) throw error
  if (!links?.length) return []

  const linkIds = links.map((l) => l.id)
  const { data: relations, error: relError } = await client
    .from('link_value_relations')
    .select('link_id, value_id')
    .in('link_id', linkIds)

  if (relError) throw relError

  const relationsByLink = new Map<string, string[]>()
  for (const r of relations ?? []) {
    const arr = relationsByLink.get(r.link_id) ?? []
    arr.push(r.value_id)
    relationsByLink.set(r.link_id, arr)
  }

  return links.map((l) => ({
    id: l.id,
    url: l.url,
    title: l.title,
    description: l.description,
    sortOrder: l.sort_order,
    createdAt: l.created_at,
    valueIds: relationsByLink.get(l.id) ?? [],
    isFeatured: true,
    featuredSortOrder: l.featured_sort_order ?? 0,
    faviconUrl: l.favicon_url ?? null,
  }))
}

/** 링크 추가 (인증 필요) */
/** 링크 URL만 조회 (PATCH 시 URL 변경 여부로 파비콘 재수집 여부 판단) */
export async function getLinkUrl(token: string, id: string): Promise<string | null> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')
  const { data, error } = await client.from('links').select('url').eq('id', id).maybeSingle()
  if (error) throw error
  return data?.url ?? null
}

export async function createLink(
  token: string,
  data: {
    url: string
    title: string
    description?: string
    valueIds?: string[]
    isFeatured?: boolean
    faviconUrl?: string | null
  }
) {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  const { data: link, error } = await client
    .from('links')
    .insert({
      url: data.url,
      title: data.title,
      description: data.description ?? null,
      sort_order: 0,
      is_featured: data.isFeatured ?? false,
      featured_sort_order: 0,
      favicon_url: data.faviconUrl ?? null,
    })
    .select()
    .single()

  if (error) throw error
  if (!link) throw new Error('Insert failed')

  if (data.valueIds?.length) {
    await client.from('link_value_relations').insert(
      data.valueIds.map((valueId) => ({ link_id: link.id, value_id: valueId }))
    )
  }

  return link
}

/** 링크 수정 (인증 필요) */
export async function updateLink(
  token: string,
  id: string,
  data: {
    url?: string
    title?: string
    description?: string
    valueIds?: string[]
    isFeatured?: boolean
    featuredSortOrder?: number
    faviconUrl?: string | null
  }
) {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  const updatePayload: Record<string, unknown> = {}
  if (data.url != null) updatePayload.url = data.url
  if (data.title != null) updatePayload.title = data.title
  if (data.description != null) updatePayload.description = data.description
  if (data.isFeatured != null) updatePayload.is_featured = data.isFeatured
  if (data.featuredSortOrder != null)
    updatePayload.featured_sort_order = data.featuredSortOrder
  if (data.faviconUrl !== undefined) updatePayload.favicon_url = data.faviconUrl

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await client.from('links').update(updatePayload).eq('id', id)
    if (error) throw error
  }

  if (data.valueIds != null) {
    await client.from('link_value_relations').delete().eq('link_id', id)
    if (data.valueIds.length > 0) {
      await client.from('link_value_relations').insert(
        data.valueIds.map((valueId) => ({ link_id: id, value_id: valueId }))
      )
    }
  }

  const { data: link, error } = await client
    .from('links')
    .select()
    .eq('id', id)
    .single()

  if (error) throw error
  return link
}

/** 링크 삭제 (인증 필요) */
export async function deleteLink(token: string, id: string) {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  const { error } = await client.from('links').delete().eq('id', id)
  if (error) throw error
}

/** label로 value 찾기 (대소문자 무시) */
export async function findValueByLabel(label: string): Promise<string | null> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')

  const { data: rows, error } = await client
    .from('classification_values')
    .select('id, label')
  if (error) throw error
  const trimmed = label.trim().toLowerCase()
  const exact = (rows ?? []).find(
    (r: { id: string; label: string }) =>
      r.label?.toLowerCase() === trimmed
  )
  return exact ? exact.id : null
}

function slugFromLabel(label: string): string {
  const s = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')
  return s || 'tag'
}

/** purpose | medium 축인지 검사 */
async function assertPurposeOrMediumDimension(
  client: NonNullable<ReturnType<typeof getSupabaseWithAuth>>,
  dimensionId: string
): Promise<'purpose' | 'medium'> {
  const { data: dim, error } = await client
    .from('classification_dimensions')
    .select('slug')
    .eq('id', dimensionId)
    .single()
  if (error || !dim) throw new Error('Dimension not found')
  if (dim.slug === 'purpose' || dim.slug === 'medium') return dim.slug
  throw new Error('Only purpose and medium tags can be managed here')
}

/** 분류 값 생성 (인증 필요). parentId는 목적(purpose) 계층 하위만 허용 */
export async function createClassificationValue(
  token: string,
  dimensionId: string,
  data: { label: string; slug?: string; parentId?: string | null }
): Promise<{ id: string }> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  const dimSlug = await assertPurposeOrMediumDimension(client, dimensionId)

  let parentId: string | null = data.parentId ?? null
  if (parentId) {
    if (dimSlug !== 'purpose') {
      throw new Error('parentId is only allowed for purpose dimension')
    }
    const { data: parent, error: pErr } = await client
      .from('classification_values')
      .select('id, dimension_id')
      .eq('id', parentId)
      .single()
    if (pErr || !parent || parent.dimension_id !== dimensionId) {
      throw new Error('Invalid parent tag')
    }
  }

  const slug =
    data.slug ?? slugFromLabel(data.label)

  const { data: value, error } = await client
    .from('classification_values')
    .insert({
      dimension_id: dimensionId,
      parent_id: parentId,
      slug: slug || 'custom-tag',
      label: data.label.trim(),
      sort_order: 999,
    })
    .select('id')
    .single()

  if (error) throw error
  if (!value) throw new Error('Insert failed')
  return value
}

/** 분류 값 수정 (라벨·슬러그). purpose | medium만 */
export async function updateClassificationValue(
  token: string,
  id: string,
  data: { label: string }
): Promise<void> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  const { data: row, error: fe } = await client
    .from('classification_values')
    .select('id, dimension_id')
    .eq('id', id)
    .single()
  if (fe || !row) throw new Error('Tag not found')

  await assertPurposeOrMediumDimension(client, row.dimension_id)

  let newSlug = slugFromLabel(data.label)
  const { data: conflict } = await client
    .from('classification_values')
    .select('id')
    .eq('dimension_id', row.dimension_id)
    .eq('slug', newSlug)
    .neq('id', id)
    .maybeSingle()
  if (conflict) {
    newSlug = `${newSlug}-${id.slice(0, 8)}`
  }

  const { error } = await client
    .from('classification_values')
    .update({
      label: data.label.trim(),
      slug: newSlug,
    })
    .eq('id', id)
  if (error) throw error
}

/** 분류 값 삭제. 링크 연결·하위 태그는 DB CASCADE로 정리 */
export async function deleteClassificationValue(token: string, id: string): Promise<void> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  const { data: row, error: fe } = await client
    .from('classification_values')
    .select('id, dimension_id')
    .eq('id', id)
    .single()
  if (fe || !row) throw new Error('Tag not found')

  await assertPurposeOrMediumDimension(client, row.dimension_id)

  const { error } = await client.from('classification_values').delete().eq('id', id)
  if (error) throw error
}

/** dimension ID 조회 (slug로) */
export async function getDimensionIdBySlug(slug: string): Promise<string | null> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')

  const { data, error } = await client
    .from('classification_dimensions')
    .select('id')
    .eq('slug', slug)
    .limit(1)
    .single()

  if (error || !data) return null
  return data.id
}

/** custom dimension ID 조회 (slug='custom') */
export async function getCustomDimensionId(): Promise<string | null> {
  return getDimensionIdBySlug('custom')
}
