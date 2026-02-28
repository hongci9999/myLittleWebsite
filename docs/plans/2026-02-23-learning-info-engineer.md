# 학습자료 페이지 - 정보처리기사 항목 통합

날짜: 2026-02-23
상태: Phase 1 진행 중 (프로토타입 완료)

## 배경

- `정처기/` 폴더에 정보처리기사 시험 준비용 학습 자료 95개+ (강의 정리, 무제 등)
- 현재 LearningPage는 "준비 중" 상태
- 이 자료를 사이트 학습자료 페이지에 정보처리기사 섹션으로 정리하고 싶음

---

## 정처기 폴더 구조 (현재)

```
정처기/
├── 00_Dashboard.md           # 대시보드
├── 01_소프트웨어설계/         # 10개 파일
├── 02_소프트웨어개발/         # 12개 파일
├── 03_데이터베이스구축/       # 10개 파일
├── 04_프로그래밍언어활용/     # 9개 파일
├── 05_정보시스템구축관리/     # 7개 파일
└── 99_노트/                  # 1~5장 무제 (기출·오답)
```

- 각 파일: YAML frontmatter (날짜, 태그, 주제) + Markdown 본문
- 태그 예: `[강의정리, 정보처리기사, 소프트웨어공학]`

---

## 구현 방안 비교

| 방안 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **A. 정적 목록 + 외부 링크** | 목록만 표시, 클릭 시 GitHub raw 또는 로컬 파일 열기 | 구현 간단 | 사이트 내에서 보기 어려움 |
| **B. public 복사 + fetch** | 정처기 → `client/public/learnings/정처기` 복사, fetch로 md 불러와 react-markdown 렌더 | 사이트 내에서 바로 읽기 | md 파일 중복, 빌드 시 동기화 필요 |
| **C. 빌드 시점 인덱스** | 스크립트로 정처기 스캔 → JSON 인덱스 생성, md는 public에 | 목록 자동화, frontmatter 활용 | 빌드 파이프라인 추가 |
| **D. docs와 통합** | 정처기를 `docs/learnings/정처기/`로 이동, 기존 docs 구조와 통합 | 단일 소스, docs-record 규칙 적용 | 기존 정처기 구조 변경 |

---

## 추천: 방안 B + C (하이브리드)

### 1단계: 인덱스 생성

- 스크립트 `scripts/build-learning-index.ts` (또는 Node 스크립트)
- `정처기/` 폴더 스캔 → frontmatter 파싱 (gray-matter)
- 출력: `client/public/learnings/정처기-index.json`

```json
{
  "categories": [
    {
      "id": "01",
      "name": "소프트웨어 설계",
      "items": [
        { "slug": "01_소프트웨어개발생명주기", "title": "소프트웨어 개발 생명주기(SDLC) 및 방법론", "tags": [...] }
      ]
    },
    ...
  ]
}
```

### 2단계: md 파일 위치

- **옵션 A**: `정처기/`를 `client/public/learnings/정처기/`로 **복사** (빌드 스크립트에 포함)
- **옵션 B**: `정처기/`를 프로젝트 루트에 두고, Vite에서 `publicDir` 또는 alias로 참조
- **옵션 C**: `정처기/`를 `client/public/`에 **심볼릭 링크** (개발 시에만, 배포 시 복사)

### 3단계: LearningPage UI

- 섹션: **정보처리기사**
- 5개 과목 + 99_노트 카드/목록
- 클릭 시 `/learning/info-engineer/:category/:slug` 또는 쿼리로 문서 뷰어
- 뷰어: `fetch(/learnings/정처기/...)` → `react-markdown` 렌더

### 4단계: 문서 뷰어

- `LearningDocViewer` 컴포넌트
- md fetch → react-markdown + remark-gfm (테이블 등)
- frontmatter는 인덱스에서 가져오거나, md 상단에서 파싱

---

## 최소 구현 (MVP) — 2026-02-28 프로토타입 완료

1. **수동 인덱스**: `client/src/shared/config/learningInfoEngineer.ts` (TypeScript config)
2. **정처기 샘플**: `client/public/learnings/정처기/01_소프트웨어설계/` (sdlc.md, uml.md)
3. **파일 구조형 네비게이션**:
   - `/learning` → 정보처리기사
   - `/learning/info-engineer` → 6개 과목
   - `/learning/info-engineer/:categoryId` → 문서 목록
   - `/learning/info-engineer/:categoryId/:docSlug` → 문서 뷰어 (react-markdown)
4. **헤더 breadcrumb**: 파일 경로 형태 (`myLittleWebsite / 학습자료 / ...`)
5. **FileListItem**: 풀폭 직사각형, 세로 배치, 제목·부가설명

---

## 필요한 패키지

- `react-markdown`: Markdown → React 컴포넌트
- `remark-gfm`: GitHub Flavored Markdown (테이블, 체크박스 등)
- `gray-matter`: frontmatter 파싱 (인덱스 빌드 스크립트용)

---

## 결정 필요 사항

1. **정처기 폴더 위치**: 프로젝트 내 유지 vs `docs/learnings/` 통합
2. **동기화**: 정처기 수정 시 수동 복사 vs 빌드 스크립트 자동화
3. **범위**: 5개 과목만 vs 99_노트 포함 전체

---

## 참고

- 기존 `docs/learnings/` (0001~0008): 프로젝트 학습 기록, 태그 시스템
- `정처기/`: 시험 준비용, 별도 구조. 통합 시 태그 매핑 (정보처리기사 → learnings 태그)

---

## Phase 2: DB 연동 (향후 목표)

정처기 5개 과목(01~05) + 99_노트 내용을 **데이터베이스에 저장**하고, 프론트가 API로 조회하는 구조로 전환하고 싶음.

### 아키텍처

```
정처기 md 파일 → [마이그레이션 스크립트] → Supabase (PostgreSQL)
                                              ↓
client (LearningPage) ← REST API ← server (Express)
```

### DB 스키마 (예시)

| 테이블 | 용도 |
|--------|------|
| `learning_categories` | 과목 (01 소프트웨어설계, 02 소프트웨어개발, …) |
| `learning_docs` | 문서 (title, slug, content_md, category_id, tags, created_at) |
| `learning_tags` | 태그 (태그별 필터링) |

### 마이그레이션 흐름

1. `정처기/` md 스캔 → frontmatter + 본문 파싱
2. `learning_categories`에 5개 과목 + 99_노트 삽입
3. `learning_docs`에 문서별로 삽입 (content_md에 본문)
4. `learning_tags`는 태그 배열 파싱 후 정규화

### API (예시)

- `GET /api/learnings/categories` — 과목 목록
- `GET /api/learnings/docs?category=01` — 과목별 문서 목록
- `GET /api/learnings/docs/:slug` — 문서 상세 (content_md 포함)

### 구현 순서

1. **Phase 1 (현재)**: 정적 md + public fetch로 MVP
2. **Phase 2**: Supabase 테이블 생성, 마이그레이션 스크립트
3. **Phase 2**: server API (learnings 라우트)
4. **Phase 2**: client가 API 호출로 전환, 정적 fetch 제거

### 정처기 md 형식 유지

- 마이그레이션 후에도 md를 **소스 of truth**로 둘 수 있음
- md 수정 → 스크립트 재실행 → DB 업데이트
- 또는 DB를 주 소스로 하고, md는 내보내기용으로만 사용
