# API 명세서

날짜: 2026-10-13 (§11 게임 개발 도서관, §12 메인 위젯, §13 MCP 추가)

myLittleWebsite 서버 REST API 명세. 클라이언트는 이 API만 호출하며, DB는 서버에서만 접근한다.

---

## 1. 기본 정보

| 항목 | 값 |
|------|-----|
| Base URL | `http://localhost:3001` (개발), `https://my-little-website-client-self.vercel.app` (프로덕션, 같은 출처 `/api`) |
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

AI 제목·설명·파비콘 추천(Gemini).

**인증:** `Authorization: Bearer <jwt>` 필요

유튜브 URL인데 자막을 가져오지 못하면 400(고정 안내 메시지)으로 거부할 수 있다.

**Request Body**

```json
{
  "url": "https://example.com",
  "title": "사이트명 (선택, 있으면 AI가 우선 사용)"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| url | string | O | 링크 URL |
| title | string | - | 제목 (없으면 AI가 URL 기반으로 생성) |

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
- `503` - Gemini 키 없음 또는 연결 실패

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

인증 필요. URL로 AI가 `title`, `summary`, `bodyMd`, `sourceKind`, `coverImageUrl`, `tags` 제안.

**Body**

```json
{
  "url": "https://www.youtube.com/watch?v=…"
}
```

| 필드 | 필수 | 설명 |
|------|------|------|
| `url` | ✅ | 원문 URL. 유튜브면 서버가 자막을 받고, 막히면 Gemini가 영상을 직접 분석 |

**에러**  
`400` — URL 없음. (유튜브 자막을 못 받으면 Gemini 영상 직접 분석으로 폴백 — [ADR 0026](decisions/0026-youtube-gemini-digest-fallback.md))  
`503` — Gemini 키 없음·연결 실패 등.

**진행 스트림** — `Accept: application/x-ndjson`이면 한 줄씩 JSON: `{t, msg}` 진행 단계(자막·Gemini 호출·응답 시간), `{t, beat: true}` 3초 heartbeat, 마지막 `{t, done: true, status, body}`(body는 위 응답/에러와 같음). `t`는 요청 시작 후 ms. 칼럼·게임 개발·AI 도구 `ai-fill` 공통(`services/progress.ts`).

의사결정: [0022](decisions/0022-obsidian-youtube-clip-column-scrap.md)(클립 입력은 2026-10 제거), [0026](decisions/0026-youtube-gemini-digest-fallback.md)

### POST /api/column-scraps

인증 필요. 생성.  
**Body**: `title`, `url`, `sourceKind`, `summary`, `bodyMd`, `coverImageUrl`, `tags`, `extraLinks`, `slug`(선택)

### PATCH /api/column-scraps/:id

인증 필요.

### DELETE /api/column-scraps/:id

인증 필요.

---

## 8. 공개 메타 (`/api/meta`)

인증 불필요. 헤더 모델 배지용 AI 모델 정보·기능 플래그 요약.

### GET /api/meta

**응답 (200 OK)**

```json
{
  "ai": {
    "model": "gemini-3.1-flash-lite",
    "youtubeModel": "gemini-2.5-flash",
    "keyConfigured": true
  },
  "features": {
    "columnScrapYoutubeTranscript": true
  }
}
```

| 필드 | 설명 |
|------|------|
| `ai.model` / `ai.youtubeModel` | 텍스트 생성 모델(`GEMINI_MODEL`) / 자막 막힐 때 영상 직접 분석 모델(`GEMINI_YOUTUBE_MODEL`) |
| `ai.keyConfigured` | 서버에 Gemini 키가 있는지 |
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

### POST /api/ai-smoke/gemini-youtube

인증 필요. Gemini가 유튜브 영상을 직접 분석하는지 점검(배포 환경 자막 차단 대응 경로, [ADR 0026](decisions/0026-youtube-gemini-digest-fallback.md)).
**Body**: `{ "url": "https://www.youtube.com/watch?v=…" }` → `{ ok, watchUrl, model, ms, text }`. 실패 시 `502` + `error`.

---

## 11. 게임 개발 도서관 API (`/api/game-dev-resources`)

칼럼 스크랩 API(§7)와 같은 구조. [ADR 0024](decisions/0024-game-dev-library.md).

### GET /api/game-dev-resources

공개. **Query**: `q`(검색어), `kind`(`mediaKind`: `youtube`·`article`·`repo`·`blog`·`doc`·`book`·`asset`·`other`), `category`(`graphics`·`physics`·`ai`·`gameplay`·`engine`·`network`·`sound`·`optimization`·`etc`).

### GET /api/game-dev-resources/by-slug/:slug

공개.

### POST /api/game-dev-resources/ai-fill

인증 필요. Body `{ url }`. 칼럼 `ai-fill`과 같은 방식으로 제목·요약·본문·형식·분야·표지·태그 제안.

### POST /api/game-dev-resources · PATCH /:id · DELETE /:id

인증 필요. Body: `title`, `url`, `mediaKind`, `category`, `summary`, `bodyMd`, `coverImageUrl`, `tags`, `extraLinks`, `slug`(선택).

---

## 12. 메인 위젯 API (공개)

| 엔드포인트 | 설명 |
|------------|------|
| `GET /api/geeknews/latest?limit=5` | GeekNews RSS 최신글. `limit` 범위 밖이면 `400`, RSS 실패 `503` |
| `GET /api/d2-helloworld/latest` | `{ d2Video, blogs }` — NAVER D2 Hello world 최신 영상 + 기술 블로그 RSS 최신글 |
| `GET /api/tech-interview/random` | gyoogle/tech-interview-for-developer 무작위 문서 1건. GitHub 실패 `503` |
| `POST /api/tarot/reading` | Body `{ cards: [{ slot: past\|present\|advice, majorId, orientation: upright\|reversed }] ×3 }` → AI 해석. 형식 오류 `400`, AI 연결 실패 `503` ([ADR 0017](decisions/0017-tarot-reading-schema-and-provider-strategy.md)) |

---

## 13. MCP 서버 (`/api/mcp`)

### POST /api/mcp

MCP 서버(Streamable HTTP, stateless, 인증 없음·읽기 전용). JSON-RPC 요청, `Accept: application/json, text/event-stream`. GET/DELETE는 `405`.
도구: `list_scraps`, `get_scraps`, `get_source`, `get_portfolio`, `read_dev_notes` — 정의는 `server/src/services/knowledge/`. 섹션: `ai-tools`·`columns`·`game-dev`·`links`. 사용법: [mcp-guide.md](mcp-guide.md), 설계: [ADR 0028](decisions/0028-site-knowledge-mcp.md).

---

## 14. 원클릭 저장 (`/api/quick-save`)

개인 크롬 확장이 호출. 모두 `Authorization: Bearer` 필요. 설계: [ADR 0029](decisions/0029-quick-save-pipeline.md).

### POST /api/quick-save

`{ url, youtube?: { title, channel, description, transcript, lang? }, page?: { title, text, image? } }` → 중복 확인 · 섹션 분류 · AI 채우기 · 저장(초안 없음).
`youtube.transcript`(유튜브) / `page.text`(그 외 — 확장이 렌더링된 탭에서 읽은 본문, SPA·봇 차단 사이트용)가 있으면 서버 fetch 대신 그걸 근거로 쓰고 `scrap_sources`에 upsert.
요청이 끊기면(확장에서 중단) 아직 저장 안 한 항목은 저장하지 않는다.

응답 `{ results: [{ url, section?, id?, slug?, title?, sitePath?, check?, duplicateOf?, error? }], log: string[] }` (500이면 `{ error, log }`) — `log`는 단계별 진행(`+경과초 내용`), 확장 「로그 복사」용 — AI 개발 도구로 분류되면 소개된 도구마다 한 건(최대 10개, 병렬 채우기)이라 여러 개일 수 있다. 칼럼·게임 개발은 자료 한 건. 유튜브가 아닌 페이지가 써먹는 사이트 자체면 `section: "link"`(유용한 링크, `POST /api/links/ai-suggest`와 같은 요약·태그, `sitePath: /links`) — 섹션 이동(`/move`) 불가, 삭제는 `DELETE /api/links/:id`. `duplicateOf`면 저장 안 함, `check`는 사람 확인 필요(예: 이름 검색으로 찾은 레포).

### POST /api/quick-save/move

`{ id, from, to }` (섹션: `ai-tool`·`column`·`game-dev`) — 내용 그대로 `to`에 만들고 `from`의 행 삭제. 응답 `{ section, id, slug, title, sitePath }`. 삭제는 각 섹션의 기존 `DELETE /:id`.

---

## 15. 사이트 대화창 (`/api/chat`)

### POST /api/chat

`{ messages: [{ role: 'user' | 'model', text }] }` (마지막은 `user`, 최근 20개·각 2000자까지 사용) → `{ text }` (Markdown). Gemini가 MCP와 같은 `knowledgeTools`를 불러 답한다.
`Authorization: Bearer`가 유효하면 무제한, 아니면 IP별 하루 10회 — 넘으면 `429`, 카운터(`chat_hit` RPC) 실패 `503`, 답변 생성 실패 `502`. 설계: [ADR 0030](decisions/0030-site-chat-dock.md).

---

## 16. 참고

- 설계: `docs/plans/2026-03-03-links-admin-design.md`
- 구현 계획: `docs/plans/2026-03-03-links-admin-implementation-plan.md`
- 스키마: `docs/plans/2026-03-03-links-schema.sql`
- 링크 AI: `docs/plans/2026-03-13-links-ai-suggest-design.md`
- 칼럼 스크랩: `docs/plans/2026-03-24-column-scraps-migration.sql`, `docs/decisions/0014-column-scraps-and-scrap-ux.md`
