import {
  isCategory,
  isMediaKind,
  type Category,
  type MediaKind,
} from '../../db/queries/game-dev-resources.js'
import { fetchWebsiteContent, type WebsiteContent } from '../fetch-website.js'
import {
  OBSIDIAN_YOUTUBE_CLIP_PARSE_ERROR,
  parseObsidianYoutubeClip,
  type ObsidianYoutubeClip,
} from '../parse-obsidian-youtube-clip.js'
import { assertYoutubeTranscriptForAi } from '../youtube-transcript-text.js'
import { stripMarkdownCodeFence } from './json-from-model.js'
import { GameDevResourcePrompts } from './prompts/game-dev-resource.prompts.js'
import {
  getAiTextProvider,
  type AiRequestPreference,
} from './providers/registry.js'
import type { AiTextProvider } from './providers/types.js'
import type { GameDevResourceAiFillResult } from './types.js'
import {
  inferGameDevMediaKindFromUrl,
  isXOrTwitterHost,
  xStatusHandleFromUrl,
} from './url-hints.js'
import { isYoutubeWatchUrl } from './youtube-ai-path.js'

function sanitizeXField(s: string, fallback: string): string {
  const t = (s || fallback).replace(/something went wrong/gi, '').trim()
  return t || fallback
}

function parseTagsJson(tags: unknown, max: number, fallback: string[]): string[] {
  const out: string[] = []
  if (Array.isArray(tags)) {
    for (const t of tags) {
      if (typeof t !== 'string') continue
      const s = t.trim()
      if (s && out.length < max) out.push(s)
    }
  }
  if (out.length === 0) return [...fallback]
  return out
}

function resolveCategory(raw: unknown, fallback: Category): Category {
  if (typeof raw === 'string' && isCategory(raw)) return raw
  return fallback
}

function defaultTitleFromUrl(trimmed: string): string {
  try {
    return new URL(trimmed).hostname.replace(/^www\./, '')
  } catch {
    return '게임 개발 자료'
  }
}

