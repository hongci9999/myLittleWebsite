# 유용한 링크 페이지 + 사이트 전체 관리자 인증 설계

날짜: 2026-03-03

유용한 도구 사이트를 분류·검색할 수 있는 링크 페이지와, 사이트 전체에서 사용하는 관리자 로그인 기능 설계.

---

## 1. 목표

- **링크 페이지**: 모아둔 도구 사이트를 목적·종류 등으로 분류하고, 검색·필터로 찾아 쓸 수 있게 함
- **관리자 인증**: 링크 CRUD뿐 아니라 향후 포트폴리오·칼럼 등 관리 기능에서 공통 사용
- **자동 로그인**: Remember Me + 장기 세션(7~30일)으로 내 PC에서 한 번 로그인 후 유지

---

## 2. 아키텍처

- **인증**: Supabase Auth (이메일/비밀번호). 클라이언트에서 로그인, JWT를 서버 API에 전달
- **데이터**: Supabase(PostgreSQL). 서버에서만 접근, 클라이언트는 API 경유
- **분류**: 축(dimension) + 계층형 값. 목적(디자인→이미지생성, 개발→프론트엔드), 종류(웹서비스, API, 데스크탑앱) 등 확장 가능

---

## 3. 데이터 구조

### 3.1 classification_dimensions (분류 축)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 자동 생성 |
| slug | text (unique) | 예: purpose, medium |
| label | text | 표시명: 목적, 종류 |
| allow_hierarchy | boolean | 계층 허용 여부 |
| sort_order | int | 정렬 순서 |

### 3.2 classification_values (분류 값)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 자동 생성 |
| dimension_id | uuid (FK) | classification_dimensions.id |
| parent_id | uuid (FK, nullable) | 부모 값 (계층용) |
| slug | text | 예: image-gen, frontend |
| label | text | 표시명: 이미지 생성, 프론트엔드 |
| sort_order | int | 정렬 순서 |

### 3.3 links (링크)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 자동 생성 |
| url | text | 링크 URL |
| title | text | 사이트명 |
| description | text (nullable) | 간단 설명 |
| sort_order | int | 정렬 순서 |
| created_at | timestamptz | 생성 시각 |

### 3.4 link_value_relations (링크 ↔ 분류 값)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| link_id | uuid (FK) | links.id |
| value_id | uuid (FK) | classification_values.id |

복합 unique (link_id, value_id). 한 링크에 여러 값 선택 가능.

---

## 4. 초기 시드 데이터

**목적 (purpose, 계층)**

- 디자인 → 이미지 생성, 3D 모델 생성, 비디오 생성
- 개발 → 프론트엔드, 백엔드, LLM
- (추가 축/값은 관리자 UI에서)

**종류 (medium, 평면)**

- 웹 서비스, API, 데스크탑 앱, CLI, 브라우저 확장

---

## 5. API 설계

### 공개 (인증 불필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/links | 링크 목록 (query: category, tag, q 검색) |
| GET | /api/links/dimensions | 분류 축 + 값 트리 전체 |
| GET | /api/links/tags | 태그 목록 (선택: 자유 태그 추가 시) |

### 관리 (인증 필요, Authorization: Bearer \<jwt\>)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/links | 링크 추가 |
| PATCH | /api/links/:id | 링크 수정 |
| DELETE | /api/links/:id | 링크 삭제 |
| POST | /api/links/dimensions | 분류 축 추가 |
| PATCH | /api/links/dimensions/:id | 분류 축 수정 |
| POST | /api/links/dimensions/:id/values | 분류 값 추가 |
| PATCH | /api/links/values/:id | 분류 값 수정 |

### 인증

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/auth/login | 이메일/비밀번호 → Supabase Auth → JWT 반환 |
| POST | /api/auth/logout | 로그아웃 |
| GET | /api/auth/me | 현재 세션 검증 (JWT 유효성) |

---

## 6. 페이지 구조

| 경로 | 용도 | 인증 |
|------|------|------|
| /links | 링크 목록, 검색, 카테고리/태그 필터 | 불필요 |
| /links/admin | 링크·분류 CRUD | 필요 |
| (향후) /portfolio/admin 등 | 다른 관리 기능 | 동일 인증 |

---

## 7. 인증 흐름

1. 클라이언트: Supabase Auth `signInWithPassword()` 호출 (Supabase URL/anon key는 Auth용으로 클라이언트에 필요)
2. 클라이언트: `session.access_token` 저장 (localStorage 또는 메모리)
3. 클라이언트: 관리 API 호출 시 `Authorization: Bearer <token>` 헤더
4. 서버: `supabase.auth.getUser(jwt)`로 검증, 유효하면 CRUD 수행
5. Remember Me: Supabase 세션 만료를 30일로 설정, 또는 refresh token 활용

---

## 8. UI 개요

**/links (공개)**

- 검색창: 상단 중앙 고정 (`sticky top-16`), pill 스타일
- 좌측 사이드바(lg+): 태그 선택, 정렬, 링크 관리, 필터 초기화
- 모바일: 상단 한 줄에 필터·정렬·링크관리 배치
- 카드 그리드: 제목, URL, 설명, 분류 값 배지, 외부 링크 아이콘, 호버 lift

**/links/admin (관리)**

- 미인증: `/login?redirect=/links/admin` 리다이렉트
- 인증 후: 상단에 추가/수정 폼 항상 노출, 하단 카드 그리드(수정·삭제)
- 로그아웃: AdminPage(`/admin`)에 배치

**공통**

- nav.ts에 `{ path: '/links', label: '유용한 링크', description: '모아둔 도구 사이트' }` 추가

---

## 9. 참고

- Supabase: `docs/learnings/0017-supabase.md`
- 스택: `client`는 API만, `server`에서 Supabase 사용
- 디자인: `docs/decisions/0009-design-rules.md`
