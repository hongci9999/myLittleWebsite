/**
 * Ollama API 호출 서비스
 * 링크 설명·분류 추천용
 */

import { fetchWebsiteContent } from './fetch-website.js'

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'lfm2:24b'

export interface SuggestedLabel {
  dimension: 'purpose' | 'medium'
  label: string
}

export interface AiSuggestResult {
  title: string
  description: string
  suggestedLabels: SuggestedLabel[]
  /** Ollama가 반환한 원시 텍스트 (디버깅·검토용) */
  rawResponse?: string
}

/** Ollama /api/generate 호출 */
async function generate(prompt: string): Promise<string> {
  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Ollama request failed: ${res.status} ${text}`)
  }
  const data = (await res.json()) as { response?: string }
  return (data.response ?? '').trim()
}

/**
 * URL로 링크 제목·설명·분류 추천
 * 1단계: 웹사이트 fetch 후 AI가 사이트 분석
 * 2단계: 분석 결과를 바탕으로 제목·설명·태그 생성
 * fetch 실패 시 URL만으로 기존 방식 폴백
 */
export async function suggestLinkMeta(
  url: string,
  title: string,
  availableLabels: string[],
  options?: { purposeLabels?: string[]; mediumLabels?: string[] }
): Promise<AiSuggestResult> {
  const purposeLabels = options?.purposeLabels ?? []
  const mediumLabels = options?.mediumLabels ?? []

  const labelsStr =
    purposeLabels.length > 0 || mediumLabels.length > 0
      ? `목적: ${purposeLabels.join(', ') || '(없음)'}\n종류: ${mediumLabels.join(', ') || '(없음)'}`
      : availableLabels.length > 0
        ? availableLabels.join(', ')
        : '(없음 - 새로 만들어도 됨)'

  const content = await fetchWebsiteContent(url)
  let siteAnalysis = ''

  if (content && content.fullText.trim().length > 50) {
    const analyzePrompt = `다음 웹사이트 내용을 분석해주세요. 어떤 사이트인지, 주요 내용·목적·대상이 무엇인지 200자 이내로 요약해주세요.

URL: ${url}

---
${content.fullText}
---
`
    try {
      siteAnalysis = await generate(analyzePrompt)
    } catch {
      siteAnalysis = ''
    }
  }

  const titleHint = title.trim()
    ? `제목(사이트 이름): ${title} (이 사이트명을 우선 사용)`
    : '제목이 없으므로 URL 또는 분석을 보고 사이트 이름(브랜드명·서비스명)을 생성해주세요. 설명이 아닌 이름만.'

  const contextBlock = siteAnalysis
    ? `[웹사이트 분석 결과]
${siteAnalysis}

위 분석을 바탕으로 링크 추가용 메타데이터를 제시해주세요.

`
    : `[URL만 제공됨 - 사이트 fetch 실패 또는 내용 없음]
URL: ${url}

`

  const relevanceRule = `- suggestedLabels는 반드시 웹사이트 내용과 직접 관련 있는 것만 추천하세요. 무관한 태그는 포함하지 마세요.`

  const mediumRule =
    mediumLabels.length > 0
      ? `- 종류(형식)에 해당하는 태그를 반드시 1개 이상 포함하세요: ${mediumLabels.join(', ')}. 예: 웹페이지면 "웹 서비스", API 문서면 "API", CLI 도구면 "CLI" 등.`
      : ''

  const metadataPrompt = `${contextBlock}${titleHint}

사용 가능한 분류(태그): ${labelsStr}

규칙:
${relevanceRule}
${mediumRule}
- suggestedLabels는 위 사용 가능한 분류에서 선택하거나, 없으면 적절한 새 분류를 제안하세요. 2~5개 정도.
- 각 태그는 반드시 목적(purpose) 또는 종류(medium)로 분류. dimension은 "purpose" 또는 "medium"만 사용.

- title은 사이트 이름(브랜드명·서비스명)만. 설명·문구 아님. 예: "shadcn/ui", "React", "GitHub" (O) / "React 컴포넌트 라이브러리" (X, 이건 description)
- description은 문어체로 작성. "이 사이트는", "~은/는"으로 시작하지 말고, 기능·역할만 바로 설명.

반드시 아래 JSON 형식으로만 답해주세요. 다른 텍스트 없이 JSON만 출력하세요.
{
  "title": "사이트 이름 (20자 이내, 브랜드·서비스명만)",
  "description": "한 줄 설명 (50자 이내, 문어체, 기능만)",
  "suggestedLabels": [{"dimension": "purpose", "label": "프론트엔드"}, {"dimension": "medium", "label": "웹 서비스"}]
}`

  const raw = await generate(metadataPrompt)

  let jsonStr = raw
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) jsonStr = codeBlock[1].trim()

  const rawResponse = siteAnalysis
    ? `[1단계 사이트 분석]\n${siteAnalysis}\n\n[2단계 메타데이터 생성]\n${raw}`
    : raw

  try {
    const parsed = JSON.parse(jsonStr) as {
      title?: string
      description?: string
      suggestedLabels?: Array<{ dimension?: string; label?: string } | string>
    }
    const normalized: SuggestedLabel[] = []
    for (const item of parsed.suggestedLabels ?? []) {
      if (typeof item === 'object' && item?.label) {
        const dim = item.dimension === 'medium' ? 'medium' : 'purpose'
        normalized.push({ dimension: dim, label: String(item.label).trim() })
      } else if (typeof item === 'string' && item.trim()) {
        normalized.push({ dimension: 'purpose', label: item.trim() })
      }
    }
    return {
      title: parsed.title?.trim() || title || new URL(url).hostname.replace(/^www\./, ''),
      description: parsed.description ?? '',
      suggestedLabels: normalized,
      rawResponse,
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
      suggestedLabels: [],
      rawResponse,
    }
  }
}
