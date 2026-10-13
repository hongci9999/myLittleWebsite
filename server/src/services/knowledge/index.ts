/**
 * 사이트 지식 도구 — 저장한 스크랩·포트폴리오·개발 노트를 AI가 읽는 읽기 전용 함수 모음.
 * MCP(`routes/mcp.ts`)가 등록하고, 나중에 사이트 대화창(Gemini function calling)도 같은 배열을 쓴다.
 * DB 컬럼은 직접 보지 않는다 — `db/queries/*` DTO를 공통 형태(Scrap)로 바꿔서만 쓴다.
 */
import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import { supabase } from '../../db/supabase.js'
import { listAiToolScraps } from '../../db/queries/ai-scraps.js'
import { listColumnScraps } from '../../db/queries/column-scraps.js'
import { listGameDevResources } from '../../db/queries/game-dev-resources.js'
import { getDimensionsWithValues, getLinks, type ValueTree } from '../../db/queries/links.js'
import { projectRoot } from '../../config/learning-sections.js'
import { fetchSourceText } from './source.js'

const SITE_URL = process.env.SITE_URL ?? 'https://my-little-website-client-self.vercel.app'

type Link = { label: string; url: string }

interface Scrap {
  /** `<section>/<slug>` (links는 `links/<uuid>`) */
  id: string
  section: SectionKey
  title: string
  url: string
  siteUrl: string
  summary: string | null
  tags: string[]
  bodyMd: string | null
  extraLinks: Link[]
}

/** 섹션이 돌려주는 공통 행 — id·section은 loadScraps가 붙인다 */
type SectionRow = Omit<Scrap, 'id' | 'section'> & { key: string }

type ScrapDto = { slug: string; title: string; url: string; summary: string | null; bodyMd: string | null; extraLinks: Link[]; tags: string[] }

/** 스크랩형 테이블(slug 상세 페이지 있음) → SectionRow */
function scrapRows<T extends ScrapDto>(rows: T[], sitePath: string, kindTags: (r: T) => string[]): SectionRow[] {
  return rows.map((r) => ({
    key: r.slug,
    title: r.title,
    url: r.url,
    siteUrl: `${SITE_URL}/${sitePath}/${r.slug}`,
    summary: r.summary,
    tags: [...kindTags(r), ...r.tags],
    bodyMd: r.bodyMd,
    extraLinks: r.extraLinks,
  }))
}

/** 유용한 링크 — 상세 페이지·본문 없음. 분류값 라벨을 태그로 */
async function linkRows(): Promise<SectionRow[]> {
  const [links, dims] = await Promise.all([getLinks(), getDimensionsWithValues()])
  const labels = new Map<string, string>()
  const walk = (vs: ValueTree[]) => vs.forEach((v) => (labels.set(v.id, v.label), walk(v.children ?? [])))
  dims.forEach((d) => walk(d.values))
  return links.map((l) => ({
    key: l.id,
    title: l.title,
    url: l.url,
    siteUrl: `${SITE_URL}/links`,
    summary: l.description,
    tags: [...(l.isFeatured ? ['featured'] : []), ...l.valueIds.flatMap((id) => labels.get(id) ?? [])],
    bodyMd: null,
    extraLinks: [],
  }))
}

/** 새 섹션(테이블) 추가 = 여기 한 줄 */
const SECTIONS = {
  'ai-tools': async () => scrapRows(await listAiToolScraps(), 'ai-dev-tools', (r) => [r.sourceKind]),
  columns: async () => scrapRows(await listColumnScraps(), 'column', (r) => [r.sourceKind]),
  'game-dev': async () => scrapRows(await listGameDevResources(), 'game-dev', (r) => [r.category, r.mediaKind]),
  links: linkRows,
}

type SectionKey = keyof typeof SECTIONS
const SECTION_KEYS = Object.keys(SECTIONS) as [SectionKey, ...SectionKey[]]

// ponytail: 매 호출 전체 조회 후 메모리 필터 — 170여 건 기준. 1000건 넘으면 pgvector 검색으로
async function loadScraps(section?: SectionKey): Promise<Scrap[]> {
  const keys = section ? [section] : SECTION_KEYS
  const lists = await Promise.all(
    keys.map(async (key) =>
      (await SECTIONS[key]()).map(({ key: k, ...r }): Scrap => ({ id: `${key}/${k}`, section: key, ...r }))
    )
  )
  return lists.flat()
}

const DOCS_ROOT = path.join(projectRoot, 'docs')
const NOTE_DIRS = ['decisions', 'learnings']
const SOURCE_CHUNK = 40_000

function readNote(relPath: string): string {
  const full = path.resolve(DOCS_ROOT, relPath)
  const allowed = NOTE_DIRS.some((d) => full.startsWith(path.join(DOCS_ROOT, d) + path.sep))
  if (!allowed || !full.endsWith('.md')) throw new Error(`허용되지 않은 경로: ${relPath}`)
  return fs.readFileSync(full, 'utf8')
}

function listNotes(): string[] {
  return NOTE_DIRS.flatMap((d) =>
    fs.existsSync(path.join(DOCS_ROOT, d))
      ? fs.readdirSync(path.join(DOCS_ROOT, d)).filter((f) => f.endsWith('.md')).map((f) => `${d}/${f}`)
      : []
  )
}

