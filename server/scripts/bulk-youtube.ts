/**
 * 유튜브 링크 일괄 등록 (로컬 전용).
 *
 *   1) 미리보기:  npm run bulk-youtube -w server -- prepare <links.txt> [--local]
 *      → 링크마다 중복 확인 · 섹션 분류 · AI 채우기 · GitHub 레포 찾기 → <links>.preview.json
 *   2) 검토:      preview.json 에서 include / section / url / data 수정
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
import { supabase } from '../src/db/supabase.js'
import { createColumnScrap } from '../src/db/queries/column-scraps.js'
import { createGameDevResource } from '../src/db/queries/game-dev-resources.js'
import { createAiToolScrap } from '../src/db/queries/ai-scraps.js'
import {
  suggestColumnScrapFromUrl,
  suggestGameDevResourceFromUrl,
  suggestAiToolScrapFromUrl,
} from '../src/services/ai/index.js'
import { getAiTextProvider, type AiRequestPreference } from '../src/services/ai/providers/registry.js'
import { fetchYoutubeContentBundle } from '../src/services/youtube-content.js'
import { parseYoutubeVideoId } from '../src/services/youtube-transcript-text.js'

type Section = 'column' | 'game-dev' | 'ai-tool'

const SECTIONS: Record<Section, { table: string; path: string; label: string; desc: string }> = {
  'ai-tool': {
    table: 'ai_tool_scraps',
    path: 'ai-dev-tools',
    label: 'AI 개발 도구',
    desc: '특정 AI 도구·모델·서비스를 소개하는 영상 (Claude Code·Cursor 등 AI 코딩 도구, 에이전트 터미널, MCP 서버, 에이전트 skill/rules, AI CLI, AI 이미지·비디오·음성 생성 모델, LLM 모델·API, AI 관련 오픈소스 레포)',
  },
  'game-dev': {
    table: 'game_dev_resources',
    path: 'game-dev',
    label: '게임 개발 도서관',
    desc: '게임 개발 (그래픽스·셰이더, 물리, 게임 AI, 게임플레이, 엔진(Unity/Unreal/Godot), 네트워크, 사운드, 최적화)',
  },
  column: {
    table: 'column_scraps',
    path: 'column',
    label: '칼럼',
    desc: '특정 도구 소개가 아닌 개발·기술 전반 (강연, 기술 트렌드, AI 활용 팁·생각, 커리어, 아키텍처, 일반 프로그래밍 등)',
  },
}

type ExtraLink = { label: string; url: string }

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

// ---------- 링크 정규화 · 중복 ----------

/** 중복 비교용 키: 유튜브는 영상 ID, GitHub은 owner/repo, 그 외는 host+path */
function linkKey(url: string): string {
  const yt = parseYoutubeVideoId(url)
  if (yt) return `yt:${yt}`
  try {
    const u = new URL(url.trim())
    const host = u.hostname.replace(/^www\./, '').toLowerCase()
    if (host === 'github.com') {
      const [owner, repo] = u.pathname.split('/').filter(Boolean)
      if (owner && repo) return `gh:${owner}/${repo.replace(/\.git$/, '')}`.toLowerCase()
    }
    return `web:${host}${u.pathname.replace(/\/+$/, '')}`.toLowerCase()
  } catch {
    return `raw:${url.trim()}`
  }
}

/** 세 섹션의 메인 링크 + 추가 링크 → linkKey 별 저장 위치 */
async function loadSavedLinks(): Promise<Map<string, string>> {
  const client = supabase.client
  if (!client) throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY 가 server/.env 에 없습니다.')
  const map = new Map<string, string>()
  for (const { table, path, label } of Object.values(SECTIONS)) {
    const { data, error } = await client.from(table).select('url, slug, title, extra_links')
    if (error) throw error
    for (const row of data ?? []) {
      const where = `${label} · ${row.title} (/${path}/${row.slug})`
      map.set(linkKey(String(row.url ?? '')), where)
      // 추가 링크의 영상도 "이미 처리한 영상"으로 본다 (AI 개발 도구의 소개 영상 등)
      for (const l of (row.extra_links ?? []) as ExtraLink[]) {
        const k = linkKey(String(l?.url ?? ''))
        if (k.startsWith('yt:') && !map.has(k)) map.set(k, where)
      }
    }
  }
  return map
}

// ---------- 영상 내용 · 분류 ----------

