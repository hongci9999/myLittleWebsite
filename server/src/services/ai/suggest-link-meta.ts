import type { DimensionWithValues, ValueTree } from '../../db/queries/links.js'
import { fetchWebsiteContent } from '../fetch-website.js'
import { assertYoutubeTranscriptForAi } from '../youtube-transcript-text.js'
import { stripMarkdownCodeFence } from './json-from-model.js'
import { LinkMetaPrompts } from './prompts/link-meta.prompts.js'
import { getAiTextProvider, type AiRequestPreference } from './providers/registry.js'
import type { AiSuggestResult } from './types.js'

function walkClassificationValues(
  nodes: ValueTree[] | undefined,
  ancestors: string[]
): { id: string; label: string; pathLabel: string }[] {
  if (!nodes?.length) return []
  const out: { id: string; label: string; pathLabel: string }[] = []
  for (const n of nodes) {
    const pathLabel = ancestors.length ? `${ancestors.join(' > ')} > ${n.label}` : n.label
    out.push({ id: n.id, label: n.label, pathLabel })
    if (n.children?.length) {
      out.push(...walkClassificationValues(n.children, [...ancestors, n.label]))
    }
  }
  return out
}

function buildLinkClassificationCatalogForPrompt(
  dimensions: DimensionWithValues[]
): string | null {
  const parts: string[] = []
  for (const d of dimensions) {
    const rows = walkClassificationValues(d.values, [])
    if (rows.length === 0) continue
    parts.push(`### ${d.label} (축: ${d.slug})`)
    for (const r of rows) {
      parts.push(`- ${r.id} — "${r.label}" (${r.pathLabel})`)
    }
    parts.push('')
  }
  const s = parts.join('\n').trim()
  return s.length ? s : null
}

function buildAllowedValueIndex(dimensions: DimensionWithValues[]): {
  allowedIds: Set<string>
  labelToId: Map<string, string>
} {
  const allowedIds = new Set<string>()
  const labelToId = new Map<string, string>()
  for (const d of dimensions) {
    for (const r of walkClassificationValues(d.values, [])) {
      allowedIds.add(r.id)
      const low = r.label.trim().toLowerCase()
      if (!labelToId.has(low)) labelToId.set(low, r.id)
    }
  }
  return { allowedIds, labelToId }
}

function normalizeSuggestedValueIds(
  raw: unknown,
  allowedIds: Set<string>,
  labelToId: Map<string, string>
): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const x of raw) {
    if (typeof x !== 'string') continue
    const t = x.trim()
    if (!t) continue
    if (allowedIds.has(t)) {
      out.push(t)
      continue
    }
    const byLabel = labelToId.get(t.toLowerCase())
    if (byLabel) out.push(byLabel)
  }
  return [...new Set(out)].slice(0, 24)
}

/**
 * URL로 링크 제목·설명·분류 태그(valueIds) 추천
 * 1단계: 웹사이트 fetch 후 AI가 사이트 분석
 * 2단계: 분석 결과 + 분류 카탈로그로 메타데이터·태그 id JSON 생성
 */
export async function suggestLinkMeta(
  url: string,
  title: string,
  preference: AiRequestPreference,
  dimensions: DimensionWithValues[] = []
): Promise<AiSuggestResult> {
  const ai = getAiTextProvider(preference)
  const { allowedIds, labelToId } = buildAllowedValueIndex(dimensions)
  const classificationCatalog = buildLinkClassificationCatalogForPrompt(dimensions)
  const content = await fetchWebsiteContent(url)
  assertYoutubeTranscriptForAi(url, content)
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

  const metadataPrompt = LinkMetaPrompts.metadataJson(
    contextBlock,
    titleHint,
    classificationCatalog
  )
  const raw = await ai.complete(metadataPrompt)
  const jsonStr = stripMarkdownCodeFence(raw)

  const rawResponse = siteAnalysis
    ? `[1단계 사이트 분석]\n${siteAnalysis}\n\n[2단계 메타데이터 생성]\n${raw}`
    : raw

  try {
    const parsed = JSON.parse(jsonStr) as {
      title?: string
      description?: string
      valueIds?: unknown
    }
    const valueIds =
      allowedIds.size > 0
        ? normalizeSuggestedValueIds(parsed.valueIds, allowedIds, labelToId)
        : undefined
    const out: AiSuggestResult = {
      title: parsed.title?.trim() || title || new URL(url).hostname.replace(/^www\./, ''),
      description: parsed.description ?? '',
      rawResponse,
      faviconUrl,
    }
    if (valueIds !== undefined && valueIds.length > 0) {
      out.valueIds = valueIds
    }
    return out
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
