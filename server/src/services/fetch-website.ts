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

    return {
      url,
      title,
      metaDescription: metaDesc,
      bodyText,
      fullText,
    }
  } catch {
    return null
  }
}
