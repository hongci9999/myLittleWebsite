# 게임 개발 도서관(Game Dev Library) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: 이 계획은 superpowers:executing-plans 로 task 단위로 구현한다.

**Goal:** 게임 개발 정보를 유튜브/기사/저장소/블로그글 등 다양한 **형식**으로 모으되, 그래픽스·물리·AI 등 **분야별로 명확히 구분되는**(좌측 분야 네비) 전용 정보 도서관 페이지(목록·상세·관리자 CRUD)를 추가한다. 메인 네비게이션과 우측 사이드바 바로가기에도 노출한다.

**Architecture:** 기존 "AI 개발 도구 스크랩북"(`ai_tool_scraps`)과 동일한 풀스택 패턴을 **별도 도메인으로 복제**한다. Supabase 테이블 1개 + Express 라우트/쿼리 + React 목록/상세 페이지 + 관리자 다이얼로그(Context). 두 축으로 분류한다: 콘텐츠 **형식**은 `mediaKind`(youtube·article·repo·blog·doc·book·other), 콘텐츠 **분야**는 **1급 필드** `category`(그래픽스·렌더링/물리/AI/게임플레이·설계/엔진·툴/네트워크/사운드/최적화/기타)로 두고 **좌측 분야 네비 사이드바**로 명확히 구분한다(도서관식 카테고리 트리). 세부 키워드는 보조 자유 태그. 기존 ai-scraps 코드는 건드리지 않는다(저위험).

**Tech Stack:** React 19 + TypeScript + Vite, react-router-dom, Tailwind v4, shadcn 기반 UI(`Button`/`Dialog`), Express + TypeScript(ESM, `.js` import 확장자), Supabase(PostgreSQL, RLS).

---

## 결정 사항 (기본값 — 변경 가능)

| 항목 | 값 | 메모 |
| --- | --- | --- |
| 기능명 | 게임 개발 도서관 | UI 라벨 |
| 라우트 | `/game-dev`, 상세 `/game-dev/:slug` | |
| DB 테이블 | `game_dev_resources` | |
| API 베이스 | `/api/game-dev-resources` | |
| 형식(mediaKind) | `youtube`,`article`,`repo`,`blog`,`doc`,`book`,`other` | DB CHECK 제약과 일치시킬 것 |
| **분야(category)** | **1급 필드** — `graphics`,`physics`,`ai`,`gameplay`,`engine`,`network`,`sound`,`optimization`,`etc` | DB 컬럼 + CHECK |
| 분야 UI | **좌측 분야 네비 사이드바** + 본문=선택 분야 목록 | 도서관식 카테고리 트리 |
| 세부 태그 | 자유 태그 (예: ECS, Unity, Vulkan) | 보조 검색용 |
| AI 채우기(Ollama) | **MVP 제외** | Phase 2(선택) 참고 |
| 기존 ai-scraps | 수정 안 함 | 병렬 클론 |

## 분야(category) 사양 — 단일 출처

분야 slug ↔ 한글 라벨. DB CHECK·TS 유니온·옵션 배열·좌측 네비 모두 이 목록과 일치시킨다.

| slug | 라벨 |
| --- | --- |
| `graphics` | 그래픽스·렌더링 |
| `physics` | 물리 |
| `ai` | AI |
| `gameplay` | 게임플레이·설계 |
| `engine` | 엔진·툴 |
| `network` | 네트워크 |
| `sound` | 사운드 |
| `optimization` | 최적화 |
| `etc` | 기타 |

- `category`는 **필수**(NOT NULL, 기본 입력값 `graphics`). 형식(`mediaKind`)과 **독립 축**이다.
- **분야 UI = 좌측 분야 네비 사이드바**: 목록 페이지(`/game-dev`) 좌측에 분야 목록 + "전체". 클릭 시 `?category=<slug>`로 필터, 활성 분야 강조. 모바일에서는 가로 스크롤 칩 또는 `<select>`로 대체.
- URL 쿼리: 형식 필터 `?kind=`, 분야 필터 `?category=`, 검색 `?q=` 공존.

## 테스트 전략 (중요 — 이 저장소 특이사항)

이 저장소에는 단위 테스트 러너가 **없다**(vitest/jest 없음). 따라서 각 Task의 "검증"은 다음으로 대체한다:

- **서버**: `cd server && npm run build` (tsc 통과) + `npm run dev` 띄운 뒤 `curl`로 엔드포인트 확인
- **클라이언트**: `cd client && npm run build` (tsc -b + vite build 통과), `npm run lint`, `npm run dev`로 브라우저 수동 확인
- 새 테스트 파일은 만들지 않는다(저장소 관례 유지).

## 참고 원본 파일 (복제 대상 — 읽고 패턴 따를 것)

- 서버 쿼리: `server/src/db/queries/ai-scraps.ts`
- 서버 라우트: `server/src/routes/ai-scraps.ts` + 등록 `server/src/index.ts:7,71`
- 마이그레이션: `docs/plans/2026-03-23-ai-tool-scraps-migration.sql`
- API 클라: `client/src/shared/api/ai-scraps.ts`
- 목록: `client/src/pages/AiDevToolsPage.tsx`
- 상세: `client/src/pages/AiDevToolScrapDetailPage.tsx`
- 다이얼로그: `client/src/widgets/AiToolScrapAdminDialog/AiToolScrapAdminDialog.tsx`
- Context/마운트: `client/src/shared/context/ScrapAdminDialogContext.tsx`, `client/src/components/Layout.tsx`
- 라우팅: `client/src/App.tsx`
- 네비/바로가기: `client/src/shared/config/nav.ts`, `client/src/shared/config/shortcuts.ts`

