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

export type TechBlogSourceId =
  | 'github-blog'
  | 'nvidia-blog'
  | 'technologyreview-kr'
  | 'google-dev-kr'

export type TechBlogPost = {
  title: string
  url: string
  publishedAt: string
  summary: string
  thumbnailUrl: string
  source: TechBlogSourceId
  sourceLabel: string
  sourceHomeUrl: string
}

export type TechFeedLatest = {
  d2Video: D2HelloWorldVideo | null
  blogs: TechBlogPost[]
}

const TECH_FEED_CACHE_TTL_MS = 1000 * 60 * 15
const TECH_FEED_CACHE_KEY = 'd2-helloworld:tech-feed'

export async function fetchTechFeedLatest(): Promise<TechFeedLatest> {
  const res = await fetch(`${API_BASE}/latest`)
  if (!res.ok) return { d2Video: null, blogs: [] }
  const data = await res.json()
  return data as TechFeedLatest
}

export function getCachedTechFeedLatest(): TechFeedLatest | null {
  return getCachedResource<TechFeedLatest>(TECH_FEED_CACHE_KEY)
}

export async function fetchTechFeedLatestCached(): Promise<TechFeedLatest> {
  return fetchWithResourceCache({
    key: TECH_FEED_CACHE_KEY,
    ttlMs: TECH_FEED_CACHE_TTL_MS,
    fetcher: () => fetchTechFeedLatest(),
  })
}

/** @deprecated use fetchTechFeedLatest */
export async function fetchD2HelloWorldLatest(limit = 1): Promise<D2HelloWorldVideo[]> {
  const feed = await fetchTechFeedLatest()
  if (!feed.d2Video) return []
  return limit > 0 ? [feed.d2Video] : []
}

/** @deprecated use getCachedTechFeedLatest */
export function getCachedD2HelloWorldLatest(limit = 1): D2HelloWorldVideo[] | null {
  const cached = getCachedTechFeedLatest()
  if (!cached?.d2Video) return null
  return limit > 0 ? [cached.d2Video] : []
}

/** @deprecated use fetchTechFeedLatestCached */
export async function fetchD2HelloWorldLatestCached(
  limit = 1
): Promise<D2HelloWorldVideo[]> {
  const feed = await fetchTechFeedLatestCached()
  if (!feed.d2Video) return []
  return limit > 0 ? [feed.d2Video] : []
}
