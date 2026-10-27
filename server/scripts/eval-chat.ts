/**
 * 대화창 검색 성능 측정 — 같은 질문 세트로 정답 자료 회수율·지연·토큰·도구 호출을 잰다. ADR 0033 전후 비교용.
 *
 *   npm run eval-chat -w server -- <label> [반복=3]
 *   → docs/plans/rag-eval/<label>.json
 *
 * 질문 종류: find = 자료 찾기(제목·요약으로 고를 수 있음), detail = 원문 속 세부(제목·요약·태그엔 없고 원문에만 있음 — 2026-10-27 DB에서 확인).
 * 정답 판정: 답변에 정답 자료의 사이트 경로(예: column/ai-1) 또는 이름(유용한 링크는 상세 페이지가 없어 이름)이 나오면 회수.
 */
import '../src/env.js'
import fs from 'node:fs'
import path from 'node:path'
import { chat, type ChatStats } from '../src/services/chat.js'

type Q = { kind: 'find' | 'detail'; q: string; expect: string[] }

const QUESTIONS: Q[] = [
  { kind: 'find', q: '하네스 엔지니어링 알려줘', expect: ['column/ai-1', 'column/mac-mini-ai', 'column/ai-playwright-e2e'] },
  { kind: 'find', q: '무료 이미지 소스 사이트 있어?', expect: ['Pexels', 'Pixabay'] },
  { kind: 'find', q: '목소리 클론 AI 뭐 있어?', expect: ['Uberduck', 'Supertone'] },
  { kind: 'find', q: '랙돌 관련 자료', expect: ['game-dev/ragdoll'] },
  { kind: 'find', q: 'AI로 2D 스프라이트 만드는 방법', expect: ['game-dev/ai-aether-2d', 'game-dev/perfectpixel-studio-ai', 'game-dev/aldegad-sprite-gen-ai-2d'] },
  { kind: 'find', q: '언리얼 엔진 자료 보여줘', expect: ['game-dev/5', 'game-dev/5-8', 'game-dev/warko-3d-1', 'game-dev/claude-code-ue5'] },
  { kind: 'find', q: '루프 엔지니어링에 대해 알려줘', expect: ['column/claude-code-2', 'column/ai-4'] },
  { kind: 'find', q: '랜딩페이지 만들 때 참고할 사이트', expect: ['Framer', 'Webflow', 'MotionSites', 'Mobbin'] },
  { kind: 'find', q: '유니티 관련 뭐 있어?', expect: ['game-dev/unity-cli-ai', 'game-dev/unity-cli-mcp-ai', 'game-dev/ai-2', 'game-dev/6-4', 'game-dev/ragdoll', 'game-dev/claude-code-unity-mcp-ai'] },
  { kind: 'find', q: '칼럼 중에 MCP 관련 글', expect: ['column/mcp-angular-next-js-nuxt-ai'] },
  { kind: 'detail', q: '프롬프트 캐싱으로 비용이 얼마나 줄어드는지 언급한 자료 있어?', expect: ['column/andrej-karpathy-llm-wiki'] },
  { kind: 'detail', q: 'Ralph 루프 다루는 자료 찾아줘', expect: ['ai-dev-tools/unlazy-ai', 'ai-dev-tools/ouroboros-ai-os', 'column/ai-1'] },
  { kind: 'detail', q: 'Claude Code Stop hook을 쓰는 도구 뭐 있어?', expect: ['ai-dev-tools/unlazy-ai', 'ai-dev-tools/impeccable'] },
  { kind: 'detail', q: 'pgvector 쓰는 자료 있어?', expect: ['ai-dev-tools/garry-tan-ai-gbrain', 'column/andrej-karpathy-llm-wiki'] },
  { kind: 'detail', q: 'Tauri로 데스크톱 앱을 만든 AI 도구 있어?', expect: ['ai-dev-tools/colibri-moe'] },
  { kind: 'detail', q: 'ONNX로 돌릴 수 있는 도구 뭐 있어?', expect: ['ai-dev-tools/laya', 'ai-dev-tools/voxcpm-tts'] },
  { kind: 'detail', q: 'Blender랑 같이 쓸 수 있는 AI 3D 생성 도구', expect: ['ai-dev-tools/hi3d-ai-3d'] },
  { kind: 'detail', q: '언리얼 PCG 언급한 자료', expect: ['game-dev/5'] },
  { kind: 'detail', q: 'GPU 인스턴싱 설명한 자료', expect: ['game-dev/6-4'] },
  { kind: 'detail', q: '스팀 위시리스트 얘기한 자료', expect: ['game-dev/item-mqpbigt0', 'game-dev/item-mqpbbrvb'] },
  { kind: 'detail', q: 'A2A 프로토콜 언급한 자료', expect: ['column/ai-1'] },
]