---

## Task 1: DB 마이그레이션 SQL 작성

**Files:**
- Create: `docs/plans/2026-06-22-game-dev-resources-migration.sql`

**Step 1: 마이그레이션 파일 작성**

```sql
-- 게임 개발 도서관 (유튜브·기사·저장소·블로그 등 URL + 메모)
-- Supabase SQL Editor에서 실행 후 RLS 적용 확인

CREATE TABLE IF NOT EXISTS game_dev_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  media_kind TEXT NOT NULL CHECK (
    media_kind IN ('youtube', 'article', 'repo', 'blog', 'doc', 'book', 'other')
  ),
  category TEXT NOT NULL DEFAULT 'graphics' CHECK (
    category IN ('graphics', 'physics', 'ai', 'gameplay', 'engine', 'network', 'sound', 'optimization', 'etc')
  ),
  summary TEXT,
  body_md TEXT,
  extra_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS game_dev_resources_media_kind_idx ON game_dev_resources (media_kind);
CREATE INDEX IF NOT EXISTS game_dev_resources_category_idx ON game_dev_resources (category);
CREATE INDEX IF NOT EXISTS game_dev_resources_tags_gin ON game_dev_resources USING GIN (tags);
CREATE INDEX IF NOT EXISTS game_dev_resources_updated_idx ON game_dev_resources (updated_at DESC);

ALTER TABLE game_dev_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_dev_resources_select_public"
  ON game_dev_resources FOR SELECT USING (true);
CREATE POLICY "game_dev_resources_insert_auth"
  ON game_dev_resources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "game_dev_resources_update_auth"
  ON game_dev_resources FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "game_dev_resources_delete_auth"
  ON game_dev_resources FOR DELETE TO authenticated USING (true);
```

**Step 2: Supabase에서 실행**

Supabase 대시보드 → SQL Editor에 위 내용 붙여넣고 실행. Table Editor에서 `game_dev_resources` 생성 + RLS 활성 확인.

**Step 3: 커밋**

```bash
git add docs/plans/2026-06-22-game-dev-resources-migration.sql
git commit -F .git-commit-msg.txt   # chore: 게임 개발 도서관 마이그레이션 SQL 추가
```

---

## Task 2: 서버 DB 쿼리 모듈

**Files:**
- Create: `server/src/db/queries/game-dev-resources.ts`

원본 `server/src/db/queries/ai-scraps.ts` 를 복제하고 아래만 바꾼다:
- 타입 `SourceKind` → `MediaKind`, `AiToolScrap` → `GameDevResource`, 필드 `sourceKind` → `mediaKind`
- **분야 추가**: `Category` 유니온 + `CATEGORIES` 배열 + `isCategory()` 가드, 인터페이스 `category: Category`, `mapRow`에 `category`, list 필터에 `category`, create insert `category`, update payload `category`
- `KINDS` 배열 = `['youtube','article','repo','blog','doc','book','other']`, `isSourceKind` → `isMediaKind`
- 테이블명 `ai_tool_scraps` → `game_dev_resources` (모든 `.from(...)`, `slugExists`)
- row 매핑 `source_kind` → `media_kind`
- export 함수명: `listGameDevResources`, `getGameDevResourceBySlug`, `createGameDevResource`, `updateGameDevResource`, `deleteGameDevResource`
- `slugifyTitle`, `generateUniqueSlug`, `mapRow` 구조는 동일 유지

**Step 1: 파일 작성**

