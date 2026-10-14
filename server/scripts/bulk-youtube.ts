/**
 * 유튜브 링크 일괄 등록 (로컬 전용).
 *
 *   1) 미리보기:  npm run bulk-youtube -w server -- prepare <links.txt> [--local]
 *      → 링크마다 중복 확인 · 섹션 분류 · AI 채우기 · GitHub 레포 찾기 → <links>.preview.json
 *   2) 검토:      preview.json 에서 include / section / url / data 수정
 *                 (url을 고치면 data를 지우고 `refill <links.preview.json>` → 그 항목만 AI로 다시 채움)
 *   3) 저장:      npm run bulk-youtube -w server -- save <links.preview.json>
 *      → 사이트 관리자 계정으로 로그인(server/.env 의 BULK_EMAIL / BULK_PASSWORD, 없으면 터미널에서 입력) 후 저장.
 *        저장된 항목은 savedSlug 기록 → 재실행 시 건너뜀.
 *
 * AI 개발 도구 섹션은 기존 관례대로 **도구의 GitHub 레포·공식 사이트를 메인 링크**로 쓰고,
 * 영상은 「소개 영상」 추가 링크로 붙인다. 영상 하나에 도구가 여럿이면 도구마다 항목을 만든다.
 *
 * 로컬(가정용 IP)에서는 서버 자막 fetch가 되므로 Gemini 영상 분석 비용이 거의 들지 않는다.
 */
import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import type { AiRequestPreference } from '../src/services/ai/providers/registry.js'
import { parseYoutubeVideoId } from '../src/services/youtube-transcript-text.js'
import {
  SECTIONS,
  linkKey,
  loadSavedLinks,
  videoContext,
  classify,
  findRepoLinks,
  resolveTool,
  fill,
  createInSection,
  type Section,
  type ExtraLink,
} from '../src/services/quick-save/index.js'

type PreviewEntry = {
  /** 저장될 메인 링크 (AI 개발 도구는 도구 레포·사이트, 그 외는 영상) */
  url: string
  /** 원본 영상 */
  videoUrl: string
  videoId: string
  /** false면 저장 안 함 (중복·실패는 자동 false) */
  include: boolean
  section: Section
  reason: string
  /** AI 개발 도구: 도구 이름 */
  toolName?: string
  /** 사람이 확인해야 할 점 (예: 검색으로 찾은 링크) */
  check?: string
  duplicateOf?: string
  error?: string
  savedSlug?: string
  /** 섹션별 저장 필드 (section을 바꾸면 sourceKind/mediaKind/category도 맞춰 수정) */
  data?: Record<string, unknown> & { extraLinks?: ExtraLink[] }
}

// ---------- 명령 ----------

async function prepare(linksPath: string, pref: AiRequestPreference) {
  const urls = readFileSync(linksPath, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))

  const saved = await loadSavedLinks()
  const seen = new Set<string>()
  const out: PreviewEntry[] = []
  const outPath = linksPath.replace(/\.[^.\\/]+$/, '') + '.preview.json'
  const flush = () => writeFileSync(outPath, JSON.stringify(out, null, 2)) // 도중에 끊겨도 결과 보존

  for (const [i, url] of urls.entries()) {
    const tag = `[${i + 1}/${urls.length}]`
    const videoId = parseYoutubeVideoId(url)
    if (!videoId) {
      console.log(`${tag} ✗ 유튜브 링크 아님: ${url}`)
      continue
    }
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    const base = { videoUrl, videoId, reason: '' }
    if (seen.has(`yt:${videoId}`)) {
      console.log(`${tag} ⤳ 목록 안 중복: ${url}`)
      continue
    }
    seen.add(`yt:${videoId}`)

    const dupVideo = saved.get(`yt:${videoId}`)
    if (dupVideo) {
      console.log(`${tag} ⤳ 이미 저장된 영상: ${dupVideo}`)
      out.push({ ...base, url: videoUrl, include: false, section: 'column', duplicateOf: dupVideo })
      continue
    }

    try {
      const ctx = await videoContext(videoUrl)
      const c = await classify(pref, ctx)

      if (c.section !== 'ai-tool') {
        const data = await fill(c.section, videoUrl, pref)
        const extraLinks = await findRepoLinks([ctx, data.bodyMd], c.repos)
        out.push({ ...base, url: videoUrl, include: true, section: c.section, reason: c.reason, data: { ...data, extraLinks } })
        const repoNote = extraLinks.length ? ` · 레포 ${extraLinks.map((l) => l.label.replace('GitHub: ', '')).join(', ')}` : ''
        console.log(`${tag} ✓ ${SECTIONS[c.section].label} · ${data.title}${repoNote}`)
        flush()
        continue
      }

      // AI 개발 도구: 도구마다 레포·사이트를 메인 링크로
      if (c.tools.length === 0) throw new Error('AI 개발 도구로 분류됐지만 도구 이름을 찾지 못함')
      console.log(`${tag} ▸ AI 개발 도구 — ${c.tools.map((t) => t.name).join(', ')}`)
      for (const tool of c.tools) {
        const resolved = await resolveTool(tool, ctx)
        if (!resolved) {
          out.push({ ...base, url: videoUrl, include: false, section: 'ai-tool', reason: c.reason, toolName: tool.name, error: '도구 레포·사이트를 찾지 못함 — url을 직접 넣고 data를 채우거나 제외' })
          console.log(`      ✗ ${tool.name}: 링크 못 찾음`)
          continue
        }
        const key = linkKey(resolved.url)
        const dup = saved.get(key) ?? (seen.has(key) ? '이번 목록의 다른 영상' : undefined)
        if (dup) {
          out.push({ ...base, url: resolved.url, include: false, section: 'ai-tool', reason: c.reason, toolName: tool.name, duplicateOf: dup })
          console.log(`      ⤳ ${tool.name}: 이미 저장된 도구 — ${dup}`)
          continue
        }
        seen.add(key)
        const data = await fill('ai-tool', resolved.url, pref)
        const extraLinks = [...resolved.extra, { label: '소개 영상', url: videoUrl }]
        out.push({ ...base, url: resolved.url, include: true, section: 'ai-tool', reason: c.reason, toolName: tool.name, check: resolved.check, data: { ...data, extraLinks } })
        console.log(`      ✓ ${data.title} — ${resolved.url}${resolved.check ? '  (확인 필요)' : ''}`)
        flush()
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      out.push({ ...base, url: videoUrl, include: false, section: 'column', error: msg })
      console.log(`${tag} ✗ 실패: ${videoUrl} — ${msg}`)
    }
    flush()
  }

  flush()
  const n = (f: (e: PreviewEntry) => boolean) => out.filter(f).length
  console.log(`\n미리보기: ${outPath}`)
  console.log(`저장 예정 ${n((e) => e.include)}개 (확인 필요 ${n((e) => e.include && !!e.check)}) · 중복 ${n((e) => !!e.duplicateOf)}개 · 실패 ${n((e) => !!e.error)}개`)
  console.log('검토 후: npm run bulk-youtube -w server -- save ' + outPath)
}

