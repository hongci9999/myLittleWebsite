import {
  fetchWithResourceCache,
  getCachedResource,
} from '@/shared/lib/resource-cache'
import { apiUrl } from '@/shared/api/base'

const API_BASE = apiUrl('/api/d2-helloworld')

export type D2HelloWorldVideo = {
  title: string
  url: string
  publishedAt: string
  summary: string
  videoEmbedUrl: string
  videoClipId: string
  thumbnailUrl: string
  source: 'd2-helloworld'
}

const D2_HELLOWORLD_CACHE_TTL_MS = 1000 * 60 * 15
const d2HelloWorldCacheKey = (limit: number) => `d2-helloworld:latest:${limit}`

export async function fetchD2HelloWorldLatest(limit = 1): Promise<D2HelloWorldVideo[]> {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  const res = await fetch(`${API_BASE}/latest?${params.toString()}`)
  if (!res.ok) return []
  const data = await res.json()
  return data as D2HelloWorldVideo[]
}

export function getCachedD2HelloWorldLatest(limit = 1): D2HelloWorldVideo[] | null {
  return getCachedResource<D2HelloWorldVideo[]>(d2HelloWorldCacheKey(limit))
}

export async function fetchD2HelloWorldLatestCached(
  limit = 1
): Promise<D2HelloWorldVideo[]> {
  return fetchWithResourceCache({
    key: d2HelloWorldCacheKey(limit),
    ttlMs: D2_HELLOWORLD_CACHE_TTL_MS,
    fetcher: () => fetchD2HelloWorldLatest(limit),
  })
}
