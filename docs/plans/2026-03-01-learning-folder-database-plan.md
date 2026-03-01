# 학습 폴더 데이터베이스 구현 계획

날짜: 2026-03-01

단계별 실행 순서. 각 단계 완료 후 다음 단계로 진행한다.

---

## 사전 학습 (필수)

- [ ] `docs/learnings/0015-backend-database-basics.md` 읽기
- [ ] `docs/plans/2026-03-01-learning-folder-database-design.md` 읽기

---

## Phase 1: Supabase 프로젝트 및 테이블 생성

### Step 1.1: Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 가입/로그인
2. 새 프로젝트 생성 (이름: myLittleWebsite 등)
3. 프로젝트 설정 → API → **Project URL**, **anon key** 복사
4. `server/.env` 생성:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   ```
5. `.env`는 `.gitignore`에 포함되어 있는지 확인 (절대 커밋 금지)

### Step 1.2: 테이블 생성 (SQL)

Supabase 대시보드 → SQL Editor에서 아래 SQL 실행 (또는 `docs/plans/2026-03-01-learning-folder-tables.sql` 참조):

```sql
-- 1. 섹션 테이블
CREATE TABLE IF NOT EXISTS learning_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  base_path TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 노드 테이블 (주제/폴더)
CREATE TABLE IF NOT EXISTS learning_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES learning_sections(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES learning_nodes(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(section_id, parent_id, node_id)
);

-- 3. 문서 테이블
CREATE TABLE IF NOT EXISTS learning_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES learning_nodes(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(node_id, slug)
);

-- 4. 인덱스 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_learning_nodes_section ON learning_nodes(section_id);
CREATE INDEX IF NOT EXISTS idx_learning_nodes_parent ON learning_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_learning_docs_node ON learning_docs(node_id);
```

### Step 1.3: 시드 데이터 삽입

`docs/plans/2026-03-01-learning-folder-seed.sql` 파일을 Supabase SQL Editor에서 실행.

---

## Phase 2: 서버 연동

### Step 2.1: Supabase 클라이언트 설치

```bash
cd server && npm install @supabase/supabase-js
```

### Step 2.2: db 모듈 생성

- `server/src/db/supabase.ts`: Supabase 클라이언트 초기화
- `server/src/db/queries/learning.ts`: 섹션·노드·문서 조회 쿼리

### Step 2.3: API 라우트 추가

- `server/src/routes/learning.ts`: GET /api/learning/sections, /sections/:id 등
- `server/src/index.ts`: 라우트 등록

### Step 2.4: API 테스트

```bash
curl http://localhost:3000/api/learning/sections
```

---

## Phase 3: 클라이언트 연동

### Step 3.1: API 호출 훅/함수

- `client/src/shared/api/learning.ts`: fetch 래퍼

### Step 3.2: FileStructureBrowserPage 수정

- config 대신 API에서 데이터 로드
- 로딩·에러 상태 처리
- (선택) API 실패 시 config fallback

---

## Phase 4: 완료 및 정리

- [x] CHANGELOG, journal 반영
- [x] learnings 0015 보강 (실제 구현 경험 추가)

---

## 체크리스트

| Phase | 단계 | 완료 |
|-------|------|------|
| 1 | Supabase 프로젝트 생성 | (사용자 수동) |
| 1 | 테이블 생성 (SQL) | (사용자 수동) |
| 1 | 시드 데이터 삽입 | (사용자 수동) |
| 2 | @supabase/supabase-js 설치 | ✓ |
| 2 | db/supabase.ts, queries/learning.ts | ✓ |
| 2 | API 라우트 | ✓ |
| 2 | API 테스트 | ✓ |
| 3 | 클라이언트 API 호출 | ✓ |
| 3 | 페이지 연동 | ✓ |
| 4 | 문서화 | ✓ |
