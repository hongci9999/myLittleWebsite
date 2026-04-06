import {
  fetchWithResourceCache,
  getCachedResource,
} from '@/shared/lib/resource-cache'
const API_BASE = '/api/geeknews'

export type GeekNewsItem = {
  title: string
  url: string
  publishedAt: string
  source: 'geeknews'
}

const GEEKNEWS_CACHE_TTL_MS = 1000 * 60 * 5
const geekNewsCacheKey = (limit: number) => `geeknews:latest:${limit}`

export async function fetchGeekNewsLatest(limit = 5): Promise<GeekNewsItem[]> {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  const res = await fetch(`${API_BASE}/latest?${params.toString()}`)
  if (!res.ok) return []
  const data = await res.json()
  return data as GeekNewsItem[]
}

export function getCachedGeekNewsLatest(limit = 5): GeekNewsItem[] | null {
  return getCachedResource<GeekNewsItem[]>(geekNewsCacheKey(limit))
}

export async function fetchGeekNewsLatestCached(limit = 5): Promise<GeekNewsItem[]> {
  return fetchWithResourceCache({
    key: geekNewsCacheKey(limit),
    ttlMs: GEEKNEWS_CACHE_TTL_MS,
    fetcher: () => fetchGeekNewsLatest(limit),
  })
}