```ts
import { supabase, getSupabaseWithAuth } from '../supabase.js'

export type MediaKind =
  | 'youtube'
  | 'article'
  | 'repo'
  | 'blog'
  | 'doc'
  | 'book'
  | 'other'

export type Category =
  | 'graphics'
  | 'physics'
  | 'ai'
  | 'gameplay'
  | 'engine'
  | 'network'
  | 'sound'
  | 'optimization'
  | 'etc'

export interface GameDevResource {
  id: string
  slug: string
  title: string
  url: string
  mediaKind: MediaKind
  category: Category
  summary: string | null
  bodyMd: string | null
  extraLinks: { label: string; url: string }[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

const KINDS: MediaKind[] = ['youtube', 'article', 'repo', 'blog', 'doc', 'book', 'other']

export function isMediaKind(s: string): s is MediaKind {
  return KINDS.includes(s as MediaKind)
}

const CATEGORIES: Category[] = [
  'graphics', 'physics', 'ai', 'gameplay', 'engine', 'network', 'sound', 'optimization', 'etc',
]

export function isCategory(s: string): s is Category {
  return CATEGORIES.includes(s as Category)
}

function mapRow(row: Record<string, unknown>): GameDevResource {
  const extra = row.extra_links
  let extraLinks: { label: string; url: string }[] = []
  if (Array.isArray(extra)) {
    extraLinks = extra
      .filter(
        (x): x is { label?: string; url: string } =>
          x != null && typeof x === 'object' && typeof (x as { url?: string }).url === 'string'
      )
      .map((x) => ({
        label: typeof x.label === 'string' && x.label.trim() ? x.label.trim() : '링크',
        url: String(x.url).trim(),
      }))
  }
  const tags = Array.isArray(row.tags)
    ? (row.tags as unknown[]).filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    : []

  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    url: row.url as string,
    mediaKind: row.media_kind as MediaKind,
    category: (isCategory(String(row.category)) ? row.category : 'etc') as Category,
    summary: row.summary != null ? String(row.summary) : null,
    bodyMd: row.body_md != null ? String(row.body_md) : null,
    extraLinks,
    tags,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function slugifyTitle(title: string): string {
  let s = title
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72)
  if (!s) s = `item-${Date.now().toString(36)}`
  return s
}

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')
  let q = client.from('game_dev_resources').select('id').eq('slug', slug).limit(1)
  if (excludeId) q = q.neq('id', excludeId)
  const { data, error } = await q
  if (error) throw error
  return (data?.length ?? 0) > 0
}

export async function generateUniqueSlug(base: string): Promise<string> {
  let slug = slugifyTitle(base)
  let n = 0
  while (await slugExists(slug)) {
    n += 1
    slug = `${slugifyTitle(base)}-${n}`
  }
  return slug
}

export async function listGameDevResources(filters?: {
  q?: string
  kind?: string
  category?: string
}): Promise<GameDevResource[]> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')

  const { data, error } = await client
    .from('game_dev_resources')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  let rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>))

  if (filters?.kind && isMediaKind(filters.kind)) {
    rows = rows.filter((r) => r.mediaKind === filters.kind)
  }
  if (filters?.category && isCategory(filters.category)) {
    rows = rows.filter((r) => r.category === filters.category)
  }
  if (filters?.q?.trim()) {
    const q = filters.q.trim().toLowerCase()
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.url.toLowerCase().includes(q) ||
        (r.summary?.toLowerCase().includes(q) ?? false) ||
        (r.bodyMd?.toLowerCase().includes(q) ?? false) ||
        r.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        r.slug.toLowerCase().includes(q)
    )
  }
  return rows
}

export async function getGameDevResourceBySlug(slug: string): Promise<GameDevResource | null> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')
  const { data, error } = await client
    .from('game_dev_resources')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapRow(data as Record<string, unknown>)
}

export async function createGameDevResource(
  token: string,
  input: {
    title: string
    url: string
    mediaKind: MediaKind
    category: Category
    summary?: string | null
    bodyMd?: string | null
    extraLinks?: { label: string; url: string }[]
    tags?: string[]
    slug?: string | null
  }
): Promise<GameDevResource> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  let slug: string
  if (input.slug?.trim()) {
    slug = input.slug.trim()
    if (await slugExists(slug)) throw new Error('Slug already exists')
  } else {
    slug = await generateUniqueSlug(input.title)
  }

  const { data, error } = await client
    .from('game_dev_resources')
    .insert({
      slug,
      title: input.title.trim(),
      url: input.url.trim(),
      media_kind: input.mediaKind,
      category: input.category,
      summary: input.summary?.trim() || null,
      body_md: input.bodyMd?.trim() || null,
      extra_links: input.extraLinks ?? [],
      tags: input.tags?.length ? input.tags.map((t) => t.trim()).filter(Boolean) : [],
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Insert failed')
  return mapRow(data as Record<string, unknown>)
}

export async function updateGameDevResource(
  token: string,
  id: string,
  input: {
    title?: string
    url?: string
    mediaKind?: MediaKind
    category?: Category
    summary?: string | null
    bodyMd?: string | null
    extraLinks?: { label: string; url: string }[]
    tags?: string[]
    slug?: string | null
  }
): Promise<GameDevResource> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.title != null) payload.title = input.title.trim()
  if (input.url != null) payload.url = input.url.trim()
  if (input.mediaKind != null) payload.media_kind = input.mediaKind
  if (input.category != null) payload.category = input.category
  if (input.summary !== undefined) payload.summary = input.summary?.trim() || null
  if (input.bodyMd !== undefined) payload.body_md = input.bodyMd?.trim() || null
  if (input.extraLinks != null) payload.extra_links = input.extraLinks
  if (input.tags != null) payload.tags = input.tags.map((t) => t.trim()).filter(Boolean)
  if (input.slug !== undefined) {
    const nextSlug = input.slug?.trim()
    if (nextSlug) {
      const { data: current, error: curErr } = await client
        .from('game_dev_resources')
        .select('slug')
        .eq('id', id)
        .single()
      if (curErr) throw curErr
      const prev = (current as { slug: string }).slug
      if (prev !== nextSlug) {
        const taken = await slugExists(nextSlug, id)
        if (taken) throw new Error('Slug already exists')
        payload.slug = nextSlug
      }
    }
  }

  const { data, error } = await client
    .from('game_dev_resources')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Update failed')
  return mapRow(data as Record<string, unknown>)
}

export async function deleteGameDevResource(token: string, id: string): Promise<void> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')
  const { error } = await client.from('game_dev_resources').delete().eq('id', id)
  if (error) throw error
}
```

**Step 2: 타입체크**

Run: `cd server && npm run build`
Expected: 에러 없이 통과(이 파일은 아직 라우트에서 안 쓰여도 단독 컴파일됨).

---

## Task 3: 서버 라우트 + 등록

**Files:**
- Create: `server/src/routes/game-dev-resources.ts`
- Modify: `server/src/index.ts` (import + `app.use` 등록)

원본 `server/src/routes/ai-scraps.ts` 복제 후: ai-fill 라우트(94~133줄) **삭제**(MVP 제외), `sourceKind`→`mediaKind`, `isSourceKind`→`isMediaKind`, 쿼리 함수명 교체, 로그 prefix `[game-dev]`.

**Step 1: 라우트 파일 작성**