// 경로는 뒤에 다른 slug 문자가 이어지면 불일치 (column/ai-1 ≠ column/ai-10), 이름은 대소문자 무시
const found = (answer: string, e: string) =>
  e.includes('/')
    ? new RegExp(`/${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`).test(answer)
    : answer.toLowerCase().includes(e.toLowerCase())

const DIR = path.resolve(import.meta.dirname, '../../docs/plans/rag-eval')

type Run = { kind: Q['kind']; q: string; ms: number; promptTokens: number; outputTokens: number; rounds: number; calls: unknown[]; recall: number; hits: string[]; error?: string }

/** `compare a b` — 두 결과를 종류별 평균으로 (Markdown 표 + summary.json) */
function compare(labels: string[]) {
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / (xs.length || 1)
  const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0
  const summary: Record<string, Record<string, Record<string, number>>> = {}
  for (const l of labels) {
    const runs = (JSON.parse(fs.readFileSync(path.join(DIR, `${l}.json`), 'utf8')) as { runs: Run[] }).runs
    summary[l] = {}
    for (const kind of ['find', 'detail', 'all'] as const) {
      const rs = runs.filter((r) => kind === 'all' || r.kind === kind)
      summary[l][kind] = {
        runs: rs.length,
        recall: mean(rs.map((r) => r.recall)),
        hitRate: mean(rs.map((r) => (r.hits.length > 0 ? 1 : 0))),
        msMedian: median(rs.map((r) => r.ms)),
        msMean: mean(rs.map((r) => r.ms)),
        promptTokens: mean(rs.map((r) => r.promptTokens)),
        outputTokens: mean(rs.map((r) => r.outputTokens)),
        toolCalls: mean(rs.map((r) => r.calls.length)),
        rounds: mean(rs.map((r) => r.rounds)),
        errors: rs.filter((r) => r.error).length,
      }
    }
  }
  const pct = (x: number) => `${Math.round(x * 100)}%`
  const rows: [string, (m: Record<string, number>) => string][] = [
    ['정답 회수율(recall)', (m) => pct(m.recall)],
    ['정답 1개 이상', (m) => pct(m.hitRate)],
    ['응답 시간 중앙값', (m) => `${(m.msMedian / 1000).toFixed(1)}초`],
    ['입력 토큰 평균', (m) => Math.round(m.promptTokens).toLocaleString()],
    ['출력 토큰 평균', (m) => Math.round(m.outputTokens).toLocaleString()],
    ['도구 호출 평균', (m) => m.toolCalls.toFixed(1)],
  ]
  for (const kind of ['find', 'detail', 'all']) {
    console.log(`\n### ${kind}\n\n| 지표 | ${labels.join(' | ')} |\n|---|${labels.map(() => '---').join('|')}|`)
    for (const [name, f] of rows) console.log(`| ${name} | ${labels.map((l) => f(summary[l][kind])).join(' | ')} |`)
  }
  fs.writeFileSync(path.join(DIR, 'summary.json'), JSON.stringify(summary, null, 2))
}

if (process.argv[2] === 'compare') {
  compare(process.argv.slice(3))
  process.exit(0)
}

const label = process.argv[2]
const reps = Number(process.argv[3] ?? 3)
if (!label) throw new Error('usage: eval-chat <label> [reps] | eval-chat compare <a> <b>')

const runs = []
for (const item of QUESTIONS) {
  for (let r = 0; r < reps; r++) {
    const stats: ChatStats = { rounds: 0, promptTokens: 0, outputTokens: 0, calls: [] }
    const t0 = Date.now()
    let answer = ''
    let error: string | undefined
    try {
      answer = await chat([{ role: 'user', text: item.q }], stats)
    } catch (e) {
      error = (e as Error).message
    }
    const ms = Date.now() - t0
    const hits = item.expect.filter((e) => found(answer, e))
    runs.push({ ...item, rep: r, ms, ...stats, hits, recall: hits.length / item.expect.length, answer, error })
    console.log(`${item.kind.padEnd(6)} ${String(ms).padStart(6)}ms tok ${stats.promptTokens}/${stats.outputTokens} calls ${stats.calls.map((c) => c.name).join(',')} recall ${hits.length}/${item.expect.length}  ${item.q}`)
  }
}

const out = path.join(DIR, `${label}.json`)
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, JSON.stringify({ label, model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite', date: new Date().toISOString(), reps, runs }, null, 2))
console.log('→', out)
