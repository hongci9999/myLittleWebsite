import { supabase, getSupabaseWithAuth } from '../supabase.js'

export type SourceKind =
  | 'mcp'
  | 'skill'
  | 'rules'
  | 'cli'
  | 'doc'
  | 'repo'
  | 'other'

export interface AiToolScrap {
  id: string
  slug: string
  title: string
  url: string
  sourceKind: SourceKind
  summary: string | null
  bodyMd: string | null
  extraLinks: { label: string; url: string }[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

const KINDS: SourceKind[] = [
  'mcp',
  'skill',
  'rules',
  'cli',
  'doc',
  'repo',
  'other',
]

export function isSourceKind(s: string): s is SourceKind {
  return KINDS.includes(s as SourceKind)
}

function mapRow(row: Record<string, unknown>): AiToolScrap {
  const extra = row.extra_links
  let extraLinks: { label: string; url: string }[] = []
  if (Array.isArray(extra)) {
    extraLinks = extra
      .filter(
        (x): x is { label?: string; url: string } =>
          x != null && typeof x === 'object' && typeof (x as { url?: string }).url === 'string'
      )
      .map((x) => ({
        label: typeof x.label === 'string' && x.label.trim() ? x.label.trim() : '링크',
        url: String(x.url).trim(),
      }))
  }
  const tags = Array.isArray(row.tags)
    ? (row.tags as unknown[]).filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    : []

  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    url: row.url as string,
    sourceKind: row.source_kind as SourceKind,
    summary: row.summary != null ? String(row.summary) : null,
    bodyMd: row.body_md != null ? String(row.body_md) : null,
    extraLinks,
    tags,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function slugifyTitle(title: string): string {
  let s = title
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72)
  if (!s) s = `item-${Date.now().toString(36)}`
  return s
}

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')
  let q = client.from('ai_tool_scraps').select('id').eq('slug', slug).limit(1)
  if (excludeId) q = q.neq('id', excludeId)
  const { data, error } = await q
  if (error) throw error
  return (data?.length ?? 0) > 0
}

export async function generateUniqueSlug(base: string): Promise<string> {
  let slug = slugifyTitle(base)
  let n = 0
  while (await slugExists(slug)) {
    n += 1
    slug = `${slugifyTitle(base)}-${n}`
  }
  return slug
}

/** 목록 (공개). q·kind·tag는 서버에서 메모리 필터 — 스크랩 수가 적을 때 적합 */
export async function listAiToolScraps(filters?: {
  q?: string
  kind?: string
  tag?: string
}): Promise<AiToolScrap[]> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')

  const { data, error } = await client
    .from('ai_tool_scraps')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  let rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>))

  if (filters?.kind && isSourceKind(filters.kind)) {
    rows = rows.filter((r) => r.sourceKind === filters.kind)
  }
  if (filters?.tag?.trim()) {
    const t = filters.tag.trim().toLowerCase()
    rows = rows.filter((r) => r.tags.some((x) => x.toLowerCase() === t))
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
        r.slug.toLowerCase().includes(q)
    )
  }

  return rows
}

export async function getAiToolScrapBySlug(slug: string): Promise<AiToolScrap | null> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')

  const { data, error } = await client
    .from('ai_tool_scraps')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapRow(data as Record<string, unknown>)
}

export async function createAiToolScrap(
  token: string,
  input: {
    title: string
    url: string
    sourceKind: SourceKind
    summary?: string | null
    bodyMd?: string | null
    extraLinks?: { label: string; url: string }[]
    tags?: string[]
    slug?: string | null
  }
): Promise<AiToolScrap> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  let slug: string
  if (input.slug?.trim()) {
    slug = input.slug.trim()
    if (await slugExists(slug)) throw new Error('Slug already exists')
  } else {
    slug = await generateUniqueSlug(input.title)
  }

  const { data, error } = await client
    .from('ai_tool_scraps')
    .insert({
      slug,
      title: input.title.trim(),
      url: input.url.trim(),
      source_kind: input.sourceKind,
      summary: input.summary?.trim() || null,
      body_md: input.bodyMd?.trim() || null,
      extra_links: input.extraLinks ?? [],
      tags: input.tags?.length ? input.tags.map((t) => t.trim()).filter(Boolean) : [],
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Insert failed')
  return mapRow(data as Record<string, unknown>)
}

export async function updateAiToolScrap(
  token: string,
  id: string,
  input: {
    title?: string
    url?: string
    sourceKind?: SourceKind
    summary?: string | null
    bodyMd?: string | null
    extraLinks?: { label: string; url: string }[]
    tags?: string[]
    slug?: string | null
  }
): Promise<AiToolScrap> {
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
  if (input.extraLinks != null) payload.extra_links = input.extraLinks
  if (input.tags != null) {
    payload.tags = input.tags.map((t) => t.trim()).filter(Boolean)
  }
  if (input.slug !== undefined) {
    const nextSlug = input.slug?.trim()
    if (nextSlug) {
      const { data: current, error: curErr } = await client
        .from('ai_tool_scraps')
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
    .from('ai_tool_scraps')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Update failed')
  return mapRow(data as Record<string, unknown>)
}

export async function deleteAiToolScrap(token: string, id: string): Promise<void> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  const { error } = await client.from('ai_tool_scraps').delete().eq('id', id)
  if (error) throw error
}