```ts
import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import {
  listGameDevResources,
  getGameDevResourceBySlug,
  createGameDevResource,
  updateGameDevResource,
  deleteGameDevResource,
  isMediaKind,
  isCategory,
  type MediaKind,
  type Category,
} from '../db/queries/game-dev-resources.js'

const router = Router()

function normalizeExtraLinks(raw: unknown): { label: string; url: string }[] {
  if (!Array.isArray(raw)) return []
  const out: { label: string; url: string }[] = []
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue
    const o = x as { label?: unknown; url?: unknown }
    if (typeof o.url !== 'string' || !o.url.trim()) continue
    const label = typeof o.label === 'string' && o.label.trim() ? o.label.trim() : '링크'
    out.push({ label, url: o.url.trim() })
  }
  return out
}

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((t): t is string => typeof t === 'string').map((t) => t.trim()).filter(Boolean)
  }
  if (typeof raw === 'string') {
    return raw.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
  }
  return []
}

/** GET /api/game-dev-resources?q=&kind= */
router.get('/', async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : undefined
    const kind = req.query.kind ? String(req.query.kind) : undefined
    const category = req.query.category ? String(req.query.category) : undefined
    const items = await listGameDevResources({
      q,
      kind: kind && isMediaKind(kind) ? kind : undefined,
      category: category && isCategory(category) ? category : undefined,
    })
    res.json(items)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list resources'
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Database not configured' })
      return
    }
    console.error('[game-dev] list error:', err)
    res.status(500).json({ error: 'Failed to list resources' })
  }
})

/** GET /api/game-dev-resources/by-slug/:slug */
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const slug = decodeURIComponent(req.params.slug)
    const item = await getGameDevResourceBySlug(slug)
    if (!item) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json(item)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch resource'
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Database not configured' })
      return
    }
    console.error('[game-dev] getBySlug error:', err)
    res.status(500).json({ error: 'Failed to fetch resource' })
  }
})

/** POST /api/game-dev-resources */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const body = req.body as {
      title?: string; url?: string; mediaKind?: string; category?: string
      summary?: string | null; bodyMd?: string | null
      extraLinks?: unknown; tags?: unknown; slug?: string | null
    }
    const title = body.title?.trim()
    const url = body.url?.trim()
    const mk = body.mediaKind?.trim()
    if (!title || !url || !mk || !isMediaKind(mk)) {
      res.status(400).json({ error: 'title, url, and valid mediaKind are required' })
      return
    }
    const cat = body.category?.trim()
    const category: Category = cat && isCategory(cat) ? cat : 'graphics'
    const item = await createGameDevResource(authToken, {
      title,
      url,
      mediaKind: mk as MediaKind,
      category,
      summary: body.summary,
      bodyMd: body.bodyMd,
      extraLinks: normalizeExtraLinks(body.extraLinks),
      tags: normalizeTags(body.tags),
      slug: body.slug?.trim() || null,
    })
    res.status(201).json(item)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create resource'
    if (msg === 'Slug already exists') { res.status(409).json({ error: msg }); return }
    if (msg === 'Supabase not configured') { res.status(503).json({ error: 'Auth not configured' }); return }
    console.error('[game-dev] create error:', err)
    res.status(500).json({ error: 'Failed to create resource' })
  }
})

/** PATCH /api/game-dev-resources/:id */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const { id } = req.params
    const body = req.body as {
      title?: string; url?: string; mediaKind?: string; category?: string
      summary?: string | null; bodyMd?: string | null
      extraLinks?: unknown; tags?: unknown; slug?: string | null
    }
    const patch: Parameters<typeof updateGameDevResource>[2] = {}
    if (body.title != null) patch.title = body.title
    if (body.url != null) patch.url = body.url
    if (body.mediaKind != null) {
      if (!isMediaKind(body.mediaKind)) { res.status(400).json({ error: 'Invalid mediaKind' }); return }
      patch.mediaKind = body.mediaKind
    }
    if (body.category != null) {
      if (!isCategory(body.category)) { res.status(400).json({ error: 'Invalid category' }); return }
      patch.category = body.category
    }
    if (body.summary !== undefined) patch.summary = body.summary
    if (body.bodyMd !== undefined) patch.bodyMd = body.bodyMd
    if (body.extraLinks !== undefined) patch.extraLinks = normalizeExtraLinks(body.extraLinks)
    if (body.tags !== undefined) patch.tags = normalizeTags(body.tags)
    if (body.slug !== undefined) patch.slug = body.slug

    const item = await updateGameDevResource(authToken, id, patch)
    res.json(item)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update resource'
    if (msg === 'Slug already exists') { res.status(409).json({ error: msg }); return }
    if (msg === 'Supabase not configured') { res.status(503).json({ error: 'Auth not configured' }); return }
    console.error('[game-dev] update error:', err)
    res.status(500).json({ error: 'Failed to update resource' })
  }
})

/** DELETE /api/game-dev-resources/:id */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const { id } = req.params
    await deleteGameDevResource(authToken, id)
    res.status(204).send()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete resource'
    if (msg === 'Supabase not configured') { res.status(503).json({ error: 'Auth not configured' }); return }
    console.error('[game-dev] delete error:', err)
    res.status(500).json({ error: 'Failed to delete resource' })
  }
})

export default router
```

**Step 2: `server/src/index.ts` 에 등록**

import 블록(7번 줄 `aiScrapsRoutes` 아래)에 추가:

```ts
import gameDevResourcesRoutes from './routes/game-dev-resources.js'
```

`app.use('/api/ai-scraps', aiScrapsRoutes)` 아래에 추가:

```ts
app.use('/api/game-dev-resources', gameDevResourcesRoutes)
```

**Step 3: 서버 빌드 + 런타임 확인**

Run: `cd server && npm run build`
Expected: tsc 통과.

