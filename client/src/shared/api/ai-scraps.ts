import {
  aiProviderBodyField,
  aiProviderRequestHeaders,
} from '@/shared/lib/ai-provider-preference'

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
    ...aiProviderRequestHeaders(),
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

/** 로컬 Ollama: URL만으로 제목·요약·본문·종류·태그 제안 */
export interface AiToolScrapAiFill {
  title: string
  summary: string
  bodyMd: string
  sourceKind: SourceKind
  tags: string[]
  rawResponse?: string
}

export async function suggestAiToolScrapAiFill(
  token: string,
  url: string
): Promise<AiToolScrapAiFill> {
  const res = await fetch(`${API_BASE}/ai-fill`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ url, ...aiProviderBodyField() }),
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
  const sourceKind: SourceKind =
    typeof sk === 'string' && SOURCE_KIND_OPTIONS.some((o) => o.value === sk)
      ? (sk as SourceKind)
      : 'doc'

  return {
    title: String(data.title ?? ''),
    summary: String(data.summary ?? ''),
    bodyMd: String(data.bodyMd ?? ''),
    sourceKind,
    tags,
    rawResponse: data.rawResponse != null ? String(data.rawResponse) : undefined,
  }
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
