/**
 * YouTube 영상 메타데이터 + 자막(transcript) 통합 추출.
 * Obsidian Web Clipper "YouTube with transcript" 템플릿과 동일한 입력 구성을 목표로 한다.
 */

import { parseYoutubeVideoId } from './youtube-transcript-text.js'

const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false'
const INNERTUBE_CLIENT_VERSION = '20.10.38'
const WEB_USER_AGENT =
  'Mozilla/5.0 (compatible; myLittleWebsite/1.0; +https://github.com)'
const ANDROID_USER_AGENT = `com.google.android.youtube/${INNERTUBE_CLIENT_VERSION} (Linux; U; Android 14)`
const MAX_TRANSCRIPT_CHARS = 16_000

/** 선호 자막 언어 (수동 > 자동 생성) */
const PREFERRED_LANGS = ['ko', 'en', 'en-US', 'ja'] as const

export interface YoutubeVideoMeta {
  videoId: string
  title: string
  channel: string
  description: string
  publishedAt: string | null
  thumbnailUrl: string | null
  durationLabel: string | null
}

export interface YoutubeContentBundle {
  meta: YoutubeVideoMeta
  transcript: string
  transcriptLang: string | null
}

type CaptionTrack = {
  baseUrl?: string
  languageCode?: string
  kind?: string
  name?: { simpleText?: string }
}

type PlayerResponse = {
  videoDetails?: {
    title?: string
    author?: string
    shortDescription?: string
    lengthSeconds?: string
    thumbnail?: { thumbnails?: Array<{ url?: string; width?: number }> }
  }
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[]
    }
  }
  microformat?: {
    playerMicroformatRenderer?: {
      publishDate?: string
      lengthSeconds?: string
    }
  }
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
}

function parseTranscriptXml(xml: string): string {
  const segments: string[] = []
  const pRe = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g
  let m: RegExpExecArray | null
  while ((m = pRe.exec(xml)) !== null) {
    const inner = m[3]
    let text = ''
    const sRe = /<s[^>]*>([^<]*)<\/s>/g
    let s: RegExpExecArray | null
    while ((s = sRe.exec(inner)) !== null) text += s[1]
    if (!text) text = inner.replace(/<[^>]+>/g, '')
    text = decodeXmlEntities(text).trim()
    if (text) segments.push(text)
  }
  if (segments.length === 0) {
    const legacyRe = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g
    while ((m = legacyRe.exec(xml)) !== null) {
      const text = decodeXmlEntities(m[3]).trim()
      if (text) segments.push(text)
    }
  }
  return segments.join(' ').replace(/\s+/g, ' ').trim()
}

function parseInlineJson(html: string, varName: string): PlayerResponse | null {
  const marker = `var ${varName} = `
  const start = html.indexOf(marker)
  if (start === -1) return null
  const jsonStart = start + marker.length
  let depth = 0
  for (let i = jsonStart; i < html.length; i++) {
    if (html[i] === '{') depth++
    else if (html[i] === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(jsonStart, i + 1)) as PlayerResponse
        } catch {
          return null
        }
      }
    }
  }
  return null
}

function pickCaptionTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null

  const manual = tracks.filter((t) => t.kind !== 'asr')
  const pool = manual.length > 0 ? manual : tracks

  for (const lang of PREFERRED_LANGS) {
    const hit = pool.find((t) => t.languageCode === lang)
    if (hit) return hit
  }
  const koAuto = tracks.find((t) => t.languageCode?.startsWith('ko'))
  if (koAuto) return koAuto
  return pool[0] ?? tracks[0]
}

async function fetchPlayerResponseViaInnertube(videoId: string): Promise<PlayerResponse | null> {
  try {
    const res = await fetch(INNERTUBE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': ANDROID_USER_AGENT,
      },
      body: JSON.stringify({
        context: {
          client: { clientName: 'ANDROID', clientVersion: INNERTUBE_CLIENT_VERSION },
        },
        videoId,
      }),
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return null
    return (await res.json()) as PlayerResponse
  } catch {
    return null
  }
}

