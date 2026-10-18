/**
 * 링크 하나 → 중복 확인 · 섹션 분류 · AI 채우기 · (AI 도구면) 레포 찾기.
 * `scripts/bulk-youtube.ts`(일괄 등록)와 `POST /api/quick-save`(원클릭 저장)가 같이 쓴다.
 *
 * AI 개발 도구 섹션은 **도구의 GitHub 레포·공식 사이트를 메인 링크**로 쓰고,
 * 영상은 「소개 영상」 추가 링크로 붙인다. 영상 하나에 도구가 여럿이면 도구마다 항목을 만든다.
 */
import { supabase, getSupabaseWithAuth } from '../../db/supabase.js'
import { createColumnScrap } from '../../db/queries/column-scraps.js'
import { createGameDevResource } from '../../db/queries/game-dev-resources.js'
import { createAiToolScrap } from '../../db/queries/ai-scraps.js'
import { createLink, getDimensionsWithValues } from '../../db/queries/links.js'
import { suggestLinkMeta } from '../ai/suggest-link-meta.js'
import {
  suggestColumnScrapFromUrl,
  suggestGameDevResourceFromUrl,
  suggestAiToolScrapFromUrl,
} from '../ai/index.js'
import { getAiTextProvider, type AiRequestPreference } from '../ai/providers/registry.js'
import { fetchYoutubeContentBundle, withProvidedYoutubeBundle } from '../youtube-content.js'
import { parseYoutubeVideoId } from '../youtube-transcript-text.js'
import { fetchWebsiteContent, withProvidedPage, type ProvidedPage } from '../fetch-website.js'

export type Section = 'column' | 'game-dev' | 'ai-tool'

export const SECTIONS: Record<Section, { table: string; path: string; label: string; desc: string }> = {
  'ai-tool': {
    table: 'ai_tool_scraps',
    path: 'ai-dev-tools',
    label: 'AI 개발 도구',
    desc: '특정 AI 도구·모델·서비스 자체를 소개·리뷰하는 자료 — 「이 도구가 뭐고 어떻게 쓰나」가 주제 (AI 코딩 도구, 에이전트 터미널, MCP 서버, 에이전트 skill/rules, AI CLI, 생성 모델, LLM API, AI 오픈소스 레포)',
  },
  'game-dev': {
    table: 'game_dev_resources',
    path: 'game-dev',
    label: '게임 개발 도서관',
    desc: '게임 만들기에 관한 모든 것 (그래픽스·셰이더·렌더링, 물리, 게임 AI, 게임플레이·게임 디자인·게임 필, 엔진(Unity/Unreal/Godot), 아트·스프라이트·에셋 제작, 네트워크, 사운드, 최적화, 인디·1인 개발 운영·비즈니스, 게임 개발에 AI 도구 쓰는 법)',
  },
  column: {
    table: 'column_scraps',
    path: 'column',
    label: '칼럼',
    desc: '게임 외 개발·기술 전반의 생각·설명 (강연·대담, 기술 트렌드, 개념 설명, AI 활용 팁·워크플로우·에이전트 설계론, 커리어, 아키텍처, 일반 프로그래밍)',
  },
}

export type ExtraLink = { label: string; url: string }

/** 「유용한 링크」(links 테이블) — 세 섹션과 스키마가 달라 SECTIONS 밖. 원클릭 저장에서 웹 페이지만 */
export const LINK_LABEL = '유용한 링크'

// ---------- 링크 정규화 · 중복 ----------

