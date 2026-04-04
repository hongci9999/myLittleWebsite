/**
 * 웹페이지 fetch 및 텍스트 추출
 * AI 링크 추천용 사이트 분석
 */

import * as cheerio from 'cheerio'
import { parseYoutubeVideoId, tryFetchYoutubeTranscriptPlain } from './youtube-transcript-text.js'

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
  /**
   * 유튜브 URL인데 자막을 가져오지 못한 경우 true.
   * AI 제안은 이 경우 실행하지 않는다.
   */
  youtubeMissingTranscript?: boolean
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

/** HTML fetch 실패했지만 자막만으로 AI 입력을 구성할 때 */
function websiteContentFromYoutubeTranscriptOnly(
  pageUrl: string,
  videoId: string,
  transcript: string
): WebsiteContent {
  return {
    url: pageUrl,
    title: 'YouTube 동영상',
    metaDescription: '',
    bodyText: transcript,
    fullText: `제목: YouTube 동영상\n\n동영상 자막 기반 텍스트:\n\n${transcript}`,
    faviconUrl: 'https://www.youtube.com/favicon.ico',
    ogImageUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    youtubeMissingTranscript: false,
  }
}

/**
 * URL fetch 후 HTML에서 title, meta description, 본문 텍스트 추출.
 * YouTube는 HTML에 본문이 거의 없어 **자막(transcript)** 이 있으면 그것을 본문으로 넣는다.
 */
export async function fetchWebsiteContent(url: string): Promise<WebsiteContent | null> {
  const trimmed = url.trim()
  const ytId = parseYoutubeVideoId(trimmed)
  const ytTranscript = ytId ? await tryFetchYoutubeTranscriptPlain(trimmed) : null

  try {
    const res = await fetch(trimmed, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      if (ytId && ytTranscript) {
        return websiteContentFromYoutubeTranscriptOnly(trimmed, ytId, ytTranscript)
      }
      return null
    }
    const html = await res.text()
    const finalUrl = res.url || trimmed
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
    if (ytTranscript) {
      parts.push(`동영상 자막 기반 텍스트 (요약·본문 작성의 주요 근거로 사용):\n${ytTranscript}`)
    } else if (ytId) {
      parts.push(
        '【참고】자막을 가져오지 못했습니다. 아래 페이지 추출 텍스트만으로 추론하세요. 사실 관계는 원문 영상을 확인하세요.'
      )
    }
    if (!ytTranscript && bodyText) {
      parts.push(`본문: ${bodyText}`)
    } else if (ytTranscript && bodyText.length > 0 && bodyText.length <= 1800) {
      parts.push(`페이지에서 추가로 추출한 텍스트:\n${bodyText}`)
    }

    const fullText = parts.join('\n\n') || trimmed
    const faviconUrl = extractFaviconUrl($, finalUrl)
    let ogImageUrl = extractOgImageUrl($, finalUrl)
    if (!ogImageUrl && ytId) {
      ogImageUrl = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
    }

    const bodyTextOut = ytTranscript ?? bodyText

    return {
      url: finalUrl,
      title,
      metaDescription: metaDesc,
      bodyText: bodyTextOut,
      fullText,
      faviconUrl,
      ogImageUrl,
      youtubeMissingTranscript: Boolean(ytId && !ytTranscript),
    }
  } catch {
    if (ytId && ytTranscript) {
      return websiteContentFromYoutubeTranscriptOnly(trimmed, ytId, ytTranscript)
    }
    return null
  }
}
