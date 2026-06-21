import * as cheerio from 'cheerio'

export type RssFeedItem = {
  title: string
  url: string
  publishedAt: string
  summary: string
  thumbnailUrl: string
}

export function normalizeRssDate(raw?: string): string {
  if (!raw?.trim()) return ''
  const date = new Date(raw.trim())
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

export function asAbsoluteHttpUrl(raw?: string): string {
  if (!raw?.trim()) return ''
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.href
  } catch {
    return ''
  }
}

function stripHtml(html: string): string {
  return cheerio.load(html).text().replace(/\s+/g, ' ').trim()
}

function extractThumbnailFromHtml(html: string): string {
  if (!html?.trim()) return ''
  const $ = cheerio.load(html)
  const src = $('img').first().attr('src')
  return asAbsoluteHttpUrl(src)
}

function readEntryLink(node: cheerio.Cheerio<any>): string {
  const linkText = node.find('link').first().text().trim()
  if (linkText) return linkText

  const linkHref = node.find('link[rel="alternate"]').first().attr('href')?.trim()
  if (linkHref) return linkHref

  return node.find('link').first().attr('href')?.trim() || node.find('id').first().text().trim()
}

function readEntryPublishedAt(node: cheerio.Cheerio<any>): string {
  return normalizeRssDate(
    node.find('pubDate').first().text() ||
      node.find('published').first().text() ||
      node.find('updated').first().text()
  )
}

function readEntrySummary(node: cheerio.Cheerio<any>): string {
  const raw =
    node.find('description').first().text().trim() ||
    node.find('summary').first().text().trim() ||
    node.find('content').first().text().trim()
  if (!raw) return ''
  return stripHtml(raw).slice(0, 280)
}

function readEntryThumbnail(node: cheerio.Cheerio<any>): string {
  const mediaThumb = node.find('media\\:thumbnail, thumbnail').first().attr('url')
  if (mediaThumb) return asAbsoluteHttpUrl(mediaThumb)

  const enclosure = node.find('enclosure[type^="image"]').first().attr('url')
  if (enclosure) return asAbsoluteHttpUrl(enclosure)

  const summaryHtml =
    node.find('summary').first().text().trim() ||
    node.find('description').first().text().trim() ||
    node.find('content').first().text().trim()
  return extractThumbnailFromHtml(summaryHtml)
}

export async function fetchLatestFromRssFeed(
  feedUrl: string,
  limit = 1,
  userAgent = 'myLittleWebsite/1.0'
): Promise<RssFeedItem[]> {
  const res = await fetch(feedUrl, {
    signal: AbortSignal.timeout(10000),
    headers: {
      'User-Agent': userAgent,
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    },
  })

  if (!res.ok) {
    throw new Error(`RSS request failed (${res.status}) for ${feedUrl}`)
  }

  const xml = await res.text()
  const $ = cheerio.load(xml, { xmlMode: true })
  const unique = new Set<string>()
  const items: RssFeedItem[] = []

  $('item, entry').each((_, el) => {
    if (items.length >= limit) return false

    const node = $(el)
    const title = node.find('title').first().text().trim()
    const url = asAbsoluteHttpUrl(readEntryLink(node))
    if (!title || !url || unique.has(url)) return

    unique.add(url)
    items.push({
      title,
      url,
      publishedAt: readEntryPublishedAt(node),
      summary: readEntrySummary(node),
      thumbnailUrl: readEntryThumbnail(node),
    })
  })

  return items
}
