# 백엔드·데이터베이스 기초 (초보자용)

날짜: 2026-03-01

백엔드와 데이터베이스가 무엇인지, 어떻게 연결되는지 정리한다. 이 프로젝트에서 학습 폴더 구조를 DB에 저장하는 과정을 이해하기 위한 사전 학습이다.

---

## 1. 전체 그림: 클라이언트와 서버

```
[브라우저]  ←→  [서버]  ←→  [데이터베이스]
  (client)        (server)       (DB)
```

- **클라이언트(프론트엔드)**: 사용자가 보는 화면. React로 만든 우리 사이트.
- **서버(백엔드)**: 클라이언트가 요청하면 응답을 돌려주는 프로그램. Node.js + Express.
- **데이터베이스**: 데이터를 영구 저장하는 저장소. PostgreSQL(Supabase).

**흐름 예시**: "학습 폴더 목록 보여줘" → 클라이언트가 서버에 요청 → 서버가 DB에서 조회 → 결과를 클라이언트에 반환.

---

## 2. 백엔드(서버)란?

백엔드는 **클라이언트가 요청(Request)을 보내면, 그에 맞는 응답(Response)을 돌려주는 프로그램**이다.

| 역할 | 설명 |
|------|------|
| API 제공 | 클라이언트가 호출할 수 있는 엔드포인트(URL) 제공 |
| 비즈니스 로직 | 데이터 검증, 계산, 규칙 처리 |
| DB 접근 | 데이터 조회·저장·수정·삭제 |

우리 프로젝트의 서버는 `server/src/index.ts`에 있다. 지금은 `/health` 하나만 있지만, 나중에 `/api/learning/sections` 같은 API를 추가할 것이다.

---

## 3. 데이터베이스란?

데이터베이스는 **구조화된 데이터를 영구 저장**하는 곳이다. 파일(JSON, md)과 달리:

- **테이블(Table)** 형태로 저장 (행·열)
- **쿼리(Query)**로 조회·수정 가능
- 여러 클라이언트가 동시에 접근 가능
- 권한·백업·트랜잭션 등 관리 기능 제공

### 테이블 예시

| id | name | description |
|----|------|--------------|
| 1 | 소프트웨어 설계 | SDLC, UML, 요구공학 등 |
| 2 | 소프트웨어 개발 | 자료구조, 알고리즘, 테스트 등 |
| 3 | 데이터베이스 구축 | ERD, SQL, 정규화 등 |

한 행(row) = 레코드, 한 열(column) = 필드(컬럼).

---

## 4. API란?

API(Application Programming Interface)는 **클라이언트가 서버에 요청할 때 사용하는 규칙**이다.

| HTTP 메서드 | 용도 | 예시 |
|-------------|------|------|
| GET | 조회 | `GET /api/learning/sections` → 목록 반환 |
| POST | 생성 | `POST /api/learning/sections` → 새 섹션 추가 |
| PUT/PATCH | 수정 | `PATCH /api/learning/sections/1` → 수정 |
| DELETE | 삭제 | `DELETE /api/learning/sections/1` → 삭제 |

클라이언트는 `fetch('/api/learning/sections')`로 요청하고, 서버는 JSON 형태로 응답한다.

---

## 5. Supabase란?

Supabase는 **PostgreSQL 데이터베이스를 호스팅**해 주는 서비스다.

| 기능 | 설명 |
|------|------|
| PostgreSQL | 관계형 DB. 테이블 간 관계(외래키) 설정 가능 |
| 대시보드 | 웹에서 테이블 생성·데이터 조회 가능 |
| 클라이언트 라이브러리 | `@supabase/supabase-js`로 Node.js에서 DB 접근 |

우리 프로젝트는 **서버에서만** Supabase를 사용한다. 클라이언트는 서버 API를 통해서만 데이터에 접근한다. (보안·일관성)

---

## 6. 데이터 흐름 (우리 프로젝트)

```
1. 사용자가 "학습자료" 페이지 접속
2. 클라이언트: fetch('/api/learning/sections')
3. 서버: Supabase 클라이언트로 DB 조회
4. 서버: JSON 응답 반환
5. 클라이언트: 받은 데이터로 UI 렌더링
```

---

## 7. 다음 단계

- **설계 문서**: `docs/plans/2026-03-01-learning-folder-database-design.md` — 테이블 구조, API 설계
- **구현 계획**: `docs/plans/2026-03-01-learning-folder-database-plan.md` — 단계별 실행 순서
- **테이블 SQL**: `docs/plans/2026-03-01-learning-folder-tables.sql`
- **시드 SQL**: `docs/plans/2026-03-01-learning-folder-seed.sql`

---

## 8. 실제 구현 경험 (2026-03)

### env 로드 순서

ES 모듈에서 `import`는 파일 상단에서 한 번에 평가된다. `supabase.ts`가 `dotenv`보다 먼저 로드되면 `process.env`가 비어 있어 `supabaseUrl is required` 오류가 난다.

**해결**: `server/src/env.ts`를 만들어 `dotenv.config()`를 **가장 먼저** 실행하고, `index.ts` 첫 줄에 `import './env.js'`를 두어 다른 모듈보다 선행 로드한다.

### Supabase 미설정 시

`.env`에 `SUPABASE_URL`, `SUPABASE_ANON_KEY`가 없으면 Supabase 클라이언트를 null로 두고, API에서 503 + "Database not configured" 메시지를 반환한다. 클라이언트는 API 실패 시 config로 폴백한다.

### API 응답 형식

`getSectionWithNodes()`는 `FileStructureSection` 형식으로 변환해 반환한다. `learning_nodes`의 `parent_id = null`인 행만 최상위 노드로 조회하고, 각 노드별로 `learning_docs`를 조인해 `docs` 배열을 채운다.

### 참고

- error-fixes/0001: env 로드, API 폴백 등 관련 오류
- 서버 코드: `server/src/db/`, `server/src/routes/learning.ts`
- 클라이언트: `client/src/shared/api/learning.ts`, `LearningBrowserPage.tsx`

---

## 참고

- 프로젝트 스택: `stack-structure.mdc`, `decisions/0001-tech-stack.md`
- 서버 코드: `server/src/`