Run: `cd server && npm run dev` (별도 터미널) 후
`curl http://127.0.0.1:3001/api/game-dev-resources`
Expected: `[]` (빈 배열) 또는 503(Supabase 미설정 시). 500 아니면 OK.

**Step 4: 커밋**

```bash
git add server/src/db/queries/game-dev-resources.ts server/src/routes/game-dev-resources.ts server/src/index.ts
git commit -F .git-commit-msg.txt   # feat: 게임 개발 도서관 서버 API 추가
```

---

## Task 4: 클라이언트 API 클라이언트

**Files:**
- Create: `client/src/shared/api/game-dev.ts`

원본 `client/src/shared/api/ai-scraps.ts` 복제 후: ai-fill 관련(`suggestAiToolScrapAiFill`, `AiToolScrapAiFill`, ai-provider import) **삭제**, 타입/필드/함수명 교체, `SOURCE_KIND_OPTIONS`→`MEDIA_KIND_OPTIONS`, **분야 추가**: `Category` 타입 + `CATEGORY_OPTIONS` + `categoryLabel()`, 인터페이스 `category`, fetch 파라미터 `category`, create/update 바디 `category`.

**Step 1: 파일 작성**

```ts
import { apiUrl } from '@/shared/api/base'

export type MediaKind = 'youtube' | 'article' | 'repo' | 'blog' | 'doc' | 'book' | 'other'

export type Category =
  | 'graphics' | 'physics' | 'ai' | 'gameplay' | 'engine'
  | 'network' | 'sound' | 'optimization' | 'etc'

export interface GameDevResource {
  id: string
  slug: string
  title: string
  url: string
  mediaKind: MediaKind
  category: Category
  summary: string | null
  bodyMd: string | null
  extraLinks: { label: string; url: string }[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

const API_BASE = apiUrl('/api/game-dev-resources')

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function fetchGameDevResources(params?: {
  q?: string
  kind?: MediaKind | ''
  category?: Category | ''
}): Promise<GameDevResource[]> {
  const sp = new URLSearchParams()
  if (params?.q?.trim()) sp.set('q', params.q.trim())
  if (params?.kind) sp.set('kind', params.kind)
  if (params?.category) sp.set('category', params.category)
  const qs = sp.toString()
  const res = await fetch(`${API_BASE}${qs ? `?${qs}` : ''}`)
  if (res.status === 503) throw new Error('SERVICE_UNAVAILABLE')
  if (!res.ok) throw new Error('Failed to load resources')
  return res.json() as Promise<GameDevResource[]>
}

export async function fetchGameDevResourceBySlug(slug: string): Promise<GameDevResource | null> {
  const res = await fetch(`${API_BASE}/by-slug/${encodeURIComponent(slug)}`)
  if (res.status === 404) return null
  if (res.status === 503) throw new Error('SERVICE_UNAVAILABLE')
  if (!res.ok) throw new Error('Failed to load resource')
  return res.json() as Promise<GameDevResource>
}

export async function createGameDevResource(
  token: string,
  body: {
    title: string; url: string; mediaKind: MediaKind; category: Category
    summary?: string | null; bodyMd?: string | null
    extraLinks?: { label: string; url: string }[]; tags?: string[]; slug?: string | null
  }
): Promise<GameDevResource> {
  const res = await fetch(API_BASE, { method: 'POST', headers: authHeaders(token), body: JSON.stringify(body) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Create failed')
  }
  return res.json() as Promise<GameDevResource>
}

export async function updateGameDevResource(
  token: string,
  id: string,
  body: Partial<{
    title: string; url: string; mediaKind: MediaKind; category: Category
    summary: string | null; bodyMd: string | null
    extraLinks: { label: string; url: string }[]; tags: string[]; slug: string | null
  }>
): Promise<GameDevResource> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Update failed')
  }
  return res.json() as Promise<GameDevResource>
}

export async function deleteGameDevResource(token: string, id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders(token) })
  return res.ok
}

export const MEDIA_KIND_OPTIONS: { value: MediaKind; label: string }[] = [
  { value: 'youtube', label: '유튜브' },
  { value: 'article', label: '기사' },
  { value: 'repo', label: 'Git 저장소' },
  { value: 'blog', label: '블로그글' },
  { value: 'doc', label: '문서 / 공식' },
  { value: 'book', label: '책 / 강의' },
  { value: 'other', label: '기타' },
]

export function mediaKindLabel(kind: MediaKind): string {
  return MEDIA_KIND_OPTIONS.find((o) => o.value === kind)?.label ?? kind
}

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'graphics', label: '그래픽스·렌더링' },
  { value: 'physics', label: '물리' },
  { value: 'ai', label: 'AI' },
  { value: 'gameplay', label: '게임플레이·설계' },
  { value: 'engine', label: '엔진·툴' },
  { value: 'network', label: '네트워크' },
  { value: 'sound', label: '사운드' },
  { value: 'optimization', label: '최적화' },
  { value: 'etc', label: '기타' },
]

export function categoryLabel(c: Category): string {
  return CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c
}
```

---

## Task 5: 관리자 다이얼로그 위젯

**Files:**
- Create: `client/src/widgets/GameDevAdminDialog/GameDevAdminDialog.tsx`
- Create: `client/src/widgets/GameDevAdminDialog/index.ts`

