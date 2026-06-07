# API 명세서

날짜: 2026-05-19 (§9 사이트 도메인 만료 설정 반영)

myLittleWebsite 서버 REST API 명세. 클라이언트는 이 API만 호출하며, DB는 서버에서만 접근한다.

---

## 1. 기본 정보

| 항목 | 값 |
|------|-----|
| Base URL | `http://localhost:3001` (개발) |
| Content-Type | `application/json` |
| 인증 | `Authorization: Bearer <jwt>` (관리 API만) |

---

## 2. 공통 응답 형식

### 성공 응답

- `200` OK: 요청 성공, JSON 본문 반환
- `201` Created: 리소스 생성 성공 (POST)

### 에러 응답

```json
{
  "error": "에러 메시지"
}
```

| 상태 코드 | 의미 |
|----------|------|
| 400 | Bad Request - 잘못된 요청 본문/파라미터 |
| 401 | Unauthorized - 인증 필요 또는 토큰 무효 |
| 404 | Not Found - 리소스 없음 |
| 500 | Internal Server Error - 서버 오류 |
| 503 | Service Unavailable - DB/Auth 미설정 등 |

---

## 3. 인증 API (`/api/auth`)

> **참고:** 로그인/로그아웃은 클라이언트에서 Supabase Auth(`signInWithPassword`, `signOut`)를 직접 호출한다. 서버 auth API는 세션 검증용으로만 사용한다.

### GET /api/auth/me

현재 JWT 유효성 검증. 유효하면 사용자 정보 반환.

**인증:** `Authorization: Bearer <jwt>` 필요

**응답 (200 OK)**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**에러**

- `401` - 토큰 없음 또는 만료/무효
- `503` - Auth 미설정

---

## 4. 링크 API (`/api/links`)

### 4.1 공개 (인증 불필요)

#### GET /api/links

링크 목록 조회. 필터·검색 지원.

**Query Parameters**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `dimensionValueIds` | string[] | 분류 값 ID 배열 (쉼표 구분) |
| `q` | string | 제목/설명 검색어 |

**응답 (200 OK)**

```json
[
  {
    "id": "uuid",
    "url": "https://example.com",
    "title": "사이트명",
    "description": "간단 설명",
    "sortOrder": 0,
    "createdAt": "2026-03-03T00:00:00.000Z",
    "values": [
      { "id": "uuid", "label": "이미지 생성", "dimensionSlug": "purpose" },
      { "id": "uuid", "label": "웹 서비스", "dimensionSlug": "medium" }
    ]
  }
]
```

---

#### GET /api/links/dimensions

분류 축 + 값 트리 전체 조회.

**응답 (200 OK)**

```json
[
  {
    "id": "uuid",
    "slug": "purpose",
    "label": "목적",
    "allowHierarchy": true,
    "sortOrder": 1,
    "values": [
      {
        "id": "uuid",
        "slug": "design",
        "label": "디자인",
        "parentId": null,
        "sortOrder": 1,
        "children": [
          { "id": "uuid", "slug": "image-gen", "label": "이미지 생성", "parentId": "...", "sortOrder": 1, "children": [] }
        ]
      }
    ]
  }
]
```

---

#### POST /api/links/ai-suggest

AI 제목·설명·파비콘 추천. 텍스트 제공자는 `X-AI-Provider: local|api` 헤더와 JSON `aiProvider` 필드로 선택(헤더 우선, 기본 로컬 Ollama).

**인증:** `Authorization: Bearer <jwt>` 필요

유튜브 URL인데 자막을 가져오지 못하면 400(고정 안내 메시지)으로 거부할 수 있다.

**Request Body**

