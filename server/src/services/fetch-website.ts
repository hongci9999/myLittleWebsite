/**
 * 웹페이지 fetch 및 텍스트 추출
 * AI 링크 추천용 사이트 분석
 */

import * as cheerio from 'cheerio'

export interface WebsiteContent {
  url: string
  title: string
  metaDescription: string
  bodyText: string
  /** 전체 추출 텍스트 (title + meta + body, 토큰 제한 고려해 잘림) */
  fullText: string
  /** <link rel="icon"> 등에서 추출한 절대 URL, 없으면 /favicon.ico 시도용 URL */
  faviconUrl: string | null
  /** og:image 또는 twitter:image (카드 표지용) */
  ogImageUrl: string | null
}

function parseIconSize(area: string): number {
  const m = area.trim().match(/^(\d+)\s*x\s*(\d+)$/i)
  if (!m) return 0
  return parseInt(m[1], 10) * parseInt(m[2], 10)
}

/**
 * HTML에서 대표 파비콘 URL 후보 1개 (절대 URL). link 태그가 없으면 origin/favicon.ico.
 */
export function extractFaviconUrl(
  $: ReturnType<typeof cheerio.load>,
  pageUrl: string
): string | null {
  let base: URL
  try {
    base = new URL(pageUrl)
  } catch {
    return null
  }

  const candidates: { href: string; score: number }[] = []

  $('link[rel]').each((_, el) => {
    const $el = $(el)
    const rel = ($el.attr('rel') || '').toLowerCase()
    if (!rel.includes('icon') && !rel.includes('apple-touch')) return
    const href = $el.attr('href')?.trim()
    if (!href) return

    let score = 20
    if (rel.includes('apple-touch-icon-precomposed')) score = 120
    else if (rel.includes('apple-touch-icon')) score = 100
    else if (rel.includes('mask-icon')) score = 35
    else if (rel.includes('shortcut')) score = 45
    else if (rel === 'icon' || rel.endsWith(' icon')) score = 40

    const sizes = $el.attr('sizes')
    if (sizes) {
      let max = 0
      for (const part of sizes.split(/\s+/)) {
        max = Math.max(max, parseIconSize(part))
      }
      score += Math.min(max / 50, 40)
    }

    try {
      const abs = new URL(href, pageUrl).href
      candidates.push({ href: abs, score })
    } catch {
      /* skip invalid href */
    }
  })

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score)
    return candidates[0].href
  }

  return `${base.origin}/favicon.ico`
}

function extractOgImageUrl(
  $: ReturnType<typeof cheerio.load>,
  pageUrl: string
): string | null {
  const raw =
    $('meta[property="og:image"]').attr('content')?.trim() ||
    $('meta[name="twitter:image"]').attr('content')?.trim() ||
    $('meta[name="twitter:image:src"]').attr('content')?.trim()
  if (!raw) return null
  try {
    return new URL(raw, pageUrl).href
  } catch {
    return null
  }
}

const MAX_BODY_CHARS = 8000
const USER_AGENT =
  'Mozilla/5.0 (compatible; myLittleWebsite/1.0; +https://github.com)'

/**
 * URL fetch 후 HTML에서 title, meta description, 본문 텍스트 추출
 */
export async function fetchWebsiteContent(url: string): Promise<WebsiteContent | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const finalUrl = res.url || url
    const $ = cheerio.load(html)

    const title = $('title').first().text().trim() || ''
    const metaDesc =
      $('meta[name="description"]').attr('content')?.trim() ||
      $('meta[property="og:description"]').attr('content')?.trim() ||
      ''

    // 본문: main, article, [role="main"] 우선, 없으면 body
    let bodyEl = $('main').first()
    if (bodyEl.length === 0) bodyEl = $('article').first()
    if (bodyEl.length === 0) bodyEl = $('[role="main"]').first()
    if (bodyEl.length === 0) bodyEl = $('body')

    let bodyText = bodyEl.text().replace(/\s+/g, ' ').trim()
    if (bodyText.length > MAX_BODY_CHARS) {
      bodyText = bodyText.slice(0, MAX_BODY_CHARS) + '...'
    }

    const parts: string[] = []
    if (title) parts.push(`제목: ${title}`)
    if (metaDesc) parts.push(`메타 설명: ${metaDesc}`)
    if (bodyText) parts.push(`본문: ${bodyText}`)

    const fullText = parts.join('\n\n') || url
    const faviconUrl = extractFaviconUrl($, finalUrl)
    const ogImageUrl = extractOgImageUrl($, finalUrl)

    return {
      url: finalUrl,
      title,
      metaDescription: metaDesc,
      bodyText,
      fullText,
      faviconUrl,
      ogImageUrl,
    }
  } catch {
    return null
  }
}