원본 `AiToolScrapAdminDialog.tsx` 복제 후: **AI 채우기 버튼/`handleAiFill`/`aiFillLoading` 제거**, import를 `@/shared/api/game-dev`로(`MEDIA_KIND_OPTIONS`, `CATEGORY_OPTIONS`, 타입 `MediaKind`/`Category` 포함), `sourceKind`→`mediaKind`(기본값 `'youtube'`), `SOURCE_KIND_OPTIONS`→`MEDIA_KIND_OPTIONS`, 이벤트명 `game-dev-changed`, 함수명 `notifyGameDevChanged`/`subscribeGameDevChanged`, 링크 경로 `/game-dev/...`, form id `game-dev-admin-form`, 로그인 redirect `/game-dev`, 다이얼로그 제목 "게임 개발 자료 추가·편집".

**분야 필드 추가** (필수, 형식과 별도 축):
- `emptyForm()`에 `category: 'graphics' as Category` 추가
- editing 로드 시 `category: editing.category`
- create/update 호출 바디에 `category: form.category`
- 종류(`mediaKind`) select 옆/아래에 분야 select 한 칸 추가:

```tsx
<label className="block">
  <span className="text-xs font-medium text-muted-foreground">분야 *</span>
  <select
    value={form.category}
    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
  >
    {CATEGORY_OPTIONS.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
</label>
```

**Step 1: `GameDevAdminDialog.tsx` 작성** (원본 구조 그대로, 위 치환 + 분야 select 적용. ai-fill `<label>`의 우측 "AI 채우기" `<Button>`은 삭제하고 URL 입력만 남긴다. 종류·슬러그가 들어있던 2열 그리드에 분야 select를 함께 배치.)

**Step 2: `index.ts` 작성**

```ts
export {
  GameDevAdminDialog,
  notifyGameDevChanged,
  subscribeGameDevChanged,
} from './GameDevAdminDialog'
```

---

## Task 6: 관리자 다이얼로그 Context + Layout 마운트

**Files:**
- Create: `client/src/shared/context/GameDevAdminDialogContext.tsx`
- Modify: `client/src/components/Layout.tsx`

**Step 1: Context 작성** (원본 `ScrapAdminDialogContext.tsx` 복제, `AiToolScrapAdminDialog`→`GameDevAdminDialog`, 훅명 `useGameDevAdmin`/Provider `GameDevAdminDialogProvider`, 메서드 `openGameDevAdmin`)

```tsx
import {
  createContext, useCallback, useContext, useMemo, useState, type ReactNode,
} from 'react'
import { GameDevAdminDialog } from '@/widgets/GameDevAdminDialog'

type OpenOpts = { slug?: string }
type Value = { openGameDevAdmin: (opts?: OpenOpts) => void }

const Ctx = createContext<Value | null>(null)

export function GameDevAdminDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [initialSlug, setInitialSlug] = useState<string | null>(null)

  const openGameDevAdmin = useCallback((opts?: OpenOpts) => {
    setInitialSlug(opts?.slug ?? null)
    setOpen(true)
  }, [])
  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) setInitialSlug(null)
  }, [])
  const value = useMemo(() => ({ openGameDevAdmin }), [openGameDevAdmin])

  return (
    <Ctx.Provider value={value}>
      {children}
      <GameDevAdminDialog open={open} onOpenChange={handleOpenChange} initialSlug={initialSlug} />
    </Ctx.Provider>
  )
}

export function useGameDevAdmin(): Value {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useGameDevAdmin must be used within GameDevAdminDialogProvider')
  return ctx
}
```

**Step 2: `Layout.tsx`에 Provider 중첩**

`ScrapAdminDialogProvider` 안쪽에 `GameDevAdminDialogProvider`를 감싼다:

```tsx
import { GameDevAdminDialogProvider } from '@/shared/context/GameDevAdminDialogContext'
// ...
return (
  <ScrapAdminDialogProvider>
  <GameDevAdminDialogProvider>
    {/* 기존 <div className="min-h-svh ..."> ... </div> 그대로 */}
  </GameDevAdminDialogProvider>
  </ScrapAdminDialogProvider>
)
```

---

## Task 7: 분야 네비 컴포넌트 + 목록 페이지

이 Task가 "분야별 명확 구분 UI"의 핵심이다. 좌측 **분야 네비 사이드바**(전체 + 9개 분야)를 만들고, 목록 페이지를 2열 레이아웃(좌 네비 / 우 목록)으로 구성한다. 분야 선택은 `?category=<slug>` URL 쿼리로 반영하고, 형식(`kind`) 필터·검색(`q`)과 공존한다.

**Files:**
- Create: `client/src/widgets/GameDevCategoryNav/GameDevCategoryNav.tsx`
- Create: `client/src/widgets/GameDevCategoryNav/index.ts`
- Create: `client/src/pages/GameDevLibraryPage.tsx`

**Step 1: 분야 네비 컴포넌트 작성** (재사용 가능하게 분리 — design 룰)

`GameDevCategoryNav.tsx`:

```tsx
import { CATEGORY_OPTIONS, type Category } from '@/shared/api/game-dev'
import { cn } from '@/lib/utils'

type Props = {
  active: Category | ''
  onSelect: (next: Category | '') => void
}

export function GameDevCategoryNav({ active, onSelect }: Props) {
  const items: { value: Category | ''; label: string }[] = [
    { value: '', label: '전체' },
    ...CATEGORY_OPTIONS,
  ]
  return (
    <nav aria-label="분야" className="flex flex-col gap-1">
      <h2 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        분야
      </h2>
      {items.map((it) => {
        const isActive = active === it.value
        return (
          <button
            key={it.value || 'all'}
            type="button"
            onClick={() => onSelect(it.value)}
            aria-current={isActive ? 'true' : undefined}
            className={cn(
              'rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors',
              isActive
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-transparent text-foreground hover:bg-muted/60'
            )}
          >
            {it.label}
          </button>
        )
      })}
    </nav>
  )
}
```

