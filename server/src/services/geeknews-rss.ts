import * as cheerio from 'cheerio'

export type GeekNewsItem = {
  title: string
  url: string
  publishedAt: string
  source: 'geeknews'
}

type GeekNewsCache = {
  expiresAt: number
  items: GeekNewsItem[]
}

const DEFAULT_GEEKNEWS_RSS_URL = 'https://news.hada.io/rss/news'
const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 15
const MAX_LIMIT = 20
const MIN_LIMIT = 1

let cache: GeekNewsCache | null = null

function getRssUrl(): string {
  const fromEnv = process.env.GEEKNEWS_RSS_URL?.trim()
  return fromEnv || DEFAULT_GEEKNEWS_RSS_URL
}

function getCacheTtlMs(): number {
  const parsed = Number(process.env.GEEKNEWS_RSS_CACHE_TTL_MS)
  if (Number.isFinite(parsed) && parsed > 0) return parsed
  return DEFAULT_CACHE_TTL_MS
}

export function parseLimit(input: unknown, fallback = 5): number {
  const parsed = Number(input)
  if (!Number.isFinite(parsed)) return fallback
  const limit = Math.trunc(parsed)
  if (limit < MIN_LIMIT || limit > MAX_LIMIT) {
    throw new Error(`limit must be between ${MIN_LIMIT} and ${MAX_LIMIT}`)
  }
  return limit
}

function normalizeDate(raw?: string): string {
  if (!raw?.trim()) return ''
  const date = new Date(raw.trim())
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function asAbsoluteHttpUrl(raw?: string): string {
  if (!raw?.trim()) return ''
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.href
  } catch {
    return ''
  }
}

async function fetchGeekNewsFromRss(): Promise<GeekNewsItem[]> {
  const rssUrl = getRssUrl()
  const res = await fetch(rssUrl, {
    signal: AbortSignal.timeout(10000),
    headers: {
      'User-Agent': 'myLittleWebsite/1.0 (+https://news.hada.io)',
      Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    },
  })

  if (!res.ok) {
    throw new Error(`GeekNews RSS request failed (${res.status})`)
  }

  const xml = await res.text()
  const $ = cheerio.load(xml, { xmlMode: true })
  const unique = new Set<string>()
  const items: GeekNewsItem[] = []

  $('item, entry').each((_, el) => {
    const node = $(el)
    const title = node.find('title').first().text().trim()
    const rawLink =
      node.find('link').first().text().trim() ||
      node.find('link').first().attr('href')?.trim() ||
      node.find('id').first().text().trim()
    const url = asAbsoluteHttpUrl(rawLink)
    if (!title || !url || unique.has(url)) return

    const publishedAt = normalizeDate(
      node.find('pubDate').first().text() ||
        node.find('published').first().text() ||
        node.find('updated').first().text()
    )

    unique.add(url)
    items.push({
      title,
      url,
      publishedAt,
      source: 'geeknews',
    })
  })

  return items
}

export async function fetchGeekNewsLatest(limit = 5): Promise<GeekNewsItem[]> {
  const now = Date.now()
  const safeLimit = parseLimit(limit, 5)

  if (cache && cache.expiresAt > now && cache.items.length > 0) {
    return cache.items.slice(0, safeLimit)
  }

  const items = await fetchGeekNewsFromRss()
  cache = {
    expiresAt: now + getCacheTtlMs(),
    items,
  }
  return items.slice(0, safeLimit)
}