async function videoContext(url: string): Promise<string> {
  const bundle = await fetchYoutubeContentBundle(url)
  if (bundle) {
    const { meta, transcript } = bundle
    return `제목: ${meta.title}\n채널: ${meta.channel}\n설명:\n${meta.description}\n\n자막(앞부분):\n${transcript.slice(0, 6000)}`
  }
  // 자막 없는 영상: oEmbed 제목만으로 분류
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`)
    const j = (await r.json()) as { title?: string; author_name?: string }
    return `제목: ${j.title ?? ''}\n채널: ${j.author_name ?? ''}`
  } catch {
    return `URL: ${url}`
  }
}

function extractJson(raw: string): Record<string, unknown> | null {
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return null
  try {
    return JSON.parse(m[0]) as Record<string, unknown>
  } catch {
    return null
  }
}

type ToolHint = { name: string; repo?: string; site?: string }

async function classify(
  pref: AiRequestPreference,
  ctxText: string
): Promise<{ section: Section; reason: string; tools: ToolHint[]; repos: string[] }> {
  const list = Object.entries(SECTIONS)
    .map(([k, v]) => `- ${k}: ${v.label} — ${v.desc}`)
    .join('\n')
  const prompt = `아래 유튜브 영상을 개인 기술 블로그의 어느 섹션에 저장할지 고르세요.

섹션:
${list}

추가로:
- tools: section이 ai-tool이면 영상이 **주제로 소개하는** 도구·모델·서비스 목록(최대 5개). 정확한 제품 이름으로 적고(예: "Playwright"가 아니라 "Playwright MCP"), 시연 수단으로만 등장하는 도구(예: MCP를 붙이는 Claude Code)나 배경 기술은 넣지 마세요. 여러 도구를 비교·나열하는 영상이면 각각 넣으세요. 각 도구의 GitHub 저장소("owner/repo")와 공식 사이트 URL을 설명란·영상 내용에서 찾을 수 있으면 적고, 모르면 비워 두세요(추측한 URL 금지).
- repos: 그 외 섹션에서 영상이 소개·설명하는 GitHub 저장소("owner/repo", 설명란 링크나 명확히 언급된 것만).

JSON만 출력:
{"section":"column|game-dev|ai-tool","reason":"한 문장","tools":[{"name":"도구 이름","repo":"owner/repo","site":"https://..."}],"repos":["owner/repo"]}

[영상]
${ctxText}`
  const raw = await getAiTextProvider(pref).complete(prompt)
  const j = extractJson(raw) ?? {}
  const section = (Object.keys(SECTIONS) as Section[]).includes(j.section as Section)
    ? (j.section as Section)
    : 'column'
  const tools = (Array.isArray(j.tools) ? j.tools : [])
    .map((t) => t as Record<string, unknown>)
    .filter((t) => typeof t?.name === 'string' && t.name.trim())
    .slice(0, 5)
    .map((t) => ({
      name: String(t.name).trim(),
      repo: typeof t.repo === 'string' && t.repo.trim() ? t.repo.trim() : undefined,
      site: typeof t.site === 'string' && /^https?:\/\//.test(t.site) ? t.site.trim() : undefined,
    }))
  const repos = Array.isArray(j.repos) ? j.repos.map(String) : []
  return { section, reason: String(j.reason ?? ''), tools, repos }
}

// ---------- GitHub · 사이트 확인 ----------

const GH_HEADERS = { 'User-Agent': 'myLittleWebsite-bulk', Accept: 'application/vnd.github+json' }
const GITHUB_REPO_RE = /github\.com\/([\w.-]+)\/([\w.-]+)/gi
const GITHUB_NON_REPO_OWNERS = new Set(['sponsors', 'features', 'topics', 'orgs', 'settings', 'marketplace', 'about'])

type Repo = { fullName: string; url: string; homepage: string | null }

async function verifyRepo(ownerRepo: string): Promise<Repo | null> {
  const m = ownerRepo
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//, '')
    .match(/^([\w.-]+)\/([\w.-]+)/)
  if (!m || GITHUB_NON_REPO_OWNERS.has(m[1].toLowerCase())) return null
  try {
    const r = await fetch(`https://api.github.com/repos/${m[1]}/${m[2].replace(/\.git$/, '')}`, { headers: GH_HEADERS })
    if (!r.ok) return null
    const j = (await r.json()) as { full_name: string; html_url: string; homepage: string | null }
    return { fullName: j.full_name, url: j.html_url, homepage: j.homepage?.trim() || null }
  } catch {
    return null
  }
}

