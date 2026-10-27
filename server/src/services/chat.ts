/**
 * 사이트 대화창 — Gemini function calling으로 knowledgeTools(MCP와 같은 도구)를 불러 답한다.
 * gemini-generate.ts는 텍스트 전용이라 도구 루프는 여기서 REST로 직접.
 */
import { z } from 'zod'
import { knowledgeTools } from './knowledge/index.js'

export type ChatMessage = { role: 'user' | 'model'; text: string }

type Part = {
  text?: string
  functionCall?: { name: string; args?: Record<string, unknown> }
  functionResponse?: { name: string; response: Record<string, unknown> }
}
type Content = { role: 'user' | 'model'; parts: Part[] }

const MAX_TOOL_ROUNDS = 5

/** 측정용 (scripts/eval-chat.ts) — 넘기면 채운다 */
export type ChatStats = {
  rounds: number
  promptTokens: number
  outputTokens: number
  calls: { name: string; args: Record<string, unknown>; resultChars: number }[]
}

const SYSTEM = `너는 이 웹사이트의 자료 검색 도우미다. 사이트 주인이 저장한 자료(AI 개발 도구, 칼럼, 게임 개발 자료, 유용한 링크)와 포트폴리오·개발 기록을 도구로 찾아 한국어로 답한다.
- 자료 질문은 먼저 list_scraps를 인자 없이 호출해 전체 목록(모든 섹션)을 받고, 제목·요약·태그의 의미로 관련 항목을 직접 고른다. 같은 주제가 여러 섹션(AI 개발 도구·칼럼·게임 개발·유용한 링크)에 흩어져 있으니 섹션을 짐작해 좁히지 않는다. section·tag 필터는 사용자가 섹션·태그를 직접 지정했을 때만 쓴다.
- 같은 회차에 search_sources(질문 그대로)도 함께 호출한다 — 원문·정리 본문 속에만 있는 세부 내용(기술·도구 이름, 설명)을 찾는다. 목록에서 고른 항목과 search_sources 조각의 소속 자료(id)를 합쳐 답한다. 조각의 유사도가 낮고 질문과 무관하면 무시한다.
- 답의 중심은 "관련 자료를 빠짐없이 나열"이다. 목록에서 관련 있는 항목은 모두 넣고, 조각은 "이 자료의 어디에 그 내용이 나오는지" 근거 한 줄로만 쓴다. 조각 내용으로 한 자료를 길게 풀어 설명하느라 다른 관련 자료를 빼지 않는다.
- 필요하면 get_scraps·get_source로 본문을 확인한다.
- 찾은 항목은 제목, 한 줄 요약, [사이트 링크](sitePath 또는 siteUrl) 목록으로 보여준다. 이 대화창은 사이트 안이라 "/column/slug" 같은 경로 링크로 충분하다.
- 사이트 주인·프로젝트 질문은 get_portfolio(부트캠프 팀 프로젝트 포함), 프로젝트 상세는 get_project_record(부트캠프 기록) 또는 get_source(카드의 repoUrl README·postUrl 후기), 기술 결정 이유는 read_dev_notes.
- 도구로 확인한 내용만 말한다. 없으면 없다고 하고 지어내지 않는다.
- 답은 Markdown, 간결하게.`

const declarations = knowledgeTools.map((t) => ({
  name: t.name,
  description: t.description,
  parametersJsonSchema: z.toJSONSchema(z.object(t.inputSchema)),
}))

async function generate(contents: Content[], noTools = false, stats?: ChatStats): Promise<Part[]> {
  const key = (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY)?.trim()
  if (!key) throw new Error('GEMINI_API_KEY not configured')
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        // 마지막 회차: 도구 선언을 빼서 지금까지 모은 결과로 답하게 (flash-lite는 functionCallingConfig NONE을 무시함)
        ...(!noTools && { tools: [{ functionDeclarations: declarations }] }),
      }),
      signal: AbortSignal.timeout(60_000),
    }
  )
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Part[] } }>
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number }
    error?: { message?: string }
  }
  if (!res.ok) throw new Error(`Gemini request failed: ${res.status} ${data.error?.message ?? ''}`)
  if (stats) {
    const u = data.usageMetadata ?? {}
    stats.rounds++
    stats.promptTokens += u.promptTokenCount ?? 0
    stats.outputTokens += (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0)
  }
  return data.candidates?.[0]?.content?.parts ?? []
}

export async function chat(messages: ChatMessage[], stats?: ChatStats): Promise<string> {
  const contents: Content[] = messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }))

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const last = round === MAX_TOOL_ROUNDS
    // 도구 선언만 빼면 기록을 따라 functionCall을 또 만들어서, 지시문도 같이 붙인다
    if (last) contents.at(-1)!.parts.push({ text: '도구 호출 한도에 도달했다. 더 호출하지 말고 지금까지 확인한 결과만으로 답하라.' })
    const parts = await generate(contents, last, stats)
    const calls = parts.filter((p) => p.functionCall)
    if (calls.length === 0 || round === MAX_TOOL_ROUNDS) {
      return parts.map((p) => p.text ?? '').join('').trim() || '답변을 만들지 못했어요.'
    }
    contents.push({ role: 'model', parts })
    const responses = await Promise.all(
      calls.map(async ({ functionCall: fc }) => {
        const tool = knowledgeTools.find((t) => t.name === fc!.name)
        let response: Record<string, unknown>
        try {
          if (!tool) throw new Error(`unknown tool ${fc!.name}`)
          response = { result: await tool.handler(fc!.args ?? {}) }
        } catch (err) {
          response = { error: err instanceof Error ? err.message : String(err) }
        }
        console.log('[chat] tool', fc!.name, JSON.stringify(fc!.args ?? {}))
        stats?.calls.push({ name: fc!.name, args: fc!.args ?? {}, resultChars: JSON.stringify(response).length })
        return { functionResponse: { name: fc!.name, response } }
      })
    )
    contents.push({ role: 'user', parts: responses })
  }
  return ''
}
