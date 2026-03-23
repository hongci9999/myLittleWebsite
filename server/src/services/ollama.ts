/**
 * Ollama API 호출 서비스
 * 링크 제목·설명 추천용 (태그는 사용자가 수동으로만 지정)
 * 칼럼 스크랩: URL 기준 페이지 fetch + AI로 제목·요약·메모·형식·태그 제안
 */

import { isColumnSourceKind, type ColumnSourceKind } from '../db/queries/column-scraps.js'
import { fetchWebsiteContent } from './fetch-website.js'

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'lfm2:24b'

export interface AiSuggestResult {
  title: string
  description: string
  /** Ollama가 반환한 원시 텍스트 (디버깅·검토용) */
  rawResponse?: string
  /** 같은 HTML fetch에서 추출한 파비콘 절대 URL */
  faviconUrl?: string | null
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
 * URL로 링크 제목·설명 추천
 * 1단계: 웹사이트 fetch 후 AI가 사이트 분석
 * 2단계: 분석 결과를 바탕으로 제목·설명 생성
 * fetch 실패 시 URL만으로 기존 방식 폴백
 */
export async function suggestLinkMeta(url: string, title: string): Promise<AiSuggestResult> {
  const content = await fetchWebsiteContent(url)
  const faviconUrl = content?.faviconUrl ?? null
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

  const metadataPrompt = `${contextBlock}${titleHint}

규칙:
- title은 사이트 이름(브랜드명·서비스명)만. 설명·문구 아님. 예: "shadcn/ui", "React", "GitHub" (O) / "React 컴포넌트 라이브러리" (X, 이건 description)
- description은 문어체로 작성. "이 사이트는", "~은/는"으로 시작하지 말고, 기능·역할만 바로 설명.

반드시 아래 JSON 형식으로만 답해주세요. 다른 텍스트 없이 JSON만 출력하세요.
{
  "title": "사이트 이름 (20자 이내, 브랜드·서비스명만)",
  "description": "한 줄 설명 (50자 이내, 문어체, 기능만)"
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

/** URL 호스트·경로로 칼럼 스크랩 형식 힌트 (AI·폴백용) */
function inferColumnSourceKindFromUrl(urlStr: string): ColumnSourceKind {
  let u: URL
  try {
    u = new URL(urlStr.trim())
  } catch {
    return 'other'
  }
  const host = u.hostname.replace(/^www\./, '').toLowerCase()
  const path = u.pathname.toLowerCase()

  if (host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com')) {
    return 'youtube'
  }
  if (host === 'x.com' || host === 'twitter.com') {
    return 'x'
  }
  if (host === 'github.com') {
    if (
      path.includes('/blob/') ||
      path.includes('/tree/') ||
      path.endsWith('.md') ||
      path.includes('readme')
    ) {
      return 'readme'
    }
  }
  if (
    host.includes('velog') ||
    host === 'medium.com' ||
    host.includes('tistory') ||
    host.includes('brunch.co.kr')
  ) {
    return 'blog'
  }
  return 'article'
}

/** X/트위터는 로그인·JS 페이지라 fetch 시 오류 안내 HTML만 옴 → 본문 분석에 쓰지 않음 */
function isXOrTwitterHost(urlStr: string): boolean {
  try {
    const host = new URL(urlStr.trim()).hostname.replace(/^www\./, '').toLowerCase()
    return host === 'x.com' || host === 'twitter.com'
  } catch {
    return false
  }
}

/** /user/status/123 → user */
function xStatusHandleFromUrl(urlStr: string): string | null {
  try {
    const u = new URL(urlStr.trim())
    if (!isXOrTwitterHost(urlStr)) return null
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length >= 2 && parts[1].toLowerCase() === 'status' && /^[A-Za-z0-9_]{1,15}$/.test(parts[0])) {
      return parts[0]
    }
    if (parts.length >= 1 && /^[A-Za-z0-9_]{1,15}$/.test(parts[0])) {
      return parts[0]
    }
    return null
  } catch {
    return null
  }
}

export interface ColumnScrapAiFillResult {
  title: string
  summary: string
  bodyMd: string
  sourceKind: ColumnSourceKind
  coverImageUrl: string | null
  tags: string[]
  rawResponse?: string
}

/** JSON 단계에서 본문이 짧게 나온 경우 심층 분석만으로 마크다운 본문 재생성 */
async function expandColumnBodyMarkdown(params: {
  url: string
  title: string
  summaryLine: string
  siteAnalysis: string
}): Promise<string> {
  const { url, title, summaryLine, siteAnalysis } = params
  const prompt = `아래 [심층 분석 노트]만 참고해 칼럼 스크랩용 마크다운 본문을 작성하세요. JSON 금지, 마크다운 원문만 출력.

URL: ${url}
제목: ${title}
목록용 한 줄 요약(요약 섹션과 맞출 것): ${summaryLine}

[심층 분석 노트]
${siteAnalysis}

필수 구조:
1) 첫 줄: ## 요약
2) 빈 줄 후 2~4문장 (위 한 줄 요약을 풀어 쓴 느낌)
3) 빈 줄 후 줄: ## 상세 정리
4) 빈 줄 후: 글머리(- ) 최소 8개 또는 ### 소제목 4개 이상. 각 항목에 1~2문장 설명. 노트의 구체적 용어·수치·절차를 빠짐없이 반영.
5) 전체 1200자 이상 목표 (가능하면 2000자까지).`
  return generate(prompt)
}

/**
 * 칼럼 스크랩 폼용: URL만으로 제목·요약·마크다운 메모·형식·표지(og:image)·태그 제안
 * X/트위터는 HTML fetch를 하지 않음(오류·확장프로그램 안내 문구만 와서 AI가 오염됨).
 */
export async function suggestColumnScrapFromUrl(url: string): Promise<ColumnScrapAiFillResult> {
  const trimmed = url.trim()
  if (!trimmed) {
    throw new Error('url is required')
  }

  const kindHint = inferColumnSourceKindFromUrl(trimmed)
  const skipHtml = isXOrTwitterHost(trimmed)

  if (skipHtml) {
    const handle = xStatusHandleFromUrl(trimmed)
    const handleLine = handle ? `계정 @${handle} 로 추정됩니다.` : '계정명은 URL에서 추정하지 못했습니다.'
    const xPrompt = `다음은 X(트위터) 포스트 링크입니다. 서버에서는 로그인·쿠키 없이 트윗 본문을 읽을 수 없습니다.