/** 검토 중 url을 직접 고친 항목(include: true, data 삭제)만 AI로 다시 채움 */
async function refill(previewPath: string, pref: AiRequestPreference) {
  const entries = JSON.parse(readFileSync(previewPath, 'utf8')) as PreviewEntry[]
  const saved = await loadSavedLinks()
  for (const e of entries.filter((x) => x.include && !x.data && !x.savedSlug)) {
    const dup = saved.get(linkKey(e.url))
    if (dup) {
      Object.assign(e, { include: false, duplicateOf: dup, error: undefined })
      console.log(`⤳ 이미 저장됨: ${e.url} — ${dup}`)
      continue
    }
    try {
      const data = await fill(e.section, e.url, pref)
      const extraLinks = e.url === e.videoUrl ? [] : [{ label: '소개 영상', url: e.videoUrl }]
      Object.assign(e, { data: { ...data, extraLinks }, error: undefined, check: undefined })
      console.log(`✓ ${data.title} — ${e.url}`)
    } catch (err) {
      e.error = err instanceof Error ? err.message : String(err)
      console.log(`✗ ${e.url} — ${e.error}`)
    }
    writeFileSync(previewPath, JSON.stringify(entries, null, 2))
  }
}

/** 터미널 입력 (hidden=true면 입력 내용을 * 로 가림) */
function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin
    process.stdout.write(question)
    let buf = ''
    stdin.setRawMode?.(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    const onData = (ch: string) => {
      for (const c of ch) {
        if (c === '\r' || c === '\n') {
          stdin.setRawMode?.(false)
          stdin.pause()
          stdin.off('data', onData)
          process.stdout.write('\n')
          return resolve(buf)
        }
        if (c === '\u0003') process.exit(130) // Ctrl+C
        if (c === '\u007f' || c === '\b') {
          if (buf) {
            buf = buf.slice(0, -1)
            process.stdout.write('\b \b')
          }
          continue
        }
        buf += c
        process.stdout.write(hidden ? '*' : c)
      }
    }
    stdin.on('data', onData)
  })
}

async function login(): Promise<string> {
  const email = process.env.BULK_EMAIL || (await ask('관리자 이메일: '))
  const password = process.env.BULK_PASSWORD || (await ask('비밀번호: ', true))
  const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error('로그인 실패: ' + (error?.message ?? 'no session'))
  return data.session.access_token
}

async function save(previewPath: string) {
  const entries = JSON.parse(readFileSync(previewPath, 'utf8')) as PreviewEntry[]
  const pending = entries.filter((e) => e.include && !e.savedSlug && e.data)
  if (pending.length === 0) return console.log('저장할 항목이 없습니다.')
  const token = await login()
  const saved = await loadSavedLinks() // 미리보기 이후 수동 저장분까지 다시 확인

  for (const e of pending) {
    const dup = saved.get(linkKey(e.url))
    if (dup) {
      console.log(`⤳ 건너뜀 (이미 저장됨): ${dup}`)
      continue
    }
    try {
      const row = await createInSection(token, e.section, e.url, e.data as Record<string, any>)
      e.savedSlug = row.slug
      saved.set(linkKey(e.url), row.slug) // 같은 실행 안 중복 방지
      console.log(`✓ ${SECTIONS[e.section].label} · ${row.title} (/${SECTIONS[e.section].path}/${row.slug})`)
    } catch (err) {
      console.log(`✗ 저장 실패: ${e.url} — ${err instanceof Error ? err.message : String(err)}`)
    }
    writeFileSync(previewPath, JSON.stringify(entries, null, 2))
  }
}

const [cmd, file, ...flags] = process.argv.slice(2)
const pref: AiRequestPreference = flags.includes('--local') ? 'local' : 'api'
;(async () => {
  if (cmd === 'prepare' && file) await prepare(file, pref)
  else if (cmd === 'refill' && file) await refill(file, pref)
  else if (cmd === 'save' && file) await save(file)
  else console.log('사용법: prepare <links.txt> [--local]  |  refill <links.preview.json> [--local]  |  save <links.preview.json>')
})().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