async function buildGameDevFromSiteAnalysis(params: {
  trimmed: string
  kindHint: MediaKind
  content: WebsiteContent | null
  siteAnalysis: string
  coverImageUrl: string | null
  ai: AiTextProvider
  clipTranscriptOnly?: boolean
}): Promise<GameDevResourceAiFillResult> {
  const {
    trimmed,
    kindHint,
    content,
    siteAnalysis,
    coverImageUrl,
    ai,
    clipTranscriptOnly = false,
  } = params

  const pageTitleLine = content?.title
    ? clipTranscriptOnly
      ? `영상 제목(클립 메타, 참고): ${content.title}`
      : `페이지 제목(HTML): ${content.title}`
    : '페이지 제목을 가져오지 못했습니다.'
  const urlKindLine = clipTranscriptOnly
    ? `형식(참고): ${kindHint} — 클립 자막만으로 생성. mediaKind는 youtube 권장.`
    : `URL 패턴 기준 추정 형식(참고): ${kindHint}. 더 맞으면 mediaKind에 반영.`

  const contextBlock = siteAnalysis
    ? `[심층 분석 노트 — bodyMd "상세 정리"에 반영]\n${siteAnalysis}\n\n`
    : clipTranscriptOnly
      ? `[클립 자막만 제공 — URL·페이지 fetch 없음]\n제목(참고): ${content?.title ?? '없음'}\n\n`
      : `[페이지 본문 없음 또는 fetch 실패]\nURL: ${trimmed}\n\n`

  const metadataPrompt = GameDevResourcePrompts.metadataJson({
    contextBlock,
    pageTitleLine,
    urlKindLine,
  })
  const raw = await ai.complete(metadataPrompt)
  const jsonStr = stripMarkdownCodeFence(raw)

  let rawResponse = siteAnalysis
    ? `[페이지 분석]\n${siteAnalysis}\n\n[필드 생성]\n${raw}`
    : raw

  let parsed: {
    title?: string
    summary?: string
    bodyMd?: string
    mediaKind?: string
    category?: string
    tags?: unknown
  }
  try {
    parsed = JSON.parse(jsonStr) as typeof parsed
  } catch {
    const fallbackTitle =
      content?.title?.trim() ||
      (trimmed ? defaultTitleFromUrl(trimmed) : 'YouTube 스크랩')
    return {
      title: fallbackTitle,
      summary: '',
      bodyMd: raw.slice(0, 600),
      mediaKind: kindHint,
      category: 'etc',
      coverImageUrl,
      tags: [],
      rawResponse,
    }
  }

  let mediaKind: MediaKind = kindHint
  if (parsed.mediaKind && isMediaKind(parsed.mediaKind)) {
    mediaKind = parsed.mediaKind
  }

  const category = resolveCategory(parsed.category, 'etc')
  const tags = parseTagsJson(parsed.tags, 5, [])

  const resolvedTitle =
    parsed.title?.trim() ||
    content?.title?.trim() ||
    (trimmed ? defaultTitleFromUrl(trimmed) : 'YouTube 스크랩')

  let bodyMd = parsed.bodyMd?.trim() ?? ''
  const summaryLine = parsed.summary?.trim() ?? ''
  const summaryForExpand = summaryLine || resolvedTitle.slice(0, 120)

  if (siteAnalysis.length >= 400 && bodyMd.length < 550) {
    try {
      const expanded = await ai.complete(
        GameDevResourcePrompts.expandBodyMarkdown({
          url: clipTranscriptOnly
            ? '(원문 URL 없음 — 클립 자막만 사용)'
            : trimmed,
          title: resolvedTitle,
          summaryLine: summaryForExpand,
          siteAnalysis,
        })
      )
      const t = expanded.trim()
      if (t.length > bodyMd.length) {
        bodyMd = t
        rawResponse = `${rawResponse}\n\n[본문 확장 재생성]\n${t}`
      }
    } catch {
      /* 기존 bodyMd 유지 */
    }
  }

  return {
    title: resolvedTitle,
    summary: parsed.summary?.trim() ?? '',
    bodyMd,
    mediaKind,
    category,
    coverImageUrl,
    tags,
    rawResponse,
  }
}

function websiteContentFromObsidianClip(clip: ObsidianYoutubeClip): WebsiteContent {
  return {
    url: clip.sourceUrl || '',
    title: clip.title,
    metaDescription: clip.description.slice(0, 500),
    bodyText: clip.transcript,
    fullText: clip.transcript,
    faviconUrl: 'https://www.youtube.com/favicon.ico',
    ogImageUrl: clip.thumbnailUrl,
    youtubeMissingTranscript: false,
  }
}

export type SuggestGameDevResourceOptions = {
  /** Obsidian Web Clipper raw/youtube 노트 전문 */
  youtubeClip?: string
}

/**
 * 게임 개발 도서관 폼용: URL(또는 Obsidian 클립)으로 제목·요약·마크다운·형식·분야·표지·태그 제안
 */
