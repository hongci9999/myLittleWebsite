import { supabase, getSupabaseWithAuth } from '../supabase.js'

export type MediaKind =
  | 'youtube'
  | 'article'
  | 'repo'
  | 'blog'
  | 'doc'
  | 'book'
  | 'other'

export type Category =
  | 'graphics'
  | 'physics'
  | 'ai'
  | 'gameplay'
  | 'engine'
  | 'network'
  | 'sound'
  | 'optimization'
  | 'etc'

export interface GameDevResource {
  id: string
  slug: string
  title: string
  url: string
  mediaKind: MediaKind
  category: Category
  summary: string | null
  bodyMd: string | null
  extraLinks: { label: string; url: string }[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

const KINDS: MediaKind[] = ['youtube', 'article', 'repo', 'blog', 'doc', 'book', 'other']

export function isMediaKind(s: string): s is MediaKind {
  return KINDS.includes(s as MediaKind)
}

const CATEGORIES: Category[] = [
  'graphics', 'physics', 'ai', 'gameplay', 'engine', 'network', 'sound', 'optimization', 'etc',
]

export function isCategory(s: string): s is Category {
  return CATEGORIES.includes(s as Category)
}

function mapRow(row: Record<string, unknown>): GameDevResource {
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
    mediaKind: row.media_kind as MediaKind,
    category: (isCategory(String(row.category)) ? row.category : 'etc') as Category,
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
  let q = client.from('game_dev_resources').select('id').eq('slug', slug).limit(1)
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

export async function listGameDevResources(filters?: {
  q?: string
  kind?: string
  category?: string
}): Promise<GameDevResource[]> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')

  const { data, error } = await client
    .from('game_dev_resources')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  let rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>))

  if (filters?.kind && isMediaKind(filters.kind)) {
    rows = rows.filter((r) => r.mediaKind === filters.kind)
  }
  if (filters?.category && isCategory(filters.category)) {
    rows = rows.filter((r) => r.category === filters.category)
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

export async function getGameDevResourceBySlug(slug: string): Promise<GameDevResource | null> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')
  const { data, error } = await client
    .from('game_dev_resources')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapRow(data as Record<string, unknown>)
}

export async function createGameDevResource(
  token: string,
  input: {
    title: string
    url: string
    mediaKind: MediaKind
    category: Category
    summary?: string | null
    bodyMd?: string | null
    extraLinks?: { label: string; url: string }[]
    tags?: string[]
    slug?: string | null
  }
): Promise<GameDevResource> {
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
    .from('game_dev_resources')
    .insert({
      slug,
      title: input.title.trim(),
      url: input.url.trim(),
      media_kind: input.mediaKind,
      category: input.category,
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

export async function updateGameDevResource(
  token: string,
  id: string,
  input: {
    title?: string
    url?: string
    mediaKind?: MediaKind
    category?: Category
    summary?: string | null
    bodyMd?: string | null
    extraLinks?: { label: string; url: string }[]
    tags?: string[]
    slug?: string | null
  }
): Promise<GameDevResource> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.title != null) payload.title = input.title.trim()
  if (input.url != null) payload.url = input.url.trim()
  if (input.mediaKind != null) payload.media_kind = input.mediaKind
  if (input.category != null) payload.category = input.category
  if (input.summary !== undefined) payload.summary = input.summary?.trim() || null
  if (input.bodyMd !== undefined) payload.body_md = input.bodyMd?.trim() || null
  if (input.extraLinks != null) payload.extra_links = input.extraLinks
  if (input.tags != null) payload.tags = input.tags.map((t) => t.trim()).filter(Boolean)
  if (input.slug !== undefined) {
    const nextSlug = input.slug?.trim()
    if (nextSlug) {
      const { data: current, error: curErr } = await client
        .from('game_dev_resources')
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
    .from('game_dev_resources')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Update failed')
  return mapRow(data as Record<string, unknown>)
}

export async function deleteGameDevResource(token: string, id: string): Promise<void> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')
  const { error } = await client.from('game_dev_resources').delete().eq('id', id)
  if (error) throw error
}
