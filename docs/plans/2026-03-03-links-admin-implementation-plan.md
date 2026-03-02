# 유용한 링크 페이지 + 사이트 전체 관리자 인증 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 유용한 도구 링크를 분류·검색할 수 있는 페이지와, 사이트 전체에서 사용하는 관리자 로그인(Remember Me) 기능을 구현한다.

**Architecture:** Supabase Auth(클라이언트 로그인) + 서버 API(JWT 검증 후 CRUD). 분류는 축(dimension) + 계층형 값. 클라이언트는 API만 호출, DB는 서버에서만 접근.

**Tech Stack:** React, Express, Supabase (Auth + PostgreSQL), @supabase/supabase-js (client + server)

**참고 설계:** `docs/plans/2026-03-03-links-admin-design.md`

---

## Phase 1: 인증 기반

### Task 1: Supabase Auth 클라이언트 설정

**Files:**
- Create: `client/src/shared/lib/supabase-auth.ts`
- Modify: `client/.env.example` (없으면 생성)

**Step 1: 클라이언트용 Supabase Auth 유틸 생성**

Supabase Auth는 클라이언트에서 로그인·세션 관리. 서버 DB 접근은 하지 않음.

```typescript
// client/src/shared/lib/supabase-auth.ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseAuth = url && anonKey
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null
```

**Step 2: .env.example에 변수 문서화**

```env
# client/.env.example (없으면 생성)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Step 3: client에 @supabase/supabase-js 설치**

```bash
cd client && npm install @supabase/supabase-js
```

**Step 4: Commit**

```bash
git add client/src/shared/lib/supabase-auth.ts client/.env.example client/package.json client/package-lock.json
git commit -m "chore: add Supabase Auth client for admin login"
```

---

### Task 2: AuthProvider 및 useAuth 훅

**Files:**
- Create: `client/src/shared/context/AuthContext.tsx`
- Modify: `client/src/App.tsx`

**Step 1: AuthContext 생성**

```typescript
// client/src/shared/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabaseAuth } from '@/shared/lib/supabase-auth'
import type { Session } from '@supabase/supabase-js'