export async function suggestGameDevResourceFromUrl(
  url: string,
  preference: AiRequestPreference,
  options?: SuggestGameDevResourceOptions
): Promise<GameDevResourceAiFillResult> {
  const ai = getAiTextProvider(preference)
  const clipRaw = options?.youtubeClip?.trim()
  const hasClipRequest = Boolean(clipRaw)
  let trimmed = url.trim()
  let obsidianClip: ObsidianYoutubeClip | null = null

  if (hasClipRequest && clipRaw) {
    obsidianClip = parseObsidianYoutubeClip(clipRaw)
    if (!obsidianClip) {
      throw new Error(OBSIDIAN_YOUTUBE_CLIP_PARSE_ERROR)
    }
  }

  const clipTranscriptOnly = hasClipRequest && Boolean(obsidianClip)

  if (!hasClipRequest && !trimmed) {
    throw new Error('원문 URL 또는 Obsidian YouTube 클립이 필요합니다.')
  }

  const kindHint = clipTranscriptOnly
    ? 'youtube'
    : inferGameDevMediaKindFromUrl(trimmed)
  const skipHtml = !clipTranscriptOnly && isXOrTwitterHost(trimmed)

  if (skipHtml) {
    const handle = xStatusHandleFromUrl(trimmed)
    const handleLine = handle
      ? `계정 @${handle} 로 추정됩니다.`
      : '계정명은 URL에서 추정하지 못했습니다.'
    const xPrompt = GameDevResourcePrompts.xPostJson(trimmed, handleLine)
    const raw = await ai.complete(xPrompt)
    const jsonStr = stripMarkdownCodeFence(raw)

    const defaultTitle = handle ? `@${handle} — X (게임 개발)` : 'X 포스트'
    const defaultSummary = '트윗 본문은 원문에서 확인하세요.'
    const defaultBody = `## 요약\n\nX 포스트 링크입니다. 서버에서는 로그인 없이 본문을 가져올 수 없습니다. 아래 원문에서 내용을 확인한 뒤 메모를 보강하세요.\n\n## 상세 정리\n\n- [원문 열기](${trimmed})\n- **핵심 주장·기법**을 확인해 이 자료에 붙이기\n- 관련 **엔진·문서·강의** 링크가 있으면 추가 링크에 넣기`

    let parsed: {
      title?: string
      summary?: string
      bodyMd?: string
      mediaKind?: string
      category?: string
      tags?: unknown
    }
    try {
      parsed = JSON.parse(jsonStr) as typeof parsed
    } catch {
      return {
        title: defaultTitle,
        summary: defaultSummary,
        bodyMd: defaultBody,
        mediaKind: 'other',
        category: 'etc',
        coverImageUrl: null,
        tags: handle ? ['X', handle] : ['X'],
        rawResponse: raw,
      }
    }

    const tags = parseTagsJson(parsed.tags, 5, ['X'])

    return {
      title: sanitizeXField(parsed.title ?? '', defaultTitle),
      summary: sanitizeXField(parsed.summary ?? '', defaultSummary),
      bodyMd: sanitizeXField(parsed.bodyMd ?? '', defaultBody),
      mediaKind: 'other',
      category: resolveCategory(parsed.category, 'etc'),
      coverImageUrl: null,
      tags,
      rawResponse: raw,
    }
  }

  let content: WebsiteContent | null = null
  let coverImageUrl: string | null = null

  if (clipTranscriptOnly && obsidianClip) {
    content = websiteContentFromObsidianClip(obsidianClip)
    coverImageUrl = obsidianClip.thumbnailUrl
  } else {
    content = await fetchWebsiteContent(trimmed)
    assertYoutubeTranscriptForAi(trimmed, content)
    coverImageUrl = content?.ogImageUrl ?? null
  }
  let siteAnalysis = ''

  if (content && content.fullText.trim().length > 40) {
    try {
      const analysisPrompt = clipTranscriptOnly
        ? GameDevResourcePrompts.deepAnalysisNoteObsidianClipTranscript(
            obsidianClip!.transcript,
            {
              title: obsidianClip!.title,
              channel: obsidianClip!.channel,
            }
          )
        : isYoutubeWatchUrl(trimmed)
          ? GameDevResourcePrompts.deepAnalysisNoteYoutubeTranscript(
              trimmed,
              content.fullText
            )
          : GameDevResourcePrompts.deepAnalysisNote(trimmed, content.fullText)
      siteAnalysis = await ai.complete(analysisPrompt)
    } catch {
      siteAnalysis = ''
    }
  }

  const resolvedKind = clipTranscriptOnly
    ? 'youtube'
    : isYoutubeWatchUrl(trimmed) && kindHint === 'other'
      ? 'youtube'
      : kindHint

  return buildGameDevFromSiteAnalysis({
    trimmed: clipTranscriptOnly ? '' : trimmed,
    kindHint: resolvedKind,
    content,
    siteAnalysis,
    coverImageUrl,
    ai,
    clipTranscriptOnly,
  })
}