/** 이름으로 GitHub 검색 — 이름이 정확히 맞는 레포만 (사람 확인 필요 표시) */
async function searchRepo(name: string): Promise<Repo | null> {
  try {
    const q = encodeURIComponent(`${name} in:name`)
    const r = await fetch(`https://api.github.com/search/repositories?q=${q}&sort=stars&per_page=5`, { headers: GH_HEADERS })
    if (!r.ok) return null
    const j = (await r.json()) as { items?: { full_name: string; name: string; html_url: string; homepage: string | null; stargazers_count: number }[] }
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const hit = (j.items ?? []).find((it) => norm(it.name) === norm(name) && it.stargazers_count >= 50)
    return hit ? { fullName: hit.full_name, url: hit.html_url, homepage: hit.homepage?.trim() || null } : null
  } catch {
    return null
  }
}

async function siteReachable(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10_000) })
    return r.ok
  } catch {
    return false
  }
}

/** 텍스트의 github 링크 + AI가 짚은 레포 → 실제 존재하는 것만 추가 링크로 */
async function findRepoLinks(texts: string[], aiRepos: string[]): Promise<ExtraLink[]> {
  const candidates = new Set<string>(aiRepos)
  for (const t of texts) for (const m of t.matchAll(GITHUB_REPO_RE)) candidates.add(`${m[1]}/${m[2]}`)
  const out: ExtraLink[] = []
  for (const c of candidates) {
    const repo = await verifyRepo(c)
    if (repo && !out.some((l) => l.url === repo.url)) out.push({ label: `GitHub: ${repo.fullName}`, url: repo.url })
  }
  return out
}

/** AI 개발 도구: 도구의 메인 링크(레포 > 공식 사이트 > GitHub 검색) + 보조 링크 */
async function resolveTool(
  tool: ToolHint,
  descText: string
): Promise<{ url: string; extra: ExtraLink[]; check?: string } | null> {
  // 설명란에 도구 이름이 들어간 github 링크가 있으면 우선
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const fromDesc = [...descText.matchAll(GITHUB_REPO_RE)]
    .map((m) => `${m[1]}/${m[2]}`)
    .find((r) => norm(r).includes(norm(tool.name)))

  // AI가 준 레포는 이름이 도구와 맞을 때만 (엉뚱한 레포 짐작 방지)
  const aiRepo = tool.repo && norm(tool.repo).includes(norm(tool.name)) ? tool.repo : null
  let repo = (fromDesc && (await verifyRepo(fromDesc))) || (aiRepo ? await verifyRepo(aiRepo) : null)
  const site = tool.site && (await siteReachable(tool.site)) ? tool.site : null
  let check: string | undefined

  if (!repo && !site) {
    repo = await searchRepo(tool.name)
    if (repo) check = `영상에 링크가 없어 GitHub 검색으로 찾은 레포 (${repo.fullName}) — 맞는지 확인`
  }
  if (!repo && !site) return null

  const main = repo?.url ?? site!
  const extra: ExtraLink[] = []
  const other = repo ? (site ?? repo.homepage) : null
  if (other && linkKey(other) !== linkKey(main)) extra.push({ label: '공식 사이트', url: other })
  return { url: main, extra, check }
}

// ---------- AI 채우기 ----------

async function fill(section: Section, url: string, pref: AiRequestPreference) {
  if (section === 'column') {
    const r = await suggestColumnScrapFromUrl(url, pref)
    return { title: r.title, summary: r.summary, bodyMd: r.bodyMd, sourceKind: r.sourceKind, coverImageUrl: r.coverImageUrl, tags: r.tags }
  }
  if (section === 'game-dev') {
    const r = await suggestGameDevResourceFromUrl(url, pref)
    return { title: r.title, summary: r.summary, bodyMd: r.bodyMd, mediaKind: r.mediaKind, category: r.category, coverImageUrl: r.coverImageUrl, tags: r.tags }
  }
  const r = await suggestAiToolScrapFromUrl(url, pref)
  return { title: r.title, summary: r.summary, bodyMd: r.bodyMd, sourceKind: r.sourceKind, tags: r.tags }
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
    const d = e.data as Record<string, any>
    try {
      const base = { title: d.title, url: e.url, summary: d.summary, bodyMd: d.bodyMd, tags: d.tags, extraLinks: d.extraLinks ?? [] }
      const row =
        e.section === 'column'
          ? await createColumnScrap(token, { ...base, sourceKind: d.sourceKind ?? 'youtube', coverImageUrl: d.coverImageUrl })
          : e.section === 'game-dev'
            ? await createGameDevResource(token, { ...base, mediaKind: d.mediaKind ?? 'youtube', category: d.category ?? 'etc', coverImageUrl: d.coverImageUrl })
            : await createAiToolScrap(token, { ...base, sourceKind: d.sourceKind ?? 'other' })
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
  else if (cmd === 'save' && file) await save(file)
  else console.log('사용법: prepare <links.txt> [--local]  |  save <links.preview.json>')
})().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