type AuthContextValue = {
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!supabaseAuth) {
      setIsLoading(false)
      return
    }
    supabaseAuth.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })
    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((_, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabaseAuth) return { error: new Error('Auth not configured') }
    const { error } = await supabaseAuth.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabaseAuth?.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

**Step 2: App.tsx에 AuthProvider 래핑**

ThemeProvider 안쪽, BrowserRouter 바깥쪽에 AuthProvider 추가.

**Step 3: Commit**

```bash
git add client/src/shared/context/AuthContext.tsx client/src/App.tsx
git commit -m "feat: add AuthProvider and useAuth for site-wide admin auth"
```

---

### Task 3: 서버 인증 미들웨어 (JWT 검증)

**Files:**
- Create: `server/src/middleware/auth.ts`
- Modify: `server/src/db/supabase.ts` (getUser용)

**Step 1: auth 미들웨어 생성**

서버는 `Authorization: Bearer <jwt>` 헤더에서 JWT 추출 후 `supabase.auth.getUser(jwt)`로 검증.

```typescript
// server/src/middleware/auth.ts
import type { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY
const supabase = url && key ? createClient(url, key) : null

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!supabase) {
    res.status(503).json({ error: 'Auth not configured' })
    return
  }
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }
  (req as Request & { user: { id: string } }).user = { id: user.id }
  next()
}
```

**Step 2: Commit**

```bash
git add server/src/middleware/auth.ts
git commit -m "feat: add requireAuth middleware for JWT validation"
```

---

### Task 4: 인증 API 라우트 (login, logout, me)

**Files:**
- Create: `server/src/routes/auth.ts`
- Modify: `server/src/index.ts`

**Step 1: auth 라우트 생성**

- POST /api/auth/login: body { email, password } → Supabase signIn → { access_token } 반환 (클라이언트가 직접 signIn하므로 이건 선택. 설계상 클라이언트가 Supabase Auth 직접 호출하므로 서버 login은 불필요할 수 있음.)

설계 재검토: 클라이언트에서 `supabase.auth.signInWithPassword()` 직접 호출. 서버 auth API는 `GET /api/auth/me`만 필요 (세션 검증용). login/logout은 클라이언트 Supabase Auth가 처리.

- GET /api/auth/me: Authorization Bearer 검증, 유효하면 { user } 반환

**Step 2: index.ts에 라우트 등록**

```typescript
import authRoutes from './routes/auth.js'
app.use('/api/auth', authRoutes)
```

**Step 3: Commit**

```bash
git add server/src/routes/auth.ts server/src/index.ts
git commit -m "feat: add GET /api/auth/me for session validation"
```

---

## Phase 2: DB 테이블 및 시드

### Task 5: Supabase 테이블 생성 SQL

**Files:**
- Create: `docs/plans/2026-03-03-links-schema.sql` (이미 작성됨)

**Step 1: Supabase 대시보드에서 SQL 실행**

`docs/plans/2026-03-03-links-schema.sql` 내용을 Supabase SQL Editor에 붙여넣고 실행. 테이블 4개 + 시드(목적·종류) 생성.

**Step 2: Commit**

```bash
git add docs/plans/2026-03-03-links-schema.sql
git commit -m "docs: add links schema and seed SQL"
```

---

### Task 6: links DB 쿼리 및 API

**Files:**
- Create: `server/src/db/queries/links.ts`
- Create: `server/src/routes/links.ts`
- Modify: `server/src/index.ts`

**Step 1: links 쿼리 함수**

- getDimensionsWithValues(): 축 + 값 트리
- getLinks(filters?: { dimensionValueIds?, q? }): 링크 목록
- createLink, updateLink, deleteLink (requireAuth 사용)

**Step 2: links 라우트**

- GET /api/links - 공개
- GET /api/links/dimensions - 공개
- POST /api/links - requireAuth
- PATCH /api/links/:id - requireAuth
- DELETE /api/links/:id - requireAuth

**Step 3: Commit**

```bash
git add server/src/db/queries/links.ts server/src/routes/links.ts server/src/index.ts
git commit -m "feat: add links API (public read, admin write)"
```

---

## Phase 3: 클라이언트 UI

### Task 7: 링크 API 클라이언트

**Files:**
- Create: `client/src/shared/api/links.ts`

**Step 1: fetchLinks, fetchDimensions, createLink, updateLink, deleteLink 함수**

Authorization 헤더는 useAuth에서 session?.access_token 사용.

**Step 2: Commit**

```bash
git add client/src/shared/api/links.ts
git commit -m "feat: add links API client"
```

---

### Task 8: LinksPage (공개 목록)

**Files:**
- Create: `client/src/pages/LinksPage.tsx`
- Modify: `client/src/App.tsx`, `client/src/shared/config/nav.ts`

**Step 1: LinksPage 구현**

- 검색창, 분류 필터(목적·종류), 카드 그리드
- BentoCard 또는 기존 카드 스타일

**Step 2: 라우트 및 nav 추가**

path: /links

**Step 3: Commit**

```bash
git add client/src/pages/LinksPage.tsx client/src/App.tsx client/src/shared/config/nav.ts
git commit -m "feat: add LinksPage with search and filter"
```

---

### Task 9: LinksAdminPage 및 로그인 폼

**Files:**
- Create: `client/src/pages/LinksAdminPage.tsx`
- Create: `client/src/pages/AdminLoginPage.tsx` (또는 LinksAdminPage 내 로그인 UI)

**Step 1: AdminLoginPage 또는 인라인 로그인**

미인증 시 로그인 폼, 인증 후 링크 CRUD 폼

**Step 2: LinksAdminPage**

- useAuth로 session 확인
- 없으면 로그인 폼
- 있으면 링크 추가/수정/삭제, 분류 축·값 관리

**Step 3: 라우트 추가**

path: /links/admin

**Step 4: Commit**

```bash
git add client/src/pages/LinksAdminPage.tsx client/src/App.tsx
git commit -m "feat: add LinksAdminPage with login and CRUD"
```

---

### Task 10: Supabase Auth 사용자 생성 및 RLS (선택)

**Files:**
- Supabase 대시보드에서 Auth 사용자 생성
- RLS 정책 (links 테이블: anon read, authenticated write - 또는 service_role로 서버만 쓰기)

**Note:** 서버가 service_role 또는 anon으로 쓰기 시 RLS는 서버에 적용되지 않을 수 있음. anon key로 서버에서 쓰면 RLS 적용. 설계상 서버가 JWT 검증 후 쓰기하므로, RLS는 "authenticated만 쓰기"로 두면 클라이언트 직접 접근 시 보호. 서버는 anon key + JWT로 요청 시 Supabase가 user context로 처리할 수 있음.

실제로 서버에서 `supabase.from('links').insert()` 할 때 user context를 넘기려면 `createClient(url, key, { global: { headers: { Authorization: `Bearer ${userJwt}` } } })` 형태가 필요. 또는 service_role로 쓰고 서버에서만 검증. 단순화: 서버가 anon key로 쓰고, RLS는 "anon read, service_role write"로 두고, 쓰기는 서버 API(requireAuth 통과 후)에서만. 서버가 anon key를 쓰므로 RLS가 적용됨. "anon can read links" + "authenticated can insert/update/delete links"로 하면, 서버에서 user JWT를 넘겨야 함.

가장 단순: 서버가 anon key 사용, RLS "select는 anon 허용", "insert/update/delete는 authenticated 허용". 서버에서 Supabase client를 "user의 JWT"로 생성해서 요청하면 RLS 통과. 즉, requireAuth에서 추출한 token으로 `createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } })` 해서 links 쿼리 시 사용.

이건 구현 시 Task 6에서 처리. 계획에는 "서버에서 user JWT를 Supabase 요청에 포함" 명시.

---

## 실행 옵션

계획 저장 완료. 두 가지 실행 방식:

**1. Subagent-Driven (이 세션)** - 태스크마다 새 서브에이전트 배치, 태스크 간 코드 리뷰

**2. Parallel Session (별도)** - 새 세션에서 executing-plans로 워크트리에서 배치 실행

어떤 방식으로 진행할까요?