`index.ts`:

```ts
export { GameDevCategoryNav } from './GameDevCategoryNav'
```

**Step 2: 목록 페이지 작성**

원본 `AiDevToolsPage.tsx` 복제 후 다음 치환을 적용:
- import: `@/shared/api/game-dev`(`fetchGameDevResources`, `deleteGameDevResource`, `mediaKindLabel`, `categoryLabel`, `MEDIA_KIND_OPTIONS`, 타입 `MediaKind`/`Category`), `@/shared/context/GameDevAdminDialogContext`(`useGameDevAdmin`), `@/widgets/GameDevAdminDialog`(`notify`/`subscribe`), `@/widgets/GameDevCategoryNav`
- `useScrapAdminDialog`→`useGameDevAdmin`, `openScrapAdmin`→`openGameDevAdmin`
- `s.sourceKind`→`s.mediaKind`, `sourceKindLabel`→`mediaKindLabel`, `SOURCE_KIND_OPTIONS`→`MEDIA_KIND_OPTIONS`
- 경로 `/ai-dev-tools`→`/game-dev`, 스크롤 복원 키 `'game-dev'`, dbOff 안내 테이블명/마이그레이션 파일명 갱신

추가 로직 (분야):
- URL에서 `category` 읽기: `const category = (searchParams.get('category') ?? '') as Category | ''`
- `load`의 `fetchGameDevResources({ q, kind, category })`에 `category` 추가, deps에 `category`
- `setCategory` 핸들러: `setSearchParams((prev) => patchSearchParams(prev, { category: value || null }), { replace: true })`

레이아웃 (2열): 기존 단일 컬럼을 좌측 네비 + 우측 콘텐츠로 감싼다. 모바일은 네비를 가로 스크롤(또는 `<select>`)로:

```tsx
return (
  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-8 md:py-10">
    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
      {/* 좌측 분야 네비 (데스크탑) */}
      <aside className="hidden w-48 shrink-0 md:block">
        <div className="sticky top-20">
          <GameDevCategoryNav active={category} onSelect={setCategory} />
        </div>
      </aside>

      {/* 모바일 분야 선택 */}
      <div className="md:hidden">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category | '')}
          aria-label="분야"
          className={cn(filterControl, 'w-full')}
        >
          <option value="">전체 분야</option>
          {/* CATEGORY_OPTIONS.map(...) */}
        </select>
      </div>

      {/* 우측: 기존 검색/종류 필터 카드 + 목록 (원본 본문 그대로 이동) */}
      <div className="min-w-0 flex-1">
        {/* ...검색·종류 필터 바... */}
        {/* ...목록 ul... (각 카드에 분야 배지: categoryLabel(s.category)) */}
      </div>
    </div>
  </div>
)
```

- 목록 카드의 상단 메타(형식 라벨 옆)에 **분야 배지** 추가: `categoryLabel(s.category)` (형식 라벨과 시각적으로 구분되게, 예: 분야는 채워진 배지, 형식은 uppercase 텍스트).
- 빈 상태 문구는 선택 분야를 반영(예: "이 분야에 자료가 없습니다").

**Step 3: 빌드 확인은 Task 9에서 라우팅까지 묶어 일괄 수행**

---

## Task 8: 상세 페이지

**Files:**
- Create: `client/src/pages/GameDevResourceDetailPage.tsx`

원본 `AiDevToolScrapDetailPage.tsx` 복제 후: import 교체(`categoryLabel` 포함), `fetchAiScrapBySlug`→`fetchGameDevResourceBySlug`, `sourceKindLabel`→`mediaKindLabel`, `s.sourceKind`→`s.mediaKind`, `useScrapAdminDialog`→`useGameDevAdmin` + `openGameDevAdmin`, 경로 `/ai-dev-tools`→`/game-dev`, dbOff/없는항목 안내 테이블명 `game_dev_resources`, 본문 비었을 때 안내문구 자연스럽게.

**분야 표시**: 형식 라벨(`mediaKindLabel`) 옆/위에 분야 배지를 추가한다. 분야는 목록으로 돌아가 필터하도록 링크로:

```tsx
<Link
  to={`/game-dev?category=${s.category}`}
  className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary no-underline"
>
  {categoryLabel(s.category)}
</Link>
```

> 참고: `ExtraLinkWithEmbed`는 유튜브 임베드를 지원하므로 유튜브 자료의 원문 URL을 `extraLinks`에 넣으면 상세에서 미리보기가 된다(원본과 동일 동작). 원문 URL 임베드가 필요하면 Phase 2에서 본문 상단 임베드를 검토.

**Step 1: 작성** (구조 동일, 위 치환 적용)

---

