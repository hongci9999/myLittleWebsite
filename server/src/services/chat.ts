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

const SYSTEM = `너는 이 웹사이트의 자료 검색 도우미다. 사이트 주인이 저장한 자료(AI 개발 도구, 칼럼, 게임 개발 자료, 유용한 링크)와 포트폴리오·개발 기록을 도구로 찾아 한국어로 답한다.
- 자료 질문은 먼저 list_scraps로 후보를 찾고, 필요하면 get_scraps·get_source로 본문을 확인한다.
- 찾은 항목은 제목, 한 줄 요약, [사이트 링크](siteUrl) 목록으로 보여준다.
- 사이트 주인·프로젝트 질문은 get_portfolio(부트캠프 팀 프로젝트 포함), 프로젝트 상세는 get_project_record, 기술 결정 이유는 read_dev_notes.
- 도구로 확인한 내용만 말한다. 없으면 없다고 하고 지어내지 않는다.
- 답은 Markdown, 간결하게.`

const declarations = knowledgeTools.map((t) => ({
  name: t.name,
  description: t.description,
  parametersJsonSchema: z.toJSONSchema(z.object(t.inputSchema)),
}))

async function generate(contents: Content[]): Promise<Part[]> {
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
        tools: [{ functionDeclarations: declarations }],
      }),
      signal: AbortSignal.timeout(60_000),
    }
  )
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Part[] } }>
    error?: { message?: string }
  }
  if (!res.ok) throw new Error(`Gemini request failed: ${res.status} ${data.error?.message ?? ''}`)
  return data.candidates?.[0]?.content?.parts ?? []
}

export async function chat(messages: ChatMessage[]): Promise<string> {
  const contents: Content[] = messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }))

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const parts = await generate(contents)
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
        return { functionResponse: { name: fc!.name, response } }
      })
    )
    contents.push({ role: 'user', parts: responses })
  }
  return ''
}