async function fetchPlayerResponseViaWebPage(videoId: string): Promise<PlayerResponse | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': WEB_USER_AGENT },
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return null
    const html = await res.text()
    return parseInlineJson(html, 'ytInitialPlayerResponse')
  } catch {
    return null
  }
}

async function fetchTranscriptFromTrack(track: CaptionTrack): Promise<string | null> {
  const baseUrl = track.baseUrl?.trim()
  if (!baseUrl) return null
  try {
    const host = new URL(baseUrl).hostname
    if (!host.endsWith('.youtube.com')) return null
  } catch {
    return null
  }
  try {
    const res = await fetch(baseUrl, {
      headers: { 'User-Agent': WEB_USER_AGENT },
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return null
    const xml = await res.text()
    const text = parseTranscriptXml(xml)
    return text || null
  } catch {
    return null
  }
}

function extractMeta(videoId: string, player: PlayerResponse): YoutubeVideoMeta {
  const vd = player.videoDetails
  const mf = player.microformat?.playerMicroformatRenderer
  const thumbs = vd?.thumbnail?.thumbnails ?? []
  const bestThumb = thumbs.length > 0 ? thumbs[thumbs.length - 1]?.url ?? null : null

  const secRaw = vd?.lengthSeconds ?? mf?.lengthSeconds
  const sec = secRaw ? parseInt(secRaw, 10) : NaN

  return {
    videoId,
    title: vd?.title?.trim() || 'YouTube 동영상',
    channel: vd?.author?.trim() || '',
    description: vd?.shortDescription?.trim() || '',
    publishedAt: mf?.publishDate?.trim() || null,
    thumbnailUrl: bestThumb ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    durationLabel: Number.isFinite(sec) && sec > 0 ? formatDuration(sec) : null,
  }
}

function buildFullText(meta: YoutubeVideoMeta, transcript: string, transcriptLang: string | null): string {
  const parts: string[] = []
  parts.push(`제목: ${meta.title}`)
  if (meta.channel) parts.push(`채널: ${meta.channel}`)
  if (meta.publishedAt) parts.push(`게시일: ${meta.publishedAt}`)
  if (meta.durationLabel) parts.push(`재생시간: ${meta.durationLabel}`)
  if (meta.description) {
    const desc =
      meta.description.length > 1200
        ? meta.description.slice(0, 1200) + '...'
        : meta.description
    parts.push(`설명:\n${desc}`)
  }
  const langNote = transcriptLang ? ` (언어: ${transcriptLang})` : ''
  parts.push(`동영상 자막 기반 텍스트${langNote} — 요약·본문 작성의 주요 근거:\n\n${transcript}`)
  return parts.join('\n\n')
}

/**
 * YouTube URL에서 메타데이터 + 자막을 한 번에 가져온다.
 * 자막이 없으면 null.
 */
export async function fetchYoutubeContentBundle(
  videoUrl: string
): Promise<YoutubeContentBundle | null> {
  const videoId = parseYoutubeVideoId(videoUrl.trim())
  if (!videoId) return null

  let player =
    (await fetchPlayerResponseViaInnertube(videoId)) ??
    (await fetchPlayerResponseViaWebPage(videoId))
  if (!player) return null

  const tracks = player.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  const track = pickCaptionTrack(tracks)
  if (!track) return null

  let transcript = await fetchTranscriptFromTrack(track)
  if (!transcript) return null

  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    transcript = transcript.slice(0, MAX_TRANSCRIPT_CHARS) + '...'
  }

  const meta = extractMeta(videoId, player)
  return {
    meta,
    transcript,
    transcriptLang: track.languageCode ?? null,
  }
}

/** fetchWebsiteContent용 — Obsidian 템플릿과 유사한 fullText 구성 */
export function youtubeBundleToFullText(bundle: YoutubeContentBundle): string {
  return buildFullText(bundle.meta, bundle.transcript, bundle.transcriptLang)
}
