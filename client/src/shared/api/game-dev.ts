import { apiUrl } from '@/shared/api/base'

export type MediaKind = 'youtube' | 'article' | 'repo' | 'blog' | 'doc' | 'book' | 'other'

export type Category =
  | 'graphics' | 'physics' | 'ai' | 'gameplay' | 'engine'
  | 'network' | 'sound' | 'optimization' | 'etc'

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

const API_BASE = apiUrl('/api/game-dev-resources')

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function fetchGameDevResources(params?: {
  q?: string
  kind?: MediaKind | ''
  category?: Category | ''
}): Promise<GameDevResource[]> {
  const sp = new URLSearchParams()
  if (params?.q?.trim()) sp.set('q', params.q.trim())
  if (params?.kind) sp.set('kind', params.kind)
  if (params?.category) sp.set('category', params.category)
  const qs = sp.toString()
  const res = await fetch(`${API_BASE}${qs ? `?${qs}` : ''}`)
  if (res.status === 503) throw new Error('SERVICE_UNAVAILABLE')
  if (!res.ok) throw new Error('Failed to load resources')
  return res.json() as Promise<GameDevResource[]>
}

export async function fetchGameDevResourceBySlug(slug: string): Promise<GameDevResource | null> {
  const res = await fetch(`${API_BASE}/by-slug/${encodeURIComponent(slug)}`)
  if (res.status === 404) return null
  if (res.status === 503) throw new Error('SERVICE_UNAVAILABLE')
  if (!res.ok) throw new Error('Failed to load resource')
  return res.json() as Promise<GameDevResource>
}

export async function createGameDevResource(
  token: string,
  body: {
    title: string; url: string; mediaKind: MediaKind; category: Category
    summary?: string | null; bodyMd?: string | null
    extraLinks?: { label: string; url: string }[]; tags?: string[]; slug?: string | null
  }
): Promise<GameDevResource> {
  const res = await fetch(API_BASE, { method: 'POST', headers: authHeaders(token), body: JSON.stringify(body) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Create failed')
  }
  return res.json() as Promise<GameDevResource>
}

export async function updateGameDevResource(
  token: string,
  id: string,
  body: Partial<{
    title: string; url: string; mediaKind: MediaKind; category: Category
    summary: string | null; bodyMd: string | null
    extraLinks: { label: string; url: string }[]; tags: string[]; slug: string | null
  }>
): Promise<GameDevResource> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Update failed')
  }
  return res.json() as Promise<GameDevResource>
}

export async function deleteGameDevResource(token: string, id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders(token) })
  return res.ok
}

export const MEDIA_KIND_OPTIONS: { value: MediaKind; label: string }[] = [
  { value: 'youtube', label: '유튜브' },
  { value: 'article', label: '기사' },
  { value: 'repo', label: 'Git 저장소' },
  { value: 'blog', label: '블로그글' },
  { value: 'doc', label: '문서 / 공식' },
  { value: 'book', label: '책 / 강의' },
  { value: 'other', label: '기타' },
]

export function mediaKindLabel(kind: MediaKind): string {
  return MEDIA_KIND_OPTIONS.find((o) => o.value === kind)?.label ?? kind
}

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'graphics', label: '그래픽스·렌더링' },
  { value: 'physics', label: '물리' },
  { value: 'ai', label: 'AI' },
  { value: 'gameplay', label: '게임플레이·설계' },
  { value: 'engine', label: '엔진·툴' },
  { value: 'network', label: '네트워크' },
  { value: 'sound', label: '사운드' },
  { value: 'optimization', label: '최적화' },
  { value: 'etc', label: '기타' },
]

export function categoryLabel(c: Category): string {
  return CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c
}
