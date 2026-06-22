import {
  aiProviderBodyField,
  aiProviderRequestHeaders,
} from '@/shared/lib/ai-provider-preference'
import { apiUrl } from '@/shared/api/base'

export type MediaKind = 'youtube' | 'article' | 'repo' | 'blog' | 'doc' | 'book' | 'asset' | 'other'

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
  coverImageUrl: string | null
  extraLinks: { label: string; url: string }[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

const API_BASE = apiUrl('/api/game-dev-resources')

function mapResource(raw: Record<string, unknown>): GameDevResource {
  const tagsRaw = raw.tags
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.filter((t): t is string => typeof t === 'string').map((t) => t.trim()).filter(Boolean)
    : []
  const extraRaw = raw.extraLinks ?? raw.extra_links
  const extraLinks = Array.isArray(extraRaw)
    ? extraRaw
        .filter((x): x is { label?: unknown; url?: unknown } => x != null && typeof x === 'object')
        .map((x) => ({
          label: typeof x.label === 'string' && x.label.trim() ? x.label.trim() : '링크',
          url: typeof x.url === 'string' ? x.url.trim() : '',
        }))
        .filter((x) => x.url)
    : []
  return {
    id: String(raw.id),
    slug: String(raw.slug),
    title: String(raw.title),
    url: String(raw.url),
    mediaKind: raw.mediaKind as MediaKind,
    category: raw.category as Category,
    summary: raw.summary != null ? String(raw.summary) : null,
    bodyMd: raw.bodyMd != null ? String(raw.bodyMd) : null,
    coverImageUrl:
      raw.coverImageUrl != null && String(raw.coverImageUrl).trim()
        ? String(raw.coverImageUrl)
        : raw.cover_image_url != null && String(raw.cover_image_url).trim()
          ? String(raw.cover_image_url)
          : null,
    extraLinks,
    tags,
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ''),
  }
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...aiProviderRequestHeaders(),
  }
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
  const data = (await res.json()) as Record<string, unknown>[]
  return data.map((row) => mapResource(row))
}

export async function fetchGameDevResourceBySlug(slug: string): Promise<GameDevResource | null> {
  const res = await fetch(`${API_BASE}/by-slug/${encodeURIComponent(slug)}`)
  if (res.status === 404) return null
  if (res.status === 503) throw new Error('SERVICE_UNAVAILABLE')
  if (!res.ok) throw new Error('Failed to load resource')
  const row = (await res.json()) as Record<string, unknown>
  return mapResource(row)
}

export async function createGameDevResource(
  token: string,
  body: {
    title: string; url: string; mediaKind: MediaKind; category: Category
    summary?: string | null; bodyMd?: string | null; coverImageUrl?: string | null
    extraLinks?: { label: string; url: string }[]; tags?: string[]; slug?: string | null
  }
): Promise<GameDevResource> {
  const res = await fetch(API_BASE, { method: 'POST', headers: authHeaders(token), body: JSON.stringify(body) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Create failed')
  }
  return mapResource((await res.json()) as Record<string, unknown>)
}

export async function updateGameDevResource(
  token: string,
  id: string,
  body: Partial<{
    title: string; url: string; mediaKind: MediaKind; category: Category
    summary: string | null; bodyMd: string | null; coverImageUrl: string | null
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
  return mapResource((await res.json()) as Record<string, unknown>)
}

export async function deleteGameDevResource(token: string, id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders(token) })
  return res.ok
}

/** URL 또는 Obsidian 클립으로 제목·요약·본문·형식·분야·표지·태그 제안 */
export interface GameDevResourceAiFill {
  title: string
  summary: string
  bodyMd: string
  mediaKind: MediaKind
  category: Category
  coverImageUrl: string | null
  tags: string[]
  rawResponse?: string
}

export async function suggestGameDevResourceAiFill(
  token: string,
  url: string,
  options?: { youtubeClip?: string }
): Promise<GameDevResourceAiFill> {
  const body: Record<string, unknown> = { ...aiProviderBodyField() }
  if (url.trim()) body.url = url.trim()
  if (options?.youtubeClip?.trim()) body.youtubeClip = options.youtubeClip.trim()

  const res = await fetch(`${API_BASE}/ai-fill`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
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
  const mk = data.mediaKind
  const mediaKind: MediaKind =
    typeof mk === 'string' && MEDIA_KIND_OPTIONS.some((o) => o.value === mk)
      ? (mk as MediaKind)
      : 'article'
  const cat = data.category
  const category: Category =
    typeof cat === 'string' && CATEGORY_OPTIONS.some((o) => o.value === cat)
      ? (cat as Category)
      : 'etc'

  return {
    title: String(data.title ?? ''),
    summary: String(data.summary ?? ''),
    bodyMd: String(data.bodyMd ?? ''),
    mediaKind,
    category,
    coverImageUrl:
      data.coverImageUrl != null && String(data.coverImageUrl).trim()
        ? String(data.coverImageUrl)
        : null,
    tags,
    rawResponse: data.rawResponse != null ? String(data.rawResponse) : undefined,
  }
}

export const MEDIA_KIND_OPTIONS: { value: MediaKind; label: string }[] = [
  { value: 'youtube', label: '유튜브' },
  { value: 'article', label: '기사' },
  { value: 'repo', label: 'Git 저장소' },
  { value: 'blog', label: '블로그글' },
  { value: 'doc', label: '문서 / 공식' },
  { value: 'book', label: '책 / 강의' },
  { value: 'asset', label: '에셋' },
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