/** 중복 비교용 키: 유튜브는 영상 ID, GitHub은 owner/repo, 그 외는 host+path */
export function linkKey(url: string): string {
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

/**
 * 세 섹션의 메인 링크 + 추가 링크 + 유용한 링크 → linkKey 별 저장 위치.
 * `introOut`을 주면 추가 링크(소개 영상·글)는 메인 map 대신 거기에 담는다 — 원클릭 저장이
 * 「도구 몇 개만 저장된 영상」을 다시 처리해 남은 도구를 저장할 수 있게.
 */
export async function loadSavedLinks(introOut?: Map<string, string>): Promise<Map<string, string>> {
  const client = supabase.client
  if (!client) throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY 가 server/.env 에 없습니다.')
  const map = new Map<string, string>()
  for (const { table, path, label } of Object.values(SECTIONS)) {
    const { data, error } = await client.from(table).select('url, slug, title, extra_links')
    if (error) throw error
    for (const row of data ?? []) {
      const where = `${label} · ${row.title} (/${path}/${row.slug})`
      map.set(linkKey(String(row.url ?? '')), where)
      // 추가 링크의 영상·소개 글도 "이미 처리한 자료"로 본다 (AI 개발 도구의 소개 영상 등)
      for (const l of (row.extra_links ?? []) as ExtraLink[]) {
        const k = linkKey(String(l?.url ?? ''))
        const into = introOut ?? map
        if ((k.startsWith('yt:') || l?.label === '소개 글') && !into.has(k)) into.set(k, where)
      }
    }
  }
  const { data: links, error } = await client.from('links').select('url, title')
  if (error) throw error
  for (const l of links ?? []) map.set(linkKey(String(l.url ?? '')), `${LINK_LABEL} · ${l.title} (/links)`)
  return map
}

// ---------- 영상 내용 · 분류 ----------

export async function videoContext(url: string): Promise<string> {
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

/** 분류용 자료 내용: 유튜브는 자막, 그 외(글·레포)는 페이지 본문 */
async function sourceContext(url: string): Promise<string> {
  if (parseYoutubeVideoId(url)) return videoContext(url)
  const page = await fetchWebsiteContent(url)
  return `URL: ${url}\n${page?.fullText.slice(0, 6000) ?? ''}`
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

export type ToolHint = { name: string; repo?: string; site?: string }

/** `allowLink`: 웹 페이지면 「유용한 링크」(콘텐츠가 아닌 써먹는 사이트)도 후보. 고르면 `link: true` (section은 무시) */
export async function classify(
  pref: AiRequestPreference,
  ctxText: string,
  { allowLink = false } = {}
): Promise<{ section: Section; link: boolean; reason: string; tools: ToolHint[]; repos: string[] }> {
  const list = [
    ...Object.entries(SECTIONS).map(([k, v]) => `- ${k}: ${v.label} — ${v.desc}`),
    ...(allowLink
      ? [`- link: ${LINK_LABEL} — 글·영상 같은 콘텐츠가 아니라 써먹는 웹 서비스·사이트 자체의 첫 화면 (변환기·생성기 같은 웹 도구, 디자인 리소스·아이콘·폰트 모음, 레퍼런스·문서 사이트, 커뮤니티)`]
      : []),
  ].join('\n')
  const prompt = `아래 자료(유튜브 영상·웹 글·GitHub 레포)를 개인 기술 블로그의 어느 섹션에 저장할지 고르세요.

섹션:
${list}

판단 순서 (위에서 먼저 맞는 것):
${allowLink ? '0. 글·영상이 아니라 웹 서비스·사이트의 첫 화면 자체면 link — 단 AI 도구·모델의 공식 사이트면 2번(ai-tool).\n' : ''}1. 게임 개발에 관한 자료면 game-dev — 게임 엔진(Unity/Unreal/Godot) 프로젝트 이야기(AI 코딩·아키텍처 설계가 주제여도 대상이 게임 엔진 프로젝트면 game-dev), 특정 게임의 기획·시스템 디자인 분석, 또는 AI 도구·MCP로 게임 코드·아트·에셋을 만드는 과정·워크플로우. 단 AI 3D·모션·이미지 생성 모델·툴(예: NVIDIA Kimodo, Hi3D)을 소개·분석하는 자료는 게임 실무 활용을 다뤄도 2번.
2. AI 도구·모델·서비스·레포 자체를 소개하면 ai-tool — 도구 하나의 기능·설치·사용법 소개(에이전트 관리·오케스트레이션 도구 포함), 또는 여러 도구·레포를 하나씩 짚는 목록(추천·트렌딩 레포·「N가지 도구」).
3. 나머지는 column — AI 도구가 나와도 활용 팁·워크플로우·비교 의견·생각이 주제면 column. 웹 표준·브라우저 API(예: Canvas)는 게임에 쓸 수 있어도 column.

추가로:
- tools: section이 ai-tool일 때만, 자료가 **주제로 소개하는** AI 도구·모델·서비스 목록(최대 10개). 다른 섹션이면 빈 배열. 정확한 제품 이름으로 적고(예: "Playwright"가 아니라 "Playwright MCP"), 시연 수단으로만 등장하는 도구(예: MCP를 붙이는 Claude Code)나 배경 기술은 넣지 마세요. 여러 도구를 비교·나열하는 자료면 각각 넣으세요. 각 도구의 GitHub 저장소("owner/repo")와 공식 사이트 URL을 설명란·본문에서 찾을 수 있으면 적고, 모르면 비워 두세요(추측한 URL 금지).
- repos: 그 외 섹션에서 자료가 소개·설명하는 GitHub 저장소("owner/repo", 설명란 링크나 명확히 언급된 것만).

JSON만 출력:
{"section":"${allowLink ? 'link|' : ''}column|game-dev|ai-tool","reason":"한 문장","tools":[{"name":"도구 이름","repo":"owner/repo","site":"https://..."}],"repos":["owner/repo"]}

[자료]
${ctxText}`
  const raw = await getAiTextProvider(pref).complete(prompt)
  const j = extractJson(raw) ?? {}
  const section = (Object.keys(SECTIONS) as Section[]).includes(j.section as Section)
    ? (j.section as Section)
    : 'column'
  const tools = (Array.isArray(j.tools) ? j.tools : [])
    .map((t) => t as Record<string, unknown>)
    .filter((t) => typeof t?.name === 'string' && t.name.trim())
    .slice(0, 10)
    .map((t) => ({
      name: String(t.name).trim(),
      repo: typeof t.repo === 'string' && t.repo.trim() ? t.repo.trim() : undefined,
      site: typeof t.site === 'string' && /^https?:\/\//.test(t.site) ? t.site.trim() : undefined,
    }))
  const repos = Array.isArray(j.repos) ? j.repos.map(String) : []
  return { section, link: allowLink && j.section === 'link', reason: String(j.reason ?? ''), tools, repos }
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
export async function findRepoLinks(texts: string[], aiRepos: string[]): Promise<ExtraLink[]> {
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
export async function resolveTool(
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

// ---------- AI 채우기 · 저장 ----------

export async function fill(section: Section, url: string, pref: AiRequestPreference) {
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

/** 섹션 테이블에 한 건 저장 (fill 결과 또는 다른 섹션 행을 그대로 옮길 때) */
export async function createInSection(token: string, section: Section, url: string, d: Record<string, any>) {
  const base = { title: d.title, url, summary: d.summary, bodyMd: d.bodyMd, tags: d.tags, extraLinks: d.extraLinks ?? [] }
  const isYt = Boolean(parseYoutubeVideoId(url))
  const isGh = linkKey(url).startsWith('gh:')
  return section === 'column'
    ? createColumnScrap(token, { ...base, sourceKind: d.sourceKind ?? (isYt ? 'youtube' : isGh ? 'readme' : 'blog'), coverImageUrl: d.coverImageUrl })
    : section === 'game-dev'
      ? createGameDevResource(token, { ...base, mediaKind: d.mediaKind ?? (isYt ? 'youtube' : isGh ? 'repo' : 'article'), category: d.category ?? 'etc', coverImageUrl: d.coverImageUrl })
      : createAiToolScrap(token, { ...base, sourceKind: d.sourceKind ?? (isGh ? 'repo' : 'other') })
}

// ---------- 원클릭 저장 ----------

/** 유용한 링크: 링크 섹션의 AI 추천(사이트 분석 → 제목·설명·분류 태그)을 그대로 써서 저장 */
async function saveLink(token: string, url: string, pref: AiRequestPreference, aborted: () => void): Promise<QuickSaveResult> {
  try {
    const dims = await getDimensionsWithValues().catch(() => [])
    const m = await suggestLinkMeta(url, '', pref, dims)
    aborted()
    const row = await createLink(token, { url, title: m.title, description: m.description, valueIds: m.valueIds, faviconUrl: m.faviconUrl })
    return { url, section: 'link', id: row.id, title: row.title, sitePath: '/links' }
  } catch (e) {
    return { url, section: 'link', error: e instanceof Error ? e.message : String(e) }
  }
}

/** 클라이언트가 사용자 브라우저에서 받아 보낸 유튜브 자막 (Vercel IP는 자막 차단) */
export type ProvidedYoutube = { title: string; channel: string; description: string; transcript: string; lang?: string | null }

export type QuickSaveResult = {
  url: string
  section?: Section | 'link'
  id?: string
  slug?: string
  title?: string
  sitePath?: string
  check?: string
  duplicateOf?: string
  error?: string
}

/**
 * 링크 하나를 분류해 바로 저장 (초안 없음 — 오분류는 /move·DELETE로 고침).
 * AI 개발 도구 자료면 소개된 도구마다 항목을 따로 만들어 결과가 여러 개일 수 있다.
 * `signal`이 끊기면(확장에서 중단) 아직 저장 안 한 항목은 저장하지 않는다.
 * `log`: 단계별 진행(경과 초) — 확장의 「로그 복사」로 문제 보고용.
 */
export async function quickSave(
  token: string,
  rawUrl: string,
  opts: { youtube?: ProvidedYoutube; page?: ProvidedPage; signal?: AbortSignal; log?: (line: string) => void } = {}
): Promise<QuickSaveResult[]> {
  const { youtube: yt, page, signal } = opts
  const t0 = Date.now()
  const log = (m: string) => opts.log?.(`+${((Date.now() - t0) / 1000).toFixed(1)}s ${m}`)
  const videoId = parseYoutubeVideoId(rawUrl)
  const main = videoId ? `https://www.youtube.com/watch?v=${videoId}` : rawUrl.trim()
  const pref: AiRequestPreference = 'api'
  const aborted = () => {
    if (signal?.aborted) {
      log('중단 신호 받음 — 남은 저장 생략')
      throw new Error('중단됨')
    }
  }

  const run = async (): Promise<QuickSaveResult[]> => {
    const intro = new Map<string, string>()
    const saved = await loadSavedLinks(intro)
    log(`저장된 링크 ${saved.size}개 불러옴`)
    const dup = saved.get(linkKey(main))
    if (dup) {
      log(`이미 메인 링크로 저장됨: ${dup}`)
      return [{ url: main, duplicateOf: dup }]
    }
    // 다른 항목의 소개 영상·글로만 있으면 계속 — 그 자료의 도구 중 아직 안 저장된 것만 저장
    const introOf = intro.get(linkKey(main))
    if (introOf) log(`소개 링크로 이미 쓰임(${introOf}) — 남은 도구만 저장`)

    const ctx = await sourceContext(main)
    log(`자료 내용 ${ctx.length}자`)
    aborted()
    const c = await classify(pref, ctx, { allowLink: !videoId })
    log(`분류: ${c.link ? 'link' : c.section} — ${c.reason} / tools=[${c.tools.map((t) => t.name).join(', ')}]`)
    aborted()
    if (introOf && (c.link || c.section !== 'ai-tool')) return [{ url: main, duplicateOf: introOf }]
    if (c.link) {
      const r = await saveLink(token, main, pref, aborted)
      log(r.error ? `링크 저장 실패: ${r.error}` : `링크 저장: ${r.title}`)
      return [r]
    }

    // 저장할 (섹션, 메인 링크) 목록. 자료 자체가 레포면 도구 찾기 없이 그 레포.
    const isRepo = linkKey(main).startsWith('gh:')
    const introLabel = videoId ? '소개 영상' : '소개 글'
    const targets: { section: Section; url: string; extra: ExtraLink[]; check?: string }[] = []
    if (c.section !== 'ai-tool' || isRepo) targets.push({ section: c.section, url: main, extra: [] })
    if (c.section === 'ai-tool' && !isRepo) {
      const resolved = await Promise.all(c.tools.map((tool) => resolveTool(tool, ctx)))
      for (const r of resolved) {
        if (r && !targets.some((t) => linkKey(t.url) === linkKey(r.url)))
          targets.push({ section: 'ai-tool', url: r.url, extra: [...r.extra, { label: introLabel, url: main }], check: r.check })
      }
    }
    // 소개 링크로 이미 쓰인 자료면 영상 자체를 AI 도구로 또 만들지 않는다
    if (targets.length === 0 && introOf) return [{ url: main, duplicateOf: introOf }]
    if (targets.length === 0) {
      targets.push({ section: 'ai-tool', url: main, extra: [], check: `도구(${c.tools.map((t) => t.name).join(', ') || '?'}) 레포·사이트를 못 찾아 ${introLabel}을 메인 링크로 저장 — 확인` })
    }
    log(`저장 대상 ${targets.length}개: ${targets.map((t) => `${t.section} ${t.url}`).join(' | ')}`)
    aborted()

    // ponytail: 항목마다 AI 채우기(수십 초)를 병렬로 — 순차면 도구 여럿일 때 Vercel 300초를 넘긴다
    return Promise.all(
      targets.map(async (t): Promise<QuickSaveResult> => {
        const d = saved.get(linkKey(t.url))
        if (d) {
          log(`이미 저장된 도구: ${t.url}`)
          return { url: t.url, section: t.section, duplicateOf: d }
        }
        try {
          const data = await fill(t.section, t.url, pref)
          log(`AI 채우기 끝: ${t.url} → ${data.title}`)
          const repoLinks = t.section === 'ai-tool' ? [] : await findRepoLinks([ctx, data.bodyMd], c.repos)
          aborted()
          const row = await createInSection(token, t.section, t.url, { ...data, extraLinks: [...t.extra, ...repoLinks] })
          log(`저장: ${t.section}/${row.slug}`)
          return { url: t.url, section: t.section, id: row.id, slug: row.slug, title: row.title, sitePath: `/${SECTIONS[t.section].path}/${row.slug}`, check: t.check }
        } catch (e) {
          log(`실패: ${t.url} — ${e instanceof Error ? e.message : String(e)}`)
          return { url: t.url, section: t.section, error: e instanceof Error ? e.message : String(e) }
        }
      })
    )
  }

  // MCP get_source용 원문 (백필 없이 바로)
  const keepSource = async (kind: string, text: string) => {
    const { error } = await getSupabaseWithAuth(token)!
      .from('scrap_sources')
      .upsert({ url: main, kind, text, fetched_at: new Date().toISOString() })
    if (error) console.error('[quick-save] scrap_sources upsert failed', error.message)
  }

  log(`시작 ${main} · 자막 ${yt?.transcript.length ?? 0}자 · 페이지 본문 ${page?.text.length ?? 0}자`)
  if (!videoId && page?.text.trim()) {
    const results = await withProvidedPage(main, page, run)
    if (results.some((r) => r.id)) await keepSource('page', page.text)
    return results
  }

  if (!videoId || !yt?.transcript.trim()) return run()

  const results = await withProvidedYoutubeBundle(
    {
      meta: {
        videoId,
        title: yt.title,
        channel: yt.channel,
        description: yt.description,
        publishedAt: null,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        durationLabel: null,
      },
      transcript: yt.transcript,
      transcriptLang: yt.lang ?? null,
    },
    run
  )
  await keepSource('transcript', yt.transcript)
  return results
}
