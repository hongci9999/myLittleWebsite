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

const API_BASE = '/api/column-scraps'

export const COLUMN_SOURCE_OPTIONS: { value: ColumnSourceKind; label: string }[] = [
  { value: 'blog', label: '블로그' },
  { value: 'article', label: '기사' },
  { value: 'readme', label: 'README' },
  { value: 'youtube', label: '유튜브' },
  { value: 'x', label: 'X' },
  { value: 'other', label: '기타' },
]

export function columnSourceLabel(kind: ColumnSourceKind): string {
  return COLUMN_SOURCE_OPTIONS.find((o) => o.value === kind)?.label ?? kind
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

function mapExtraLinksRaw(raw: unknown): ColumnScrapExtraLink[] {
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

function mapItem(raw: Record<string, unknown>): ColumnScrap {
  const tags = Array.isArray(raw.tags)
    ? (raw.tags as unknown[]).filter((t): t is string => typeof t === 'string')
    : []
  const extraRaw = raw.extraLinks ?? raw.extra_links
  return {
    id: String(raw.id),
    slug: String(raw.slug),
    title: String(raw.title),
    url: String(raw.url),
    sourceKind: raw.sourceKind as ColumnSourceKind,
    summary: raw.summary != null ? String(raw.summary) : null,
    bodyMd: raw.bodyMd != null ? String(raw.bodyMd) : null,
    coverImageUrl:
      raw.coverImageUrl != null && String(raw.coverImageUrl).trim()
        ? String(raw.coverImageUrl)
        : (raw.cover_image_url != null && String(raw.cover_image_url).trim()
            ? String(raw.cover_image_url)
            : null),
    tags,
    extraLinks: mapExtraLinksRaw(extraRaw),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ''),
  }
}

export async function fetchColumnScraps(params?: {
  q?: string
  kind?: ColumnSourceKind | ''
}): Promise<ColumnScrap[]> {
  const sp = new URLSearchParams()
  if (params?.q?.trim()) sp.set('q', params.q.trim())
  if (params?.kind) sp.set('kind', params.kind)
  const qs = sp.toString()
  const res = await fetch(`${API_BASE}${qs ? `?${qs}` : ''}`)
  if (res.status === 503) throw new Error('SERVICE_UNAVAILABLE')
  if (!res.ok) throw new Error('Failed to load column scraps')
  const data = (await res.json()) as Record<string, unknown>[]
  return data.map((row) => mapItem(row))
}

export async function fetchColumnScrapBySlug(slug: string): Promise<ColumnScrap | null> {
  const res = await fetch(`${API_BASE}/by-slug/${encodeURIComponent(slug)}`)
  if (res.status === 404) return null
  if (res.status === 503) throw new Error('SERVICE_UNAVAILABLE')
  if (!res.ok) throw new Error('Failed to load column scrap')
  const row = (await res.json()) as Record<string, unknown>
  return mapItem(row)
}

export async function createColumnScrap(
  token: string,
  body: {
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
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Create failed')
  }
  const row = (await res.json()) as Record<string, unknown>
  return mapItem(row)
}

export async function updateColumnScrap(
  token: string,
  id: string,
  body: Partial<{
    title: string
    url: string
    sourceKind: ColumnSourceKind
    summary: string | null
    bodyMd: string | null
    coverImageUrl: string | null
    tags: string[]
    extraLinks: ColumnScrapExtraLink[]
    slug: string | null
  }>
): Promise<ColumnScrap> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Update failed')
  }
  const row = (await res.json()) as Record<string, unknown>
  return mapItem(row)
}

export async function deleteColumnScrap(token: string, id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.ok
}

/** 로컬 Ollama: URL만으로 제목·요약·본문 메모·형식·표지·태그 제안 */
export interface ColumnScrapAiFill {
  title: string
  summary: string
  bodyMd: string
  sourceKind: ColumnSourceKind
  coverImageUrl: string | null
  tags: string[]
  rawResponse?: string
}

export async function suggestColumnScrapAiFill(
  token: string,
  url: string
): Promise<ColumnScrapAiFill> {
  const res = await fetch(`${API_BASE}/ai-fill`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ url }),
  })
  const errJson = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((errJson as { error?: string }).error || 'AI 채우기 실패')
  }
  const data = errJson as Record<string, unknown>
  const tagsRaw = data.tags
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5)
    : []
  const sk = data.sourceKind
  const sourceKind: ColumnSourceKind =
    typeof sk === 'string' && COLUMN_SOURCE_OPTIONS.some((o) => o.value === sk)
      ? (sk as ColumnSourceKind)
      : 'article'

  return {
    title: String(data.title ?? ''),
    summary: String(data.summary ?? ''),
    bodyMd: String(data.bodyMd ?? ''),
    sourceKind,
    coverImageUrl:
      data.coverImageUrl != null && String(data.coverImageUrl).trim()
        ? String(data.coverImageUrl)
        : null,
    tags,
    rawResponse: data.rawResponse != null ? String(data.rawResponse) : undefined,
  }
}
