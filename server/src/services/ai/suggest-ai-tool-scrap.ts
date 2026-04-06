import { isSourceKind as isAiScrapSourceKind } from '../../db/queries/ai-scraps.js'
import { fetchWebsiteContent } from '../fetch-website.js'
import { assertYoutubeTranscriptForAi } from '../youtube-transcript-text.js'
import { stripMarkdownCodeFence } from './json-from-model.js'
import { AiToolScrapPrompts } from './prompts/ai-tool-scrap.prompts.js'
import { getAiTextProvider, type AiRequestPreference } from './providers/registry.js'
import type { AiToolScrapAiFillResult } from './types.js'
import { inferAiToolSourceKindFromUrl, isXOrTwitterHost, xStatusHandleFromUrl } from './url-hints.js'

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

/**
 * AI 도구 스크랩 폼용: URL만으로 제목·요약·마크다운·종류(mcp/skill/…)·태그 제안
 */
export async function suggestAiToolScrapFromUrl(
  url: string,
  preference: AiRequestPreference
): Promise<AiToolScrapAiFillResult> {
  const ai = getAiTextProvider(preference)
  const trimmed = url.trim()
  if (!trimmed) {
    throw new Error('url is required')
  }

  const kindHint = inferAiToolSourceKindFromUrl(trimmed)
  const skipHtml = isXOrTwitterHost(trimmed)

  if (skipHtml) {
    const handle = xStatusHandleFromUrl(trimmed)
    const handleLine = handle ? `계정 @${handle} 로 추정됩니다.` : '계정명은 URL에서 추정하지 못했습니다.'
    const xPrompt = AiToolScrapPrompts.xPostJson(trimmed, handleLine)
    const raw = await ai.complete(xPrompt)
    const jsonStr = stripMarkdownCodeFence(raw)

    const defaultTitle = handle ? `@${handle} — X (도구 스크랩)` : 'X 포스트'
    const defaultSummary = '트윗 본문은 원문에서 확인하세요.'
    const defaultBody = `## 요약\n\nX 포스트 링크입니다. 서버에서는 로그인 없이 본문을 가져올 수 없습니다. 아래 원문에서 내용을 확인한 뒤 메모를 보강하세요.\n\n## 상세 정리\n\n- [원문 열기](${trimmed})\n- **핵심 주장·링크**를 확인해 이 스크랩에 붙이기\n- AI 도구·릴리스 공지면 **버전·변경점** 메모\n- 관련 **문서·레포** 링크가 있으면 추가 링크에 넣기`

    let parsed: {
      title?: string
      summary?: string
      bodyMd?: string
      sourceKind?: string
      tags?: unknown
    }
    try {
      parsed = JSON.parse(jsonStr) as typeof parsed
    } catch {
      return {
        title: defaultTitle,
        summary: defaultSummary,
        bodyMd: defaultBody,
        sourceKind: 'other',
        tags: handle ? ['X', handle] : ['X'],
        rawResponse: raw,
      }
    }

    const tags = parseTagsJson(parsed.tags, 5, ['X'])

    return {
      title: sanitizeXField(parsed.title ?? '', defaultTitle),
      summary: sanitizeXField(parsed.summary ?? '', defaultSummary),
      bodyMd: sanitizeXField(parsed.bodyMd ?? '', defaultBody),
      sourceKind: 'other',
      tags,
      rawResponse: raw,
    }
  }

  const content = await fetchWebsiteContent(trimmed)
  assertYoutubeTranscriptForAi(trimmed, content)
  let siteAnalysis = ''

  if (content && content.fullText.trim().length > 40) {
    try {
      siteAnalysis = await ai.complete(AiToolScrapPrompts.deepAnalysisNote(trimmed, content.fullText))
    } catch {
      siteAnalysis = ''
    }
  }

  const pageTitleLine = content?.title
    ? `페이지 제목(HTML): ${content.title}`
    : '페이지 제목을 가져오지 못했습니다.'
  const urlKindLine = `URL 패턴 기준 추정 종류(참고): ${kindHint}. 더 맞으면 sourceKind에 반영. 허용값: mcp | skill | rules | cli | doc | repo | other`

  const contextBlock = siteAnalysis
    ? `[심층 분석 노트 — bodyMd "상세 정리"에 반영]\n${siteAnalysis}\n\n`
    : `[페이지 본문 없음 또는 fetch 실패]\nURL: ${trimmed}\n\n`

  const metadataPrompt = AiToolScrapPrompts.metadataJson({
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
    sourceKind?: string
    tags?: unknown
  }
  try {
    parsed = JSON.parse(jsonStr) as typeof parsed
  } catch {
    const fallbackTitle =
      content?.title?.trim() ||
      (() => {
        try {
          return new URL(trimmed).hostname.replace(/^www\./, '')
        } catch {
          return '도구 스크랩'
        }
      })()
    return {
      title: fallbackTitle,
      summary: '',
      bodyMd: raw.slice(0, 600),
      sourceKind: kindHint,
      tags: [],
      rawResponse,
    }
  }

  let sourceKind = kindHint
  if (parsed.sourceKind && isAiScrapSourceKind(parsed.sourceKind)) {
    sourceKind = parsed.sourceKind
  }

  const tags = parseTagsJson(parsed.tags, 5, [])

  const resolvedTitle =
    parsed.title?.trim() ||
    content?.title?.trim() ||
    (() => {
      try {
        return new URL(trimmed).hostname.replace(/^www\./, '')
      } catch {
        return '도구 스크랩'
      }
    })()

  let bodyMd = parsed.bodyMd?.trim() ?? ''
  const summaryLine = parsed.summary?.trim() ?? ''
  const summaryForExpand = summaryLine || resolvedTitle.slice(0, 120)

  if (siteAnalysis.length >= 400 && bodyMd.length < 500) {
    try {
      const expanded = await ai.complete(
        AiToolScrapPrompts.expandBodyMarkdown({
          url: trimmed,
          title: resolvedTitle,
          summaryLine: summaryForExpand,
          siteAnalysis,
        }),
      )
      const t = expanded.trim()
      if (t.length > bodyMd.length) {
        bodyMd = t
        rawResponse = `${rawResponse}\n\n[본문 확장 재생성]\n${t}`
      }
    } catch {
      /* keep */
    }
  }

  return {
    title: resolvedTitle,
    summary: parsed.summary?.trim() ?? '',
    bodyMd,
    sourceKind,
    tags,
    rawResponse,
  }
}
