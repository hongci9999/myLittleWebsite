import {
  aiProviderBodyField,
  aiProviderRequestHeaders,
} from '@/shared/lib/ai-provider-preference'
import {
  fetchWithResourceCache,
  getCachedResource,
} from '@/shared/lib/resource-cache'

const API_BASE = '/api/links'
const FEATURED_LINKS_CACHE_KEY = 'links:featured'
const FEATURED_LINKS_CACHE_TTL_MS = 1000 * 60 * 5

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

/** ValueTree에서 id, label을 평면 배열로 수집 (재사용) */
export function collectValueIds(nodes: ValueTree[]): { id: string; label: string }[] {
  const result: { id: string; label: string }[] = []
  const walk = (items: ValueTree[]) => {
    for (const v of items) {
      result.push({ id: v.id, label: v.label })
      if (v.children?.length) walk(v.children)
    }
  }
  walk(nodes)
  return result
}

/** valueId → { label, dimensionLabel } 매핑. 링크 카드에서 목적/종류/태그 구분 표시용 */
export function buildValueIdToMeta(
  dimensions: DimensionWithValues[]
): Record<string, { label: string; dimensionLabel: string }> {
  const map: Record<string, { label: string; dimensionLabel: string }> = {}
  const walk = (items: ValueTree[], dimLabel: string) => {
    for (const v of items) {
      map[v.id] = { label: v.label, dimensionLabel: dimLabel }
      if (v.children?.length) walk(v.children, dimLabel)
    }
  }
  for (const d of dimensions) {
    walk(d.values ?? [], d.label)
  }
  return map
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
  /** 서버가 페이지 HTML에서 추출해 저장한 파비콘 절대 URL */
  faviconUrl?: string | null
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

/** 분류 축 + 값 트리 조회 */
export async function fetchDimensions(): Promise<DimensionWithValues[]> {
  const res = await fetch(`${API_BASE}/dimensions`)
  if (!res.ok) return []
  const data = await res.json()
  return data as DimensionWithValues[]
}

/** 메인 추천 링크 목록 조회 (공개) */
export async function fetchFeaturedLinks(): Promise<LinkWithValues[]> {
  const res = await fetch(`${API_BASE}/featured`)
  if (!res.ok) return []
  const data = await res.json()
  return (data as LinkWithValues[]).map((l) => {
    const row = l as LinkWithValues & { favicon_url?: string | null }
    return {
      ...l,
      sortOrder: l.sortOrder ?? (l as { sort_order?: number }).sort_order ?? 0,
      createdAt: l.createdAt ?? (l as { created_at?: string }).created_at ?? '',
      valueIds: l.valueIds ?? [],
      faviconUrl: l.faviconUrl ?? row.favicon_url ?? null,
    }
  })
}

export function getCachedFeaturedLinks(): LinkWithValues[] | null {
  return getCachedResource<LinkWithValues[]>(FEATURED_LINKS_CACHE_KEY)
}

export async function fetchFeaturedLinksCached(): Promise<LinkWithValues[]> {
  return fetchWithResourceCache({
    key: FEATURED_LINKS_CACHE_KEY,
    ttlMs: FEATURED_LINKS_CACHE_TTL_MS,
    fetcher: fetchFeaturedLinks,
  })
}

/** 링크 목록 조회 */
export async function fetchLinks(filters?: {
  valueIds?: string[]
  q?: string
}): Promise<LinkWithValues[]> {
  const params = new URLSearchParams()
  if (filters?.valueIds?.length) {
    params.set('valueIds', filters.valueIds.join(','))
  }
  if (filters?.q?.trim()) {
    params.set('q', filters.q.trim())
  }
  const url = params.toString() ? `${API_BASE}?${params}` : API_BASE
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return (data as LinkWithValues[]).map((l) => {
    const row = l as LinkWithValues & { favicon_url?: string | null }
    return {
      ...l,
      sortOrder: l.sortOrder ?? (l as { sort_order?: number }).sort_order ?? 0,
      createdAt: l.createdAt ?? (l as { created_at?: string }).created_at ?? '',
      valueIds: l.valueIds ?? [],
      faviconUrl: l.faviconUrl ?? row.favicon_url ?? null,
    }
  })
}

/** AI 제목·설명·파비콘·분류 태그(valueIds) 추천 (URL만 있어도 됨) */
export async function suggestLinkMeta(
  token: string,
  url: string,
  title?: string
): Promise<{
  title: string
  description: string
  valueIds?: string[]
  rawResponse?: string
  faviconUrl?: string | null
}> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/ai-suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
        ...aiProviderRequestHeaders(),
      },
      body: JSON.stringify({ url, title: title ?? '', ...aiProviderBodyField() }),
    })
  } catch {
    throw new Error(
      'API 서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인하세요. 저장소 루트에서 `npm run dev`를 쓰면 클라이언트와 API가 함께 올라갑니다.'
    )
  }

  const rawText = await res.text()
  let body: unknown = {}
  if (rawText.trim()) {
    try {
      body = JSON.parse(rawText) as unknown
    } catch {
      body = {}
    }
  }

  const serverError =
    body &&
    typeof body === 'object' &&
    'error' in body &&
    typeof (body as { error: unknown }).error === 'string'
      ? (body as { error: string }).error.trim()
      : ''

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(
        serverError || '인증이 필요합니다. 로그인이 만료되었을 수 있으니 다시 로그인한 뒤 시도하세요.'
      )
    }
    if (res.status === 503) {
      throw new Error(
        serverError ||
          'AI를 사용할 수 없습니다. 로컬 모드면 Ollama 실행·모델(`OLLAMA_MODEL`)을, API 모드면 서버의 Gemini 키 설정을 확인하세요.'
      )
    }
    throw new Error(serverError || `AI 추천 요청 실패 (${res.status})`)
  }

  return body as {
    title: string
    description: string
    valueIds?: string[]
    rawResponse?: string
    faviconUrl?: string | null
  }
}