## Task 9: 라우팅 + 네비 + 바로가기

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/shared/config/nav.ts`
- Modify: `client/src/shared/config/shortcuts.ts`

**Step 1: `App.tsx`에 import + Route 2개 추가**

import:
```tsx
import GameDevLibraryPage from './pages/GameDevLibraryPage'
import GameDevResourceDetailPage from './pages/GameDevResourceDetailPage'
```

`<Route element={<Layout />}>` 내부, ai-dev-tools 라우트들 아래에:
```tsx
<Route path="game-dev" element={<GameDevLibraryPage />} />
<Route path="game-dev/:slug" element={<GameDevResourceDetailPage />} />
```

**Step 2: `nav.ts`에 항목 추가** (배열에 한 줄)
```ts
{ path: '/game-dev', label: '게임 개발 도서관', description: '게임 개발 정보 모음' },
```

**Step 3: `shortcuts.ts`에 항목 추가**
```ts
{ path: '/game-dev', label: '게임 개발 도서관', icon: '◐' },
```

**Step 4: `RightSidebar.tsx`의 `shortcutIsActive`에 활성 경로 처리 추가**

`/game-dev`는 상세 경로(`/game-dev/...`)도 활성 표시해야 하므로:
```ts
if (path === '/game-dev') {
  return pathname === '/game-dev' || pathname.startsWith('/game-dev/')
}
```
(`client/src/widgets/RightSidebar/RightSidebar.tsx`의 ai-dev-tools 분기 아래 추가)

**Step 5: 클라이언트 빌드 + 린트 + 수동 확인**

Run: `cd client && npm run lint && npm run build`
Expected: 린트·tsc·vite 빌드 모두 통과.

Run: `cd client && npm run dev` 후 브라우저에서:
- `/game-dev` 목록 로드(빈 목록 안내 또는 항목)
- 로그인 후 "추가·편집"으로 유튜브/기사 등 자료 추가 → 목록·상세 표시
- 종류 필터 + 검색 동작
- 우측 바로가기·상단 네비에 "게임 개발 도서관" 노출 및 활성 표시

**Step 6: 커밋**

```bash
git add client/src/shared/api/game-dev.ts client/src/widgets/GameDevAdminDialog client/src/widgets/GameDevCategoryNav client/src/shared/context/GameDevAdminDialogContext.tsx client/src/components/Layout.tsx client/src/pages/GameDevLibraryPage.tsx client/src/pages/GameDevResourceDetailPage.tsx client/src/App.tsx client/src/shared/config/nav.ts client/src/shared/config/shortcuts.ts client/src/widgets/RightSidebar/RightSidebar.tsx
git commit -F .git-commit-msg.txt   # feat: 게임 개발 도서관 페이지·관리자 추가
```

---

## Task 10: 문서화 (docs-record 규칙)

**Files:**
- Create: `docs/decisions/0024-game-dev-library.md`
- Modify: `docs/CHANGELOG.md`
- Modify(or Create): `docs/journal/2026-06.md`
- Modify: `docs/README.md` (필요 시 인덱스 갱신)

**Step 1: ADR 작성** `docs/decisions/0024-game-dev-library.md`
- 배경: 게임 개발 정보를 형식 무관하게 모으되 **분야별로 명확히 구분되는** 전용 도서관 필요
- 결정: ai-scraps 풀스택 패턴을 `game_dev_resources` 별도 테이블/기능으로 복제. **두 축 분류** — 형식=`mediaKind`(youtube·article·repo·blog·doc·book·other), 분야=1급 필드 `category`(graphics·physics·ai·gameplay·engine·network·sound·optimization·etc). 분야 UI는 **좌측 분야 네비 사이드바**(도서관식 카테고리 트리)
- 이유:
  - 기존 검증된 패턴 재사용(저위험), 도메인 분리(확장성), 단일 테이블 일반화 리팩터링은 기존 기능 리스크 → 배제 (decision 0014 참고)
  - 분야를 태그가 아닌 1급 컬럼으로: 명확한 좌측 네비 구분·CHECK 제약·인덱스로 일관성 확보. 세부 키워드는 보조 태그로 분리
- 결과: `/game-dev` 추가(분야 네비 + 형식 필터 + 검색), 상단 네비·우측 바로가기 노출

**Step 2: CHANGELOG**에 `## 2026년 6월` 섹션 `### Added`에 한 줄 추가

**Step 3: journal `2026-06.md`** 의 `## 2026-06-22` 항목에 작업 내용 기록

**Step 4: 커밋**

```bash
git add docs/
git commit -F .git-commit-msg.txt   # docs: 게임 개발 도서관 ADR·CHANGELOG·journal 기록
```

---

## Phase 2 (선택, MVP 이후)

- **AI 채우기(Ollama/Gemini)**: 원본 `services/ollama.ts`의 `suggestAiToolScrapFromUrl` + `ai-tool-scrap.prompts.ts` 를 게임 개발용 프롬프트로 복제, `/api/game-dev-resources/ai-fill` 추가, 다이얼로그에 "AI 채우기" 버튼 복원.
- **상세 상단 원문 임베드**: 유튜브 `mediaKind`일 때 본문 위에 임베드 플레이어 표시(`shared/lib/youtube.ts` 활용).
- **분야별 그룹 뷰**: "전체" 선택 시 분야별 섹션 헤더로 묶어 보여주는 옵션(현재는 좌측 네비 필터 방식).
- **분야 안에 하위 분류(계층)**: 분야가 커지면 축+계층 구조 도입(학습 분류 패턴 참고).

---

## Remember
- 정확한 파일 경로 사용, 기존 ai-scraps 파일은 수정 금지
- 서버 import는 `.js` 확장자(ESM) 유지
- DB CHECK 제약의 `media_kind` 값과 TS `MediaKind` 유니온을 항상 일치시킬 것
- 커밋은 git 규칙(한국어 + EN 요약, 한글 깨지면 `git commit -F`) 준수, 기능 단위 분리

## Execution Handoff

계획 저장 완료: `docs/plans/2026-06-22-game-dev-library.md`. 실행 방법 2가지:

1. **Subagent-Driven (이 세션)** — task마다 새 서브에이전트 dispatch, 사이사이 코드 리뷰, 빠른 반복. (REQUIRED SUB-SKILL: superpowers:subagent-driven-development)
2. **Parallel Session (별도 세션)** — worktree에서 새 세션 열고 일괄 실행 + 체크포인트. (REQUIRED SUB-SKILL: superpowers:executing-plans)

어느 쪽?
