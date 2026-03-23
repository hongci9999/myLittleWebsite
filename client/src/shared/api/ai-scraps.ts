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

const API_BASE = '/api/ai-scraps'

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function fetchAiScraps(params?: {
  q?: string
  kind?: SourceKind | ''
  tag?: string
}): Promise<AiToolScrap[]> {
  const sp = new URLSearchParams()
  if (params?.q?.trim()) sp.set('q', params.q.trim())
  if (params?.kind) sp.set('kind', params.kind)
  if (params?.tag?.trim()) sp.set('tag', params.tag.trim())
  const qs = sp.toString()
  const res = await fetch(`${API_BASE}${qs ? `?${qs}` : ''}`)
  if (res.status === 503) {
    throw new Error('SERVICE_UNAVAILABLE')
  }
  if (!res.ok) throw new Error('Failed to load scraps')
  return res.json() as Promise<AiToolScrap[]>
}

export async function fetchAiScrapBySlug(slug: string): Promise<AiToolScrap | null> {
  const res = await fetch(
    `${API_BASE}/by-slug/${encodeURIComponent(slug)}`
  )
  if (res.status === 404) return null
  if (res.status === 503) throw new Error('SERVICE_UNAVAILABLE')
  if (!res.ok) throw new Error('Failed to load scrap')
  return res.json() as Promise<AiToolScrap>
}

export async function createAiScrap(
  token: string,
  body: {
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
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Create failed')
  }
  return res.json() as Promise<AiToolScrap>
}

export async function updateAiScrap(
  token: string,
  id: string,
  body: Partial<{
    title: string
    url: string
    sourceKind: SourceKind
    summary: string | null
    bodyMd: string | null
    extraLinks: { label: string; url: string }[]
    tags: string[]
    slug: string | null
  }>
): Promise<AiToolScrap> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Update failed')
  }
  return res.json() as Promise<AiToolScrap>
}

export async function deleteAiScrap(token: string, id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return res.ok
}

export const SOURCE_KIND_OPTIONS: { value: SourceKind; label: string }[] = [
  { value: 'mcp', label: 'MCP' },
  { value: 'skill', label: '스킬 / 스킬 팩' },
  { value: 'rules', label: 'Cursor Rules' },
  { value: 'cli', label: 'CLI / 에이전트 CLI' },
  { value: 'doc', label: '문서' },
  { value: 'repo', label: 'Git 저장소' },
  { value: 'other', label: '기타' },
]

export function sourceKindLabel(kind: SourceKind): string {
  return SOURCE_KIND_OPTIONS.find((o) => o.value === kind)?.label ?? kind
}
