import {
  isCategory,
  isMediaKind,
  type Category,
  type MediaKind,
} from '../../db/queries/game-dev-resources.js'
import { fetchWebsiteContent, type WebsiteContent } from '../fetch-website.js'
import { assertYoutubeTranscriptForAi } from '../youtube-transcript-text.js'
import { stripMarkdownCodeFence } from './json-from-model.js'
import { GameDevResourcePrompts } from './prompts/game-dev-resource.prompts.js'
import { getAiTextProvider } from './providers/registry.js'
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
}): Promise<GameDevResourceAiFillResult> {
  const {
    trimmed,
    kindHint,
    content,
    siteAnalysis,
    coverImageUrl,
    ai,
  } = params

  const pageTitleLine = content?.title
    ? `페이지 제목(HTML): ${content.title}`
    : '페이지 제목을 가져오지 못했습니다.'
  const urlKindLine = `URL 패턴 기준 추정 형식(참고): ${kindHint}. 더 맞으면 mediaKind에 반영.`

  const contextBlock = siteAnalysis
    ? `[심층 분석 노트 — bodyMd "상세 정리"에 반영]\n${siteAnalysis}\n\n`
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
      defaultTitleFromUrl(trimmed)
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
    defaultTitleFromUrl(trimmed)

  let bodyMd = parsed.bodyMd?.trim() ?? ''
  const summaryLine = parsed.summary?.trim() ?? ''
  const summaryForExpand = summaryLine || resolvedTitle.slice(0, 120)

  if (siteAnalysis.length >= 400 && bodyMd.length < 550) {
    try {
      const expanded = await ai.complete(
        GameDevResourcePrompts.expandBodyMarkdown({
          url: trimmed,
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

/**
 * 게임 개발 도서관 폼용: URL로 제목·요약·마크다운·형식·분야·표지·태그 제안
 */
export async function suggestGameDevResourceFromUrl(
  url: string
): Promise<GameDevResourceAiFillResult> {
  const ai = getAiTextProvider()
  const trimmed = url.trim()
  if (!trimmed) throw new Error('원문 URL이 필요합니다.')

  const kindHint = inferGameDevMediaKindFromUrl(trimmed)
  const skipHtml = isXOrTwitterHost(trimmed)

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

  const content = await fetchWebsiteContent(trimmed)
  assertYoutubeTranscriptForAi(trimmed, content)
  const coverImageUrl = content?.ogImageUrl ?? null
  let siteAnalysis = ''

  if (content && content.fullText.trim().length > 40) {
    try {
      const analysisPrompt = isYoutubeWatchUrl(trimmed)
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

  const resolvedKind =
    isYoutubeWatchUrl(trimmed) && kindHint === 'other' ? 'youtube' : kindHint

  return buildGameDevFromSiteAnalysis({
    trimmed,
    kindHint: resolvedKind,
    content,
    siteAnalysis,
    coverImageUrl,
    ai,
  })
}
