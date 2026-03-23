import { supabase, getSupabaseWithAuth } from '../supabase.js'

export type ColumnSourceKind = 'blog' | 'article' | 'readme' | 'youtube' | 'x' | 'other'

export interface ColumnScrapExtraLink {
  label: string
  url: string
}

export interface ColumnScrap {
  id: string
  slug: string
  title: string
  url: string
  sourceKind: ColumnSourceKind
  summary: string | null
  bodyMd: string | null
  coverImageUrl: string | null
  tags: string[]
  extraLinks: ColumnScrapExtraLink[]
  createdAt: string
  updatedAt: string
}

const KINDS: ColumnSourceKind[] = ['blog', 'article', 'readme', 'youtube', 'x', 'other']

export function isColumnSourceKind(s: string): s is ColumnSourceKind {
  return KINDS.includes(s as ColumnSourceKind)
}

function mapExtraLinks(raw: unknown): ColumnScrapExtraLink[] {
  if (!Array.isArray(raw)) return []
  const out: ColumnScrapExtraLink[] = []
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue
    const o = x as { label?: unknown; url?: unknown }
    if (typeof o.url !== 'string' || !o.url.trim()) continue
    const label =
      typeof o.label === 'string' && o.label.trim() ? o.label.trim() : '링크'
    out.push({ label, url: o.url.trim() })
  }
  return out
}

function mapRow(row: Record<string, unknown>): ColumnScrap {
  const tags = Array.isArray(row.tags)
    ? (row.tags as unknown[]).filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    : []

  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    url: row.url as string,
    sourceKind: row.source_kind as ColumnSourceKind,
    summary: row.summary != null ? String(row.summary) : null,
    bodyMd: row.body_md != null ? String(row.body_md) : null,
    coverImageUrl:
      row.cover_image_url != null && String(row.cover_image_url).trim()
        ? String(row.cover_image_url).trim()
        : null,
    tags,
    extraLinks: mapExtraLinks(row.extra_links),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function slugifyColumnTitle(title: string): string {
  let s = title
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72)
  if (!s) s = `clip-${Date.now().toString(36)}`
  return s
}

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')
  let q = client.from('column_scraps').select('id').eq('slug', slug).limit(1)
  if (excludeId) q = q.neq('id', excludeId)
  const { data, error } = await q
  if (error) throw error
  return (data?.length ?? 0) > 0
}

export async function generateUniqueColumnSlug(base: string): Promise<string> {
  let slug = slugifyColumnTitle(base)
  let n = 0
  while (await slugExists(slug)) {
    n += 1
    slug = `${slugifyColumnTitle(base)}-${n}`
  }
  return slug
}

/** 목록 (공개). tagsAnd: 모든 태그를 포함하는 항목만 */
export async function listColumnScraps(filters?: {
  q?: string
  kind?: string
  tagsAnd?: string[]
}): Promise<ColumnScrap[]> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')

  const { data, error } = await client
    .from('column_scraps')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  let rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>))

  if (filters?.kind && isColumnSourceKind(filters.kind)) {
    rows = rows.filter((r) => r.sourceKind === filters.kind)
  }

  if (filters?.tagsAnd?.length) {
    const need = filters.tagsAnd.map((t) => t.trim().toLowerCase()).filter(Boolean)
    rows = rows.filter((r) =>
      need.every((t) => r.tags.some((x) => x.toLowerCase() === t))
    )
  }

  if (filters?.q?.trim()) {
    const q = filters.q.trim().toLowerCase()
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.url.toLowerCase().includes(q) ||
        (r.summary?.toLowerCase().includes(q) ?? false) ||
        (r.bodyMd?.toLowerCase().includes(q) ?? false) ||
        r.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        r.slug.toLowerCase().includes(q) ||
        r.extraLinks.some(
          (l) =>
            l.label.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)
        )
    )
  }

  return rows
}

export async function getColumnScrapBySlug(slug: string): Promise<ColumnScrap | null> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')

  const { data, error } = await client
    .from('column_scraps')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapRow(data as Record<string, unknown>)
}

export async function createColumnScrap(
  token: string,
  input: {
    title: string
    url: string
    sourceKind: ColumnSourceKind
    summary?: string | null
    bodyMd?: string | null
    coverImageUrl?: string | null
    tags?: string[]
    extraLinks?: ColumnScrapExtraLink[]
    slug?: string | null
  }
): Promise<ColumnScrap> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  let slug: string
  if (input.slug?.trim()) {
    slug = input.slug.trim()
    if (await slugExists(slug)) throw new Error('Slug already exists')
  } else {
    slug = await generateUniqueColumnSlug(input.title)
  }

  const { data, error } = await client
    .from('column_scraps')
    .insert({
      slug,
      title: input.title.trim(),
      url: input.url.trim(),
      source_kind: input.sourceKind,
      summary: input.summary?.trim() || null,
      body_md: input.bodyMd?.trim() || null,
      cover_image_url: input.coverImageUrl?.trim() || null,
      tags: input.tags?.length ? input.tags.map((t) => t.trim()).filter(Boolean) : [],
      extra_links: mapExtraLinks(input.extraLinks ?? []),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Insert failed')
  return mapRow(data as Record<string, unknown>)
}

export async function updateColumnScrap(
  token: string,
  id: string,
  input: {
    title?: string
    url?: string
    sourceKind?: ColumnSourceKind
    summary?: string | null
    bodyMd?: string | null
    coverImageUrl?: string | null
    tags?: string[]
    extraLinks?: ColumnScrapExtraLink[]
    slug?: string | null
  }
): Promise<ColumnScrap> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.title != null) payload.title = input.title.trim()
  if (input.url != null) payload.url = input.url.trim()
  if (input.sourceKind != null) payload.source_kind = input.sourceKind
  if (input.summary !== undefined) payload.summary = input.summary?.trim() || null
  if (input.bodyMd !== undefined) payload.body_md = input.bodyMd?.trim() || null
  if (input.coverImageUrl !== undefined) {
    payload.cover_image_url = input.coverImageUrl?.trim() || null
  }
  if (input.tags != null) {
    payload.tags = input.tags.map((t) => t.trim()).filter(Boolean)
  }
  if (input.extraLinks != null) {
    payload.extra_links = mapExtraLinks(input.extraLinks)
  }
  if (input.slug !== undefined) {
    const nextSlug = input.slug?.trim()
    if (nextSlug) {
      const { data: current, error: curErr } = await client
        .from('column_scraps')
        .select('slug')
        .eq('id', id)
        .single()
      if (curErr) throw curErr
      const prev = (current as { slug: string }).slug
      if (prev !== nextSlug) {
        const taken = await slugExists(nextSlug, id)
        if (taken) throw new Error('Slug already exists')
        payload.slug = nextSlug
      }
    }
  }

  const { data, error } = await client
    .from('column_scraps')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Update failed')
  return mapRow(data as Record<string, unknown>)
}

export async function deleteColumnScrap(token: string, id: string): Promise<void> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  const { error } = await client.from('column_scraps').delete().eq('id', id)
  if (error) throw error
}
