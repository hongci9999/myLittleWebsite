import { fetchLatestFromRssFeed } from './rss-feed.js'

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

type TechBlogSourceConfig = {
  id: TechBlogSourceId
  label: string
  homeUrl: string
  feedUrl: string
}

type TechBlogsCache = {
  expiresAt: number
  items: TechBlogPost[]
}

const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 30

const TECH_BLOG_SOURCES: TechBlogSourceConfig[] = [
  {
    id: 'github-blog',
    label: 'GitHub Blog',
    homeUrl: 'https://github.blog/',
    feedUrl: 'https://github.blog/feed/',
  },
  {
    id: 'nvidia-blog',
    label: 'NVIDIA Blog',
    homeUrl: 'https://developer.nvidia.com/blog/',
    feedUrl: 'https://developer.nvidia.com/blog/feed/',
  },
  {
    id: 'technologyreview-kr',
    label: 'MIT Technology Review',
    homeUrl: 'https://www.technologyreview.kr/',
    feedUrl: 'https://www.technologyreview.kr/feed/',
  },
  {
    id: 'google-dev-kr',
    label: 'Google Developers KR',
    homeUrl: 'https://developers-kr.googleblog.com/',
    feedUrl: 'https://developers-kr.googleblog.com/feeds/posts/default?alt=rss',
  },
]

let cache: TechBlogsCache | null = null

function getCacheTtlMs(): number {
  const parsed = Number(process.env.TECH_BLOGS_CACHE_TTL_MS)
  if (Number.isFinite(parsed) && parsed > 0) return parsed
  return DEFAULT_CACHE_TTL_MS
}

async function fetchLatestForSource(source: TechBlogSourceConfig): Promise<TechBlogPost | null> {
  try {
    const [item] = await fetchLatestFromRssFeed(
      source.feedUrl,
      1,
      `myLittleWebsite/1.0 (+${source.homeUrl})`
    )
    if (!item) return null

    return {
      ...item,
      source: source.id,
      sourceLabel: source.label,
      sourceHomeUrl: source.homeUrl,
    }
  } catch (err) {
    console.error(`[tech-blogs] ${source.id} feed error:`, err)
    return null
  }
}

export async function fetchTechBlogsLatest(): Promise<TechBlogPost[]> {
  const now = Date.now()

  if (cache && cache.expiresAt > now && cache.items.length > 0) {
    return cache.items
  }

  const results = await Promise.all(TECH_BLOG_SOURCES.map(fetchLatestForSource))
  const items = results.filter((item): item is TechBlogPost => item !== null)

  cache = {
    expiresAt: now + getCacheTtlMs(),
    items,
  }

  return items
}