/** 새 태그 추가 (목적 또는 종류). 이미 있으면 기존 id 반환. 목적만 parentId(상위 태그 id) 가능 */
export async function createTag(
  token: string,
  label: string,
  dimensionSlug: 'purpose' | 'medium',
  parentId?: string | null
): Promise<{ id: string; label: string } | null> {
  const res = await fetch(`${API_BASE}/values`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({
      label: label.trim(),
      dimensionSlug,
      ...(parentId ? { parentId } : {}),
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data as { id: string; label: string }
}

/** 태그 이름 수정 (목적·종류) */
export async function updateTag(
  token: string,
  valueId: string,
  label: string
): Promise<boolean> {
  const res = await fetch(
    `${API_BASE}/values/${encodeURIComponent(valueId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ label: label.trim() }),
    }
  )
  return res.status === 204
}

/** 태그 삭제 (목적·종류). 링크 연결·하위 태그 CASCADE */
export async function deleteTag(
  token: string,
  valueId: string
): Promise<boolean> {
  const res = await fetch(
    `${API_BASE}/values/${encodeURIComponent(valueId)}`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
    }
  )
  return res.status === 204
}

/** 링크 추가 */
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
): Promise<LinkWithValues | null> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  })
  if (!res.ok) return null
  const link = await res.json()
  const row = link as LinkWithValues & { favicon_url?: string | null }
  return {
    ...link,
    valueIds: data.valueIds ?? [],
    sortOrder: link.sort_order ?? 0,
    createdAt: link.created_at ?? link.createdAt,
    isFeatured: link.is_featured ?? link.isFeatured ?? false,
    featuredSortOrder: link.featured_sort_order ?? link.featuredSortOrder ?? 0,
    faviconUrl: link.faviconUrl ?? row.favicon_url ?? null,
  } as LinkWithValues
}

/** 링크 수정 */
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
): Promise<LinkWithValues | null> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  })
  if (!res.ok) return null
  const link = await res.json()
  const row = link as LinkWithValues & { favicon_url?: string | null }
  return {
    ...link,
    valueIds: data.valueIds ?? link.valueIds ?? [],
    sortOrder: link.sort_order ?? link.sortOrder ?? 0,
    createdAt: link.created_at ?? link.createdAt,
    isFeatured: link.is_featured ?? link.isFeatured ?? false,
    featuredSortOrder: link.featured_sort_order ?? link.featuredSortOrder ?? 0,
    faviconUrl: link.faviconUrl ?? row.favicon_url ?? null,
  } as LinkWithValues
}

/** 링크 삭제 */
export async function deleteLink(token: string, id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return res.ok
}
