import * as cheerio from 'cheerio'

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

type D2HelloWorldCache = {
  expiresAt: number
  items: D2HelloWorldVideo[]
}

const DEFAULT_ATOM_URL = 'https://d2.naver.com/d2.atom'
const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 30
const MAX_LIMIT = 5
const MIN_LIMIT = 1
const HELLO_WORLD_CATEGORY = 'hello world'

let cache: D2HelloWorldCache | null = null

function getAtomUrl(): string {
  const fromEnv = process.env.D2_HELLOWORLD_ATOM_URL?.trim()
  return fromEnv || DEFAULT_ATOM_URL
}

function getCacheTtlMs(): number {
  const parsed = Number(process.env.D2_HELLOWORLD_CACHE_TTL_MS)
  if (Number.isFinite(parsed) && parsed > 0) return parsed
  return DEFAULT_CACHE_TTL_MS
}

export function parseLimit(input: unknown, fallback = 1): number {
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

function extractVideoClipId(contentHtml: string): string {
  const match = contentHtml.match(/tv\.naver\.com\/embed\/(\d+)/)
  return match?.[1] ?? ''
}

function extractSummary(contentHtml: string): string {
  const $ = cheerio.load(contentHtml)
  let summary = ''

  $('h4').each((_, el) => {
    if (summary) return
    const heading = $(el).text().replace(/\s+/g, ' ').trim()
    if (!heading.includes('발표 내용')) return
    summary = $(el).next('p').first().text().replace(/\s+/g, ' ').trim()
  })

  if (summary) return summary

  return $('p')
    .first()
    .text()
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchNaverTvThumbnail(clipId: string): Promise<string> {
  if (!clipId) return ''

  try {
    const oembedUrl = new URL('https://tv.naver.com/oembed')
    oembedUrl.searchParams.set('url', `https://tv.naver.com/v/${clipId}`)
    oembedUrl.searchParams.set('format', 'json')

    const res = await fetch(oembedUrl.href, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'myLittleWebsite/1.0 (+https://d2.naver.com/helloworld)',
        Accept: 'application/json',
      },
    })

    if (!res.ok) return ''

    const data = (await res.json()) as { thumbnail_url?: string }
    return asAbsoluteHttpUrl(data.thumbnail_url)
  } catch {
    return ''
  }
}

async function fetchHelloWorldVideosFromAtom(): Promise<D2HelloWorldVideo[]> {
  const atomUrl = getAtomUrl()
  const res = await fetch(atomUrl, {
    signal: AbortSignal.timeout(10000),
    headers: {
      'User-Agent': 'myLittleWebsite/1.0 (+https://d2.naver.com/helloworld)',
      Accept: 'application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    },
  })

  if (!res.ok) {
    throw new Error(`D2 Atom request failed (${res.status})`)
  }

  const xml = await res.text()
  const $ = cheerio.load(xml, { xmlMode: true })
  const unique = new Set<string>()
  const items: D2HelloWorldVideo[] = []

  $('entry').each((_, el) => {
    const node = $(el)
    const category = node.find('category').first().attr('term')?.trim().toLowerCase()
    if (category !== HELLO_WORLD_CATEGORY) return

    const title = node.find('title').first().text().trim()
    const url = asAbsoluteHttpUrl(
      node.find('link[rel="alternate"]').first().attr('href')?.trim() ||
        node.find('link').first().attr('href')?.trim()
    )
    const contentHtml = node.find('content').first().text().trim()
    const videoClipId = extractVideoClipId(contentHtml)
    if (!title || !url || !videoClipId || unique.has(url)) return

    unique.add(url)
    items.push({
      title,
      url,
      publishedAt: normalizeDate(node.find('updated').first().text()),
      summary: extractSummary(contentHtml),
      videoEmbedUrl: `https://tv.naver.com/embed/${videoClipId}`,
      videoClipId,
      thumbnailUrl: '',
      source: 'd2-helloworld',
    })
  })

  items.sort((a, b) => {
    const aTime = Date.parse(a.publishedAt)
    const bTime = Date.parse(b.publishedAt)
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime)
  })

  if (items.length > 0) {
    items[0].thumbnailUrl = await fetchNaverTvThumbnail(items[0].videoClipId)
  }

  return items
}

export async function fetchD2HelloWorldLatest(limit = 1): Promise<D2HelloWorldVideo[]> {
  const now = Date.now()
  const safeLimit = parseLimit(limit, 1)

  if (cache && cache.expiresAt > now && cache.items.length > 0) {
    return cache.items.slice(0, safeLimit)
  }

  const items = await fetchHelloWorldVideosFromAtom()
  cache = {
    expiresAt: now + getCacheTtlMs(),
    items,
  }
  return items.slice(0, safeLimit)
}
