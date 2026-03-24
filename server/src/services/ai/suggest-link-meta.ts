import { fetchWebsiteContent } from '../fetch-website.js'
import { stripMarkdownCodeFence } from './json-from-model.js'
import { LinkMetaPrompts } from './prompts/link-meta.prompts.js'
import { getAiTextProvider } from './providers/registry.js'
import type { AiSuggestResult } from './types.js'

/**
 * URL로 링크 제목·설명 추천
 * 1단계: 웹사이트 fetch 후 AI가 사이트 분석
 * 2단계: 분석 결과를 바탕으로 제목·설명 생성
 */
export async function suggestLinkMeta(url: string, title: string): Promise<AiSuggestResult> {
  const ai = getAiTextProvider()
  const content = await fetchWebsiteContent(url)
  const faviconUrl = content?.faviconUrl ?? null
  let siteAnalysis = ''

  if (content && content.fullText.trim().length > 50) {
    try {
      siteAnalysis = await ai.complete(LinkMetaPrompts.analyzeWebsite(url, content.fullText))
    } catch {
      siteAnalysis = ''
    }
  }

  const titleHint = LinkMetaPrompts.titleHintLine(title)
  const contextBlock = siteAnalysis
    ? LinkMetaPrompts.contextWithAnalysis(url, siteAnalysis)
    : LinkMetaPrompts.contextUrlOnly(url)

  const metadataPrompt = LinkMetaPrompts.metadataJson(contextBlock, titleHint)
  const raw = await ai.complete(metadataPrompt)
  const jsonStr = stripMarkdownCodeFence(raw)

  const rawResponse = siteAnalysis
    ? `[1단계 사이트 분석]\n${siteAnalysis}\n\n[2단계 메타데이터 생성]\n${raw}`
    : raw

  try {
    const parsed = JSON.parse(jsonStr) as {
      title?: string
      description?: string
    }
    return {
      title: parsed.title?.trim() || title || new URL(url).hostname.replace(/^www\./, ''),
      description: parsed.description ?? '',
      rawResponse,
      faviconUrl,
    }
  } catch {
    let fallbackTitle = title
    if (!fallbackTitle) {
      try {
        fallbackTitle = new URL(url).hostname.replace(/^www\./, '')
      } catch {
        fallbackTitle = '링크'
      }
    }
    return {
      title: fallbackTitle,
      description: raw.slice(0, 200),
      rawResponse,
      faviconUrl,
    }
  }
}
