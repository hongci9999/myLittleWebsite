# Supabase 개요 및 이용 방법

날짜: 2026-03-23

태그: [백엔드, 데이터베이스, 도구]

Supabase가 무엇인지, 프로젝트에서 어떻게 설정하고 사용하는지 정리한다.

---

## 요약

Supabase는 **PostgreSQL을 호스팅해 주는 BaaS(Backend as a Service)**다. 대시보드에서 테이블을 만들고, `@supabase/supabase-js`로 Node.js에서 조회·수정할 수 있다. 이 프로젝트에서는 **서버에서만** Supabase를 사용하며, 클라이언트는 서버 API를 통해서만 데이터에 접근한다.

---

## 핵심 개념

| 구성요소 | 설명 |
|----------|------|
| **PostgreSQL** | 관계형 DB. 테이블·행·열, SQL 쿼리, 외래키 등 지원 |
| **대시보드** | 웹에서 프로젝트 관리, 테이블 생성, SQL 실행, 데이터 조회 |
| **Project URL** | `https://xxx.supabase.co` — API 엔드포인트 |
| **anon key** | 익명 클라이언트용 API 키. 서버에서 사용 (클라이언트 노출 시 RLS로 보호) |
| **@supabase/supabase-js** | Node.js·브라우저에서 Supabase에 접근하는 클라이언트 라이브러리 |

---

## 이용 방법

### 1. 프로젝트 생성

1. [supabase.com](https://supabase.com) 가입/로그인
2. **New Project** 클릭
3. Organization 선택(없으면 생성), 프로젝트 이름·비밀번호 입력
4. Region 선택 후 생성 (몇 분 소요)

### 2. API 키 확인

1. 대시보드 왼쪽 **Project Settings** (톱니바퀴) → **API**
2. **Project URL** 복사
3. **anon public** 키 복사 (클라이언트용, RLS 적용됨)

### 3. 환경 변수 설정

`server/.env` 파일 생성 (`.gitignore`에 포함되어 있어야 함):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- `SUPABASE_URL`: Project URL
- `SUPABASE_ANON_KEY`: anon public 키

### 4. 패키지 설치

```bash
cd server && npm install @supabase/supabase-js
```

### 5. 클라이언트 초기화

`server/src/db/supabase.ts`:

```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY

let _client: SupabaseClient | null = null

function getSupabase(): SupabaseClient | null {
  if (_client) return _client
  if (!url || !key) {
    console.warn('[db] SUPABASE_URL 또는 SUPABASE_ANON_KEY가 설정되지 않았습니다.')
    return null
  }
  _client = createClient(url, key)
  return _client
}

export const supabase = {
  get client() {
    return getSupabase()
  },
}
```

**주의**: `process.env`는 `dotenv.config()` 이후에만 채워진다. `index.ts` 첫 줄에 `import './env.js'`를 두어 env를 먼저 로드해야 한다.

### 6. 테이블 생성 (SQL Editor)

Supabase 대시보드 → **SQL Editor** → 새 쿼리:

```sql
CREATE TABLE IF NOT EXISTS learning_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  base_path TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

실행 후 **Table Editor**에서 테이블·데이터 확인 가능.

### 7. 쿼리 작성 (Node.js)

```typescript
import { supabase } from '../supabase.js'

// 조회
const { data, error } = await supabase.client
  .from('learning_sections')
  .select('*')
  .order('sort_order', { ascending: true })

if (error) throw error
```

| 메서드 | 용도 |
|--------|------|
| `.from('테이블명')` | 테이블 지정 |
| `.select('*')` 또는 `.select('col1, col2')` | 조회할 컬럼 |
| `.eq('col', value)` | WHERE col = value |
| `.is('col', null)` | WHERE col IS NULL |
| `.order('col', { ascending: true })` | 정렬 |
| `.single()` | 단일 행 반환 (없으면 에러) |

### 8. 데이터 삽입 (SQL 또는 JS)

**SQL Editor**에서:

```sql
INSERT INTO learning_sections (section_id, label, base_path, sort_order)
VALUES ('info-engineer', '정보처리기사', '/learnings/정처기', 0);
```

**Node.js**에서:

```typescript
const { data, error } = await supabase.client
  .from('learning_sections')
  .insert({ section_id: 'info-engineer', label: '정보처리기사', base_path: '/learnings/정처기', sort_order: 0 })
  .select()
  .single()
```

---

## 이 프로젝트에서의 사용

| 역할 | 설명 |
|------|------|
| **학습 폴더 구조** | `learning_sections`, `learning_nodes`, `learning_docs` 테이블에 섹션·노드·문서 메타데이터 저장 |
| **API** | `GET /api/learning/sections`, `/sections/:sectionId` → Supabase 조회 후 JSON 반환 |
| **폴백** | env 미설정 또는 API 실패 시 → `learning-info-engineer.ts` config 사용 |

md 본문은 Supabase에 저장하지 않고 `client/public/learnings/정처기/` 정적 파일로 서빙한다.

---

## 주의사항

### env 로드 순서

ES 모듈에서 `import`는 상단에서 한 번에 평가된다. `supabase.ts`가 `dotenv`보다 먼저 로드되면 `process.env`가 비어 있어 `supabaseUrl is required` 오류가 난다.

**해결**: `server/src/env.ts`에서 `dotenv.config()`를 실행하고, `index.ts` **첫 줄**에 `import './env.js'`를 둔다.

### Supabase 미설정 시

`.env`에 `SUPABASE_URL`, `SUPABASE_ANON_KEY`가 없으면:
- `supabase.client`는 `null` 반환
- API는 503 + "Database not configured" 반환
- 클라이언트는 config로 폴백

### 보안

- `.env`는 절대 커밋하지 않는다.
- anon key는 서버에서만 사용. 브라우저에 노출하면 RLS(Row Level Security)로 접근을 제한해야 한다.
- 이 프로젝트는 **서버에서만** Supabase를 사용하므로 클라이언트는 API를 통해서만 데이터에 접근한다.

---

## 참고

- [Supabase 공식 문서](https://supabase.com/docs)
- [@supabase/supabase-js](https://github.com/supabase/supabase-js)
- 이 프로젝트: `server/src/db/supabase.ts`, `server/src/db/queries/learning.ts`
- 계획: `docs/plans/2026-03-01-learning-folder-database-plan.md`
- 관련 학습: `docs/learnings/0015-backend-database-basics.md`
