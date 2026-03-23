# API 명세서

날짜: 2026-03-24 (§6·§7 스크랩 API 반영)

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

AI 제목·설명·분류 추천. (Ollama 연동)

**인증:** `Authorization: Bearer <jwt>` 필요

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
  "valueIds": ["uuid1", "uuid2"]
}
```

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

### GET /api/learning/sections

섹션 목록 조회.

**응답 (200 OK)**

```json
[
  {
    "sectionId": "uuid",
    "sectionLabel": "섹션명",
    "basePath": "/learn/섹션경로",
    "nodes": []
  }
]
```

---

### GET /api/learning/sections/:sectionId

섹션 상세 + 노드·문서 조회.

**Path Parameters**

| 파라미터 | 설명 |
|----------|------|
| sectionId | 섹션 UUID |

**응답 (200 OK)**

```json
{
  "sectionId": "uuid",
  "sectionLabel": "섹션명",
  "basePath": "/learn/섹션경로",
  "nodes": [
    {
      "nodeId": "uuid",
      "label": "노드명",
      "path": "상대경로",
      "documents": []
    }
  ]
}
```

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

인증 필요. URL만내면 Ollama로 `title`, `summary`, `bodyMd`, `sourceKind`, `coverImageUrl`, `tags` 제안.

**Body**

```json
{ "url": "https://..." }
```

**에러**  
`503` — Ollama 연결 실패 등.

### POST /api/column-scraps

인증 필요. 생성.  
**Body**: `title`, `url`, `sourceKind`, `summary`, `bodyMd`, `coverImageUrl`, `tags`, `extraLinks`, `slug`(선택)

### PATCH /api/column-scraps/:id

인증 필요.

### DELETE /api/column-scraps/:id

인증 필요.

---

## 8. 헬스 체크

### GET /health

서버 상태 확인.

**응답 (200 OK)**

```json
{
  "status": "ok"
}
```

---

## 9. 참고

- 설계: `docs/plans/2026-03-03-links-admin-design.md`
- 구현 계획: `docs/plans/2026-03-03-links-admin-implementation-plan.md`
- 스키마: `docs/plans/2026-03-03-links-schema.sql`
- 링크 AI: `docs/plans/2026-03-13-links-ai-suggest-design.md`
- 칼럼 스크랩: `docs/plans/2026-03-24-column-scraps-migration.sql`, `docs/decisions/0014-column-scraps-and-scrap-ux.md`
