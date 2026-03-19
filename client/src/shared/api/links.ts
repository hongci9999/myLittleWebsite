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

/** AI 제목·설명·분류 추천 (URL만 있어도 됨) */
export async function suggestLinkMeta(
  token: string,
  url: string,
  title?: string
): Promise<{ title: string; description: string; valueIds: string[]; rawResponse?: string } | null> {
  const res = await fetch(`${API_BASE}/ai-suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ url, title: title ?? '' }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data as { title: string; description: string; valueIds: string[]; rawResponse?: string }
}

/** 새 태그 추가 (목적 또는 종류). 이미 있으면 기존 id 반환 */
export async function createTag(
  token: string,
  label: string,
  dimensionSlug: 'purpose' | 'medium'
): Promise<{ id: string; label: string } | null> {
  const res = await fetch(`${API_BASE}/values`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ label: label.trim(), dimensionSlug }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data as { id: string; label: string }
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
