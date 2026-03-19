const API_BASE = '/api/links'

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
  return data as LinkWithValues[]
}

/** AI 설명·분류 추천 */
export async function suggestLinkMeta(
  token: string,
  url: string,
  title: string
): Promise<{ description: string; valueIds: string[] } | null> {
  const res = await fetch(`${API_BASE}/ai-suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ url, title }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data as { description: string; valueIds: string[] }
}

/** 링크 추가 */
export async function createLink(
  token: string,
  data: { url: string; title: string; description?: string; valueIds?: string[] }
): Promise<LinkWithValues | null> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  })
  if (!res.ok) return null
  const link = await res.json()
  return {
    ...link,
    valueIds: data.valueIds ?? [],
    sortOrder: link.sort_order ?? 0,
    createdAt: link.created_at ?? link.createdAt,
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
  }
): Promise<LinkWithValues | null> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  })
  if (!res.ok) return null
  const link = await res.json()
  return {
    ...link,
    valueIds: data.valueIds ?? link.valueIds ?? [],
    sortOrder: link.sort_order ?? link.sortOrder ?? 0,
    createdAt: link.created_at ?? link.createdAt,
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