async function getSource(url: string, offset: number) {
  // 저장된 스크랩의 링크만 허용 — 공개 엔드포인트가 임의 URL 프록시가 되지 않게
  const scraps = await loadScraps()
  const known = scraps.some((s) => s.url === url || s.extraLinks.some((l) => l.url === url))
  if (!known) throw new Error('저장된 스크랩의 url 또는 extraLinks url만 조회할 수 있습니다.')

  const { data } = (await supabase.client?.from('scrap_sources').select('kind, text').eq('url', url).maybeSingle()) ?? {}
  const src = data ?? (await fetchSourceText(url, { allowAiDigest: true }))
  if (!src) throw new Error('원문을 가져오지 못했습니다. url을 직접 열어 확인하세요.')

  const end = offset + SOURCE_CHUNK
  return {
    url,
    kind: src.kind,
    totalChars: src.text.length,
    offset,
    nextOffset: end < src.text.length ? end : null,
    text: src.text.slice(offset, end),
  }
}

export interface KnowledgeTool {
  name: string
  description: string
  inputSchema: z.ZodRawShape
  handler: (args: any) => Promise<unknown>
}

export const knowledgeTools: KnowledgeTool[] = [
  {
    name: 'list_scraps',
    description:
      '사이트 주인이 저장해 둔 자료 목록(AI 개발 도구, 칼럼, 게임 개발 자료, 유용한 링크=즐겨 쓰는 사이트·서비스)을 id·제목·요약·태그로 반환한다. id는 "섹션/키". ' +
      '도구 추천, 프로젝트 아이디어, 학습 자료 질문에 답할 때 먼저 이걸로 관련 항목을 고른 뒤 get_scraps로 본문을 읽어라.',
    inputSchema: {
      section: z.enum(SECTION_KEYS).optional().describe('ai-tools | columns | game-dev | links, 생략 시 전체'),
      tag: z.string().optional().describe('이 태그가 붙은 항목만 (대소문자 무시)'),
    },
    handler: async ({ section, tag }: { section?: SectionKey; tag?: string }) => {
      const t = tag?.toLowerCase()
      return (await loadScraps(section))
        .filter((s) => !t || s.tags.some((x) => x.toLowerCase() === t))
        // 목록은 고르기용으로 최소화 — url·siteUrl은 get_scraps에서
        .map(({ id, title, summary, tags }) => ({ id, title, summary, tags }))
    },
  },
  {
    name: 'get_scraps',
    description:
      'list_scraps로 고른 항목의 정리 본문(bodyMd), 원본 url, 추가 링크(extraLinks: 소개 영상·레포 등)를 반환한다. ' +
      '답변에는 siteUrl(사이트 상세 페이지)을 출처로 달아라. ' +
      '요약만으로 부족하면 get_source로 원문(웹페이지·README·유튜브 자막)을 읽어라.',
    inputSchema: { ids: z.array(z.string()).min(1).max(10).describe('list_scraps의 id') },
    handler: async ({ ids }: { ids: string[] }) => {
      const want = new Set(ids)
      return (await loadScraps()).filter((s) => want.has(s.id))
    },
  },
  {
    name: 'get_source',
    description:
      '스크랩 원문을 반환한다. 유튜브는 자막 스크립트, GitHub 레포는 README, 그 외는 페이지 본문. ' +
      'url은 스크랩의 url 또는 extraLinks의 url. 길면 nextOffset으로 이어 읽는다. ' +
      'kind가 ai-digest면 자막이 아니라 AI가 영상을 보고 만든 요약이다.',
    inputSchema: {
      url: z.string().url(),
      offset: z.number().int().min(0).optional(),
    },
    handler: ({ url, offset }: { url: string; offset?: number }) => getSource(url, offset ?? 0),
  },
  {
    name: 'get_portfolio',
    description:
      '사이트 주인의 자기소개(about.md 원문)와 프로젝트 목록(설명·기술·역할·링크)을 반환한다. ' +
      '자기소개서·이력서·포트폴리오 작성이나 "이 사람이 뭘 해왔나" 질문에 쓴다. ' +
      '기술 선택 이유·배운 점 같은 근거는 read_dev_notes로 보강하라.',
    inputSchema: {},
    handler: async () => ({
      about: fs.readFileSync(path.join(projectRoot, 'client', 'public', 'about.md'), 'utf8'),
      projects: JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'client', 'src', 'shared', 'config', 'projects.json'), 'utf8')
      ),
    }),
  },
  {
    name: 'read_dev_notes',
    description:
      '이 웹사이트를 만들며 남긴 개발 기록. decisions/는 기술 결정 기록(ADR: 배경·선택지·결정 이유), learnings/는 학습 노트. ' +
      'path 없이 호출하면 파일 목록, path를 주면 원문을 반환한다.',
    inputSchema: { path: z.string().optional().describe('예: decisions/0001-tech-stack.md') },
    handler: async ({ path: p }: { path?: string }) => (p ? { path: p, content: readNote(p) } : listNotes()),
  },
]
