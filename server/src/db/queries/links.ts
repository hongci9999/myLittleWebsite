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

  const { data: links, error } = await client
    .from('links')
    .select('*')
    .order('sort_order', { ascending: true })

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

/** 링크 추가 (인증 필요) */
export async function createLink(
  token: string,
  data: { url: string; title: string; description?: string; valueIds?: string[] }
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
  data: { url?: string; title?: string; description?: string; valueIds?: string[] }
) {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  const updatePayload: Record<string, unknown> = {}
  if (data.url != null) updatePayload.url = data.url
  if (data.title != null) updatePayload.title = data.title
  if (data.description != null) updatePayload.description = data.description

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

/** 분류 값 생성 (인증 필요). custom dimension에 새 태그 추가 */
export async function createClassificationValue(
  token: string,
  dimensionId: string,
  data: { label: string; slug?: string }
): Promise<{ id: string }> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  const slug =
    data.slug ??
    data.label
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9가-힣-]/g, '')

  const { data: value, error } = await client
    .from('classification_values')
    .insert({
      dimension_id: dimensionId,
      parent_id: null,
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