```json
{
  "url": "https://example.com",
  "title": "사이트명 (선택, 있으면 AI가 우선 사용)",
  "aiProvider": "local"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| url | string | O | 링크 URL |
| title | string | - | 제목 (없으면 AI가 URL 기반으로 생성) |
| aiProvider | string | - | `local` \| `api` (헤더 없을 때 보조) |

**응답 (200 OK)**

```json
{
  "title": "AI가 생성한 제목",
  "description": "한 줄 설명",
  "valueIds": ["uuid1", "uuid2"],
  "faviconUrl": "https://…",
  "rawResponse": "…"
}
```

| 필드 | 설명 |
|------|------|
| valueIds | 분류값 id 배열(서버 카탈로그에 있는 id만). 없거나 빈 배열이면 필드 생략 가능 |
| faviconUrl, rawResponse | 선택 |

**에러**

- `400` - url 없음
- `503` - Ollama 미실행 또는 연결 실패

---

#### POST /api/links/values

새 태그 추가. 목적(purpose) 또는 종류(medium)에 생성. 이미 동일 label이 있으면 기존 id 반환.

**인증:** `Authorization: Bearer <jwt>` 필요

**Request Body**

```json
{
  "label": "새 태그명",
  "dimensionSlug": "purpose"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| label | string | O | 태그 라벨 |
| dimensionSlug | string | O | "purpose"(목적) 또는 "medium"(종류) |

**응답 (201 Created / 200 OK)**

```json
{
  "id": "uuid",
  "label": "새 태그명"
}
```

**에러**

- `400` - label 없음, dimensionSlug가 purpose/medium 아님
- `503` - dimension 미존재

---

### 4.2 관리 (인증 필요)

#### POST /api/links

링크 추가.

**인증:** `Authorization: Bearer <jwt>` 필요

**Request Body**

```json
{
  "url": "https://example.com",
  "title": "사이트명",
  "description": "간단 설명 (선택)",
  "sortOrder": 0,
  "valueIds": ["uuid1", "uuid2"]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| url | string | O | 링크 URL |
| title | string | O | 사이트명 |
| description | string | - | 간단 설명 |
| sortOrder | number | - | 정렬 순서 (기본 0) |
| valueIds | string[] | - | 분류 값 ID 배열 |

**응답 (201 Created)**

```json
{
  "id": "uuid",
  "url": "https://example.com",
  "title": "사이트명",
  "description": "간단 설명",
  "sortOrder": 0,
  "createdAt": "2026-03-03T00:00:00.000Z"
}
```

---

#### PATCH /api/links/:id

링크 수정.

**인증:** `Authorization: Bearer <jwt>` 필요

**Path Parameters**

| 파라미터 | 설명 |
|----------|------|
| id | 링크 UUID |

**Request Body** (부분 수정, 전부 선택)

```json
{
  "url": "https://example.com",
  "title": "사이트명",
  "description": "간단 설명",
  "sortOrder": 0,
  "valueIds": ["uuid1", "uuid2"]
}
```

**응답 (200 OK)** - 수정된 링크 객체

---

#### DELETE /api/links/:id

링크 삭제.

**인증:** `Authorization: Bearer <jwt>` 필요

**Path Parameters**

| 파라미터 | 설명 |
|----------|------|
| id | 링크 UUID |

**응답 (200 OK)** - 빈 본문 또는 `{ "ok": true }`

**에러**

- `404` - 해당 ID 링크 없음

---

### 4.3 분류 축·값 관리 (인증 필요, 설계 확장)

> **참고:** 구현 계획 Phase 2에는 포함되지 않았으나, 설계 문서에 정의된 API. 필요 시 Phase 3 이후 추가.

#### POST /api/links/dimensions

분류 축 추가.

**Request Body**

```json
{
  "slug": "purpose",
  "label": "목적",
  "allowHierarchy": true,
  "sortOrder": 1
}
```

#### PATCH /api/links/dimensions/:id

분류 축 수정.

#### POST /api/links/dimensions/:id/values

분류 값 추가.

**Request Body**

```json
{
  "slug": "image-gen",
  "label": "이미지 생성",
  "parentId": "uuid 또는 null",
  "sortOrder": 1
}
```

#### PATCH /api/links/values/:id

분류 값 수정.

---

## 5. 학습 API (`/api/learning`)

학습 기록 UI는 이 API로 섹션·트리 메타를 가져오고, **마크다운 본문**은 대부분 CloudFront 정적 경로 `/learnings/<폴더>/...` 로 fetch한다(`learningMarkdownUrl`). 프로덕션에서 API·정적 호스트가 분리된 동작: [error-fixes/0005](./error-fixes/0005-learning-production-split-hosting.md).

등록 섹션(`sectionId`) 예: `info-engineer`, `info-engineer-practical`, `sqld`, `big-data-analyst`, `project-learning` — 정의: `server/src/config/learning-sections.ts`.

### GET /api/learning/sections

섹션 목록 조회. DB(`learning_sections`)가 있으면 DB 우선, 없으면 config 목록.

**응답 (200 OK)**

```json
[
  {
    "sectionId": "info-engineer",
    "sectionLabel": "정보처리기사 필기",
    "basePath": "/learnings/정보처리기사_필기",
    "nodes": []
  }
]
```

클라이언트는 응답을 `mergeLearningSectionSummaries`로 **config 등록 순서**에 맞춘 뒤 표시한다.

---

### GET /api/learning/sections/:sectionId

섹션 상세 + 노드·문서 트리. DB에 노드가 있으면 DB, 없으면 서버 디스크 스캔(`LEARNINGS_ROOT`). 스캔 결과도 노드가 없으면 **404**.

**Path Parameters**

| 파라미터 | 설명 |
|----------|------|
| sectionId | 섹션 id (예: `sqld`, `info-engineer`) |

**응답 (200 OK)**

```json
{
  "sectionId": "sqld",
  "sectionLabel": "SQLD",
  "basePath": "/learnings/SQLD",
  "nodes": [
    {
      "id": "01_데이터_모델링의_이해",
      "name": "데이터 모델링의 이해",
      "description": "ERD, 정규화, 식별자 등 (1과목)",
      "docs": [
        {
          "slug": "01_모델링_개념과_단계",
          "title": "01_모델링_개념과_단계",
          "filePath": "01_데이터_모델링의_이해/01_모델링_개념과_단계.md"
        }
      ]
    }
  ]
}
```

**클라이언트 폴백** — `nodes`가 비거나 404이면 빌드에 포함된 `file-structure-sections/learning-*.ts` config 트리를 사용한다.

---

### GET /api/learning/raw/:sectionId/*

`project-learning` 등 API 서버 디스크에서 md 원문을 내려준다. `basePath`가 `/api/learning/raw/...` 인 섹션 전용.

**에러**

- `404` - 해당 섹션 없음

---

## 6. AI 도구 스크랩 API (`/api/ai-scraps`)

AI·개발 도구 링크 스크랩. 응답 필드는 서버에서 camelCase로 직렬화된다.

### GET /api/ai-scraps

공개. 목록.

**Query**

| 파라미터 | 설명 |
|----------|------|
| `q` | 검색어 (제목·URL·본문·태그) |
| `kind` | `sourceKind` 필터 |
| `tag` | 태그 하나 일치 |

### GET /api/ai-scraps/by-slug/:slug

공개. 슬러그로 단건.

### POST /api/ai-scraps

인증 필요. 생성.

**Body (주요 필드)**  
`title`, `url`, `sourceKind`, `summary`, `bodyMd`, `tags`, `extraLinks`(`{ label, url }[]`), `slug`(선택)

### PATCH /api/ai-scraps/:id

인증 필요. 부분 수정.

### DELETE /api/ai-scraps/:id

인증 필요.

---

## 7. 칼럼 스크랩 API (`/api/column-scraps`)

블로그·기사·README·유튜브·X 등 **칼럼 스크랩**.

### GET /api/column-scraps

공개.

**Query**

| 파라미터 | 설명 |
|----------|------|
| `q` | 검색어 |
| `kind` | `sourceKind` |
| `tags` | 쉼표로 여러 태그 → **AND** (모두 포함하는 항목만) |

### GET /api/column-scraps/by-slug/:slug

공개.

### POST /api/column-scraps/ai-fill

인증 필요. URL(또는 Obsidian 유튜브 클립)로 AI가 `title`, `summary`, `bodyMd`, `sourceKind`, `coverImageUrl`, `tags` 제안. 제공자는 `X-AI-Provider` / `aiProvider`로 선택(기본 로컬).

**Body**

```json
{
  "url": "https://www.youtube.com/watch?v=…",
  "youtubeClip": "---\nsource: …\n---\n…",
  "aiProvider": "local"
}
```

| 필드 | 필수 | 설명 |
|------|------|------|
| `url` | `youtubeClip` 없을 때 | 원문 URL. 클립만 넣을 경우 클립의 `source`로 보완 |
| `youtubeClip` | `url` 없을 때 | Obsidian Web Clipper `raw/youtube` 노트 전문(frontmatter·JSON 템플릿·`## 트랜스크립트`). 있으면 **서버 YouTube 자막 fetch 생략** — 배포 환경에서 URL-only 실패 시 권장 |

**에러**  
`400` — 유튜브 URL인데 자막 없음(`youtubeClip` 미제공 시). 클립 형식 인식 실패.  
`503` — Ollama·Gemini 연결 실패 등.

의사결정: [0022](decisions/0022-obsidian-youtube-clip-column-scrap.md)

### POST /api/column-scraps

인증 필요. 생성.  
**Body**: `title`, `url`, `sourceKind`, `summary`, `bodyMd`, `coverImageUrl`, `tags`, `extraLinks`, `slug`(선택)

### PATCH /api/column-scraps/:id

인증 필요.

### DELETE /api/column-scraps/:id

인증 필요.

---

## 8. 공개 메타 (`/api/meta`)

인증 불필요. 클라이언트 헤더 등에서 현재 서버가 노출하는 AI 연결 요약만 반환한다(비밀·전체 호스트 내부값은 포함하지 않음).

### GET /api/meta

**응답 (200 OK)**

```json
{
  "ai": {
    "local": {
      "mode": "local",
      "label": "Ollama · gemma4 @ localhost:11434"
    },
    "api": {
      "mode": "api",
      "label": "Gemini · gemini-3.1-flash-lite-preview"
    }
  },
  "features": {
    "columnScrapYoutubeTranscript": true
  }
}
```

| 필드 | 설명 |
|------|------|
| `ai.local` / `ai.api` | 각각 로컬(Ollama)·API(Gemini) 경로의 `mode` + `label`(모델·호스트 힌트, 환경 변수 기준) |
| `features.columnScrapYoutubeTranscript` | 유튜브 칼럼 스크랩 AI가 자막·메타데이터 추출 경로를 쓰는지(현재 항상 `true`). [ADR 0021](decisions/0021-youtube-transcript-unified-ai-path.md) |

---

## 9. 사이트 도메인 (`/api/site-domain`)

메인 페이지 도메인 만료 알림판용 등록·만료일. DB `site_domain_settings`(단일 행) 또는 서버·클라이언트 config 기본값.

스키마·RLS: `docs/plans/2026-05-19-site-domain-settings.sql`  
의사결정: `docs/decisions/0019-site-domain-expiry-notice.md`

### GET /api/site-domain

**인증:** 불필요

**응답 (200 OK)**

```json
{
  "registeredDate": "2026-05-16",
  "expiryDate": "2026-08-16",
  "renewalReminderDays": 30,
  "source": "database",
  "updatedAt": "2026-05-19T12:00:00.000Z"
}
```

| 필드 | 설명 |
|------|------|
| `registeredDate` / `expiryDate` | `YYYY-MM-DD` (달력 기준) |
| `renewalReminderDays` | 만료 N일 전 연장 권장(현재 30, config 고정) |
| `source` | `database` \| `config`(테이블 없음·행 없음·DB 미설정 시) |
| `updatedAt` | DB 행 갱신 시각(선택) |

**에러:** `503` — Supabase 미설정(조회는 config 폴백으로 200 가능; 구현상 DB 클라이언트 없으면 config만 반환)

### POST /api/site-domain/renew

내도메인.한국에서 **오늘 연장한 뒤** 관리자가 사이트에 반영. 등록일=오늘, 만료일=오늘+(기존 `expiryDate`−`registeredDate` 일수).

**인증:** `Authorization: Bearer <jwt>` 필요

**응답 (200 OK)** — 본문 형식은 GET과 동일(`source`: `database`)

**에러**

- `401` — 토큰 없음/무효
- `503` — DB 미설정(upsert 불가)

---

## 10. 헬스 체크·연동 스모크

### GET /health

서버 상태 확인(직접 포트 접속 시).

**응답 (200 OK)**

```json
{
  "status": "ok"
}
```

### GET /api/health

개발 시 Vite가 `/api`만 프록시하므로, 브라우저에서 API 가동 여부 확인용으로 동일 `{ "status": "ok" }` 반환.

### GET /api/ai-smoke/local

로컬 Ollama 연결 점검(인증 없음). `OLLAMA_HOST`의 `/api/tags` 후, 설정 모델로 `/api/generate` 1회. 성공 시 `ok: true`, `generateResponsePreview` 등. 클라이언트 점검 페이지: `/ai-smoke-test`.

---

## 11. 참고

- 설계: `docs/plans/2026-03-03-links-admin-design.md`
- 구현 계획: `docs/plans/2026-03-03-links-admin-implementation-plan.md`
- 스키마: `docs/plans/2026-03-03-links-schema.sql`
- 링크 AI: `docs/plans/2026-03-13-links-ai-suggest-design.md`
- 칼럼 스크랩: `docs/plans/2026-03-24-column-scraps-migration.sql`, `docs/decisions/0014-column-scraps-and-scrap-ux.md`