웹에서 보이는 "Something went wrong", 확장 프로그램 경고 등의 HTML은 제공하지 않습니다. 그런 문구를 title·summary·bodyMd에 절대 넣지 마세요.

URL: ${trimmed}
${handleLine}

JSON만 출력 (코드펜스 금지). bodyMd는 반드시 아래 구조의 마크다운 문자열(줄바꿈은 \\n으로 이스케이프):
- 첫 줄: ## 요약
- 그 다음 2~3문장: 왜 이 링크를 스크랩하는지, 원문에서 무엇을 확인해야 하는지
- 빈 줄 후 ## 상세 정리
- 글머리로 최소 5개: 원문에서 확인할 질문·체크리스트·메모 포인트(가능한 한 구체적으로. "내용 확인" 같은 빈 문구 금지)

필드:
- title: 40자 이내. 예: "@${handle ?? 'user'} — X 포스트"
- summary: 목록 카드용 한 줄(80자 이내)
- bodyMd: 위 구조 준수
- sourceKind: x
- tags: 최대 3개

형식:
{"title":"","summary":"","bodyMd":"","sourceKind":"x","tags":[]}`

    const raw = await generate(xPrompt)
    let jsonStr = raw
    const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlock) jsonStr = codeBlock[1].trim()

    const defaultTitle = handle ? `@${handle} — X 포스트` : 'X 포스트'
    const defaultSummary = '트윗 본문은 원문 링크에서 확인하세요.'
    const defaultBody = `## 요약\n\n서버에서는 X 로그인 없이 트윗 본문을 가져올 수 없습니다. 아래 링크로 열어 내용을 확인한 뒤, 인상적인 문장·링크·이미지를 이 메모에 덧붙이면 좋습니다.\n\n- 원문: [열기](${trimmed})\n\n## 상세 정리\n\n- 원문에서 **핵심 주장**이나 **수치·근거**가 있는지 확인해 메모하세요.\n- **댓글·인용**에서 추가 맥락이 있는지 봅니다.\n- 나중에 다시 찾기 쉽도록 **키워드**나 **관련 주제**를 적어 둡니다.\n- 동일 주제의 후속 포스트가 있으면 링크를 추가합니다.\n- 정책·출처가 중요하면 캡처나 인용 문구를 남깁니다.`

    let parsed: {
      title?: string
      summary?: string
      bodyMd?: string
      sourceKind?: string
      tags?: unknown
    }
    try {
      parsed = JSON.parse(jsonStr) as {
        title?: string
        summary?: string
        bodyMd?: string
        sourceKind?: string
        tags?: unknown
      }
    } catch {
      return {
        title: defaultTitle,
        summary: defaultSummary,
        bodyMd: defaultBody,
        sourceKind: 'x',
        coverImageUrl: null,
        tags: handle ? ['X', handle] : ['X'],
        rawResponse: raw,
      }
    }

    const tags: string[] = []
    if (Array.isArray(parsed.tags)) {
      for (const t of parsed.tags) {
        if (typeof t !== 'string') continue
        const s = t.trim()
        if (s && tags.length < 5) tags.push(s)
      }
    }
    if (tags.length === 0) tags.push('X')

    return {
      title: (parsed.title?.trim() || defaultTitle).replace(/something went wrong/gi, '').trim() || defaultTitle,
      summary: (parsed.summary?.trim() || defaultSummary).replace(/something went wrong/gi, '').trim() || defaultSummary,
      bodyMd: (parsed.bodyMd?.trim() || defaultBody).replace(/something went wrong/gi, '').trim() || defaultBody,
      sourceKind: 'x',
      coverImageUrl: null,
      tags,
      rawResponse: raw,
    }
  }

  const content = await fetchWebsiteContent(trimmed)
  const coverImageUrl = content?.ogImageUrl ?? null
  let siteAnalysis = ''

  if (content && content.fullText.trim().length > 40) {
    const analyzePrompt = `역할: 웹 스크랩용 **심층 분석 노트** 작성. 아래는 페이지에서 추출한 텍스트입니다. 한국어로만 답하세요.

다음을 빠짐없이 채우세요. 총 분량 **800~1800자** 권장(짧게 끊지 말 것).

1) **주제 한 줄**: 무엇에 대한 글·문서·영상·저장소인지
2) **핵심 내용**: 주장, 절차, API·명령, 설정값, 버전, 수치, 인용 등 **구체적 사실**을 원문에 가깝게 (가능하면 용어·코드명 유지)
3) **구조**: 목차·단계·섹션이 있으면 어떤 순서로 전개되는지
4) **대상 독자**: 누가 읽으면 좋은지
5) **활용**: 실무·학습에서 어떻게 쓸 수 있는지
6) **전제·한계**: 문서에 적힌 제한, 주의, "실험적" 표기 등

불확실하면 [추측]이라고 표시하세요. 홍보 문구만 있고 실질 정보가 없으면 그 사실을 명시하세요.

URL: ${trimmed}

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

  const pageTitleLine = content?.title
    ? `페이지 제목(HTML): ${content.title}`
    : '페이지 제목을 가져오지 못했습니다.'
  const urlKindLine = `URL 패턴 기준 추정 형식(참고): ${kindHint}. 더 맞으면 sourceKind에 반영하세요.`

  const contextBlock = siteAnalysis
    ? `[심층 분석 노트 — 반드시 bodyMd의 "상세 정리"에 반영할 재료]\n${siteAnalysis}\n\n`
    : `[페이지 본문 없음 또는 fetch 실패 — URL·제목만으로 추론]\nURL: ${trimmed}\n\n`

  const metadataPrompt = `${contextBlock}${pageTitleLine}
${urlKindLine}

칼럼 스크랩용으로 **JSON 한 개만** 출력하세요. 설명 문장·코드펜스 금지.

규칙:
- title: 카드·목록용(40자 이내). HTML 제목을 다듬어도 됩니다.
- summary: **목록 카드용 한 줄**(80자 이내). 핵심만 압축한 문장 1개.
- bodyMd: 마크다운 문자열. **반드시** 아래 두 섹션을 순서대로 포함하세요. 줄바꿈은 JSON 안에서 \\n 으로 이스케이프.
  - 첫 블록: 줄 "## 요약" 다음에 빈 줄, 그다음 **2~4문장**. summary와 같은 뉘앙스이되 조금만 풀어 씀.
  - 둘째 블록: 줄 "## 상세 정리" 다음에 빈 줄, 그다음 **최소 6개의 글머리(- )** 또는 **소제목(### ) 3개 이상**으로 나누어 서술. [심층 분석 노트]의 구체적 사실·용어·수치를 빠짐없이 녹일 것. **본문(요약+상세) 합계 1200자 이상**을 목표(가능하면 1800자까지). 짧은 불릿만 나열하지 말고 각 항목마다 1~2문장 설명을 붙일 것.
- sourceKind: blog | article | readme | youtube | x | other 중 하나
- tags: 주제 키워드, 최대 5개

형식 예(참고용, 이스케이프에 유의):
{"title":"","summary":"","bodyMd":"## 요약\\n\\n...\\n\\n## 상세 정리\\n\\n...","sourceKind":"article","tags":["키워드"]}`

  const raw = await generate(metadataPrompt)

  let jsonStr = raw
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) jsonStr = codeBlock[1].trim()

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
    parsed = JSON.parse(jsonStr) as {
      title?: string
      summary?: string
      bodyMd?: string
      sourceKind?: string
      tags?: unknown
    }
  } catch {
    const fallbackTitle =
      content?.title?.trim() ||
      (() => {
        try {
          return new URL(trimmed).hostname.replace(/^www\./, '')
        } catch {
          return '스크랩'
        }
      })()
    return {
      title: fallbackTitle,
      summary: '',
      bodyMd: raw.slice(0, 600),
      sourceKind: kindHint,
      coverImageUrl,
      tags: [],
      rawResponse,
    }
  }

  let sourceKind: ColumnSourceKind = kindHint
  if (parsed.sourceKind && isColumnSourceKind(parsed.sourceKind)) {
    sourceKind = parsed.sourceKind
  }

  const tags: string[] = []
  if (Array.isArray(parsed.tags)) {
    for (const t of parsed.tags) {
      if (typeof t !== 'string') continue
      const s = t.trim()
      if (s && tags.length < 5) tags.push(s)
    }
  }

  const title =
    parsed.title?.trim() ||
    content?.title?.trim() ||
    (() => {
      try {
        return new URL(trimmed).hostname.replace(/^www\./, '')
      } catch {
        return '스크랩'
      }
    })()

  let bodyMd = parsed.bodyMd?.trim() ?? ''
  const summaryLine = parsed.summary?.trim() ?? ''
  const summaryForExpand = summaryLine || title.slice(0, 120)

  if (siteAnalysis.length >= 400 && bodyMd.length < 550) {
    try {
      const expanded = await expandColumnBodyMarkdown({
        url: trimmed,
        title,
        summaryLine: summaryForExpand,
        siteAnalysis,
      })
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
    title,
    summary: parsed.summary?.trim() ?? '',
    bodyMd,
    sourceKind,
    coverImageUrl,
    tags,
    rawResponse,
  }
}
