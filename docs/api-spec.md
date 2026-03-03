# API 명세서

날짜: 2026-03-03

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

## 6. 헬스 체크

### GET /health

서버 상태 확인.

**응답 (200 OK)**

```json
{
  "status": "ok"
}
```

---

## 7. 참고

- 설계: `docs/plans/2026-03-03-links-admin-design.md`
- 구현 계획: `docs/plans/2026-03-03-links-admin-implementation-plan.md`
- 스키마: `docs/plans/2026-03-03-links-schema.sql`
