# 학습 기록 프로덕션: 준비 중·목록 순서 깜빡임

날짜: 2026-05-19

## 발생한 오류

1. **배포(CloudFront) 환경** — `/learning`에서 정보처리기사 필기·실기 등 섹션은 보이나, 한 단계 들어가면 **「준비 중입니다」** 만 표시됨. 로컬 개발에서는 정상.
2. **같은 환경** — 문서를 열 수 있어도 본문 fetch가 API 호스트로 가 404가 날 수 있음(`VITE_API_BASE_URL` 사용 시).
3. **학습 기록 진입 시** — **SQLD**와 **빅데이터분석기사** 항목 순서가 API 로드 직후 잠깐 바뀌는 깜빡임.
4. **섹션·과목 목록** — 항목 **부가 설명(description)** 이 잠깐 보였다가 사라짐.

## 원인

| 현상 | 원인 |
|------|------|
| 준비 중 | 프론트는 API `GET /api/learning/sections/:id` 응답을 우선 사용. EB 번들에는 `client/public/learnings` 가 **없어** 스캔·DB 노드가 비면 `nodes: []`. 클라이언트가 빈 배열을 그대로 쓰면 config 폴백 없음. |
| md 404 | `DocViewer`가 모든 경로에 `apiUrl()` 적용 → `/learnings/*` 가 API 도메인으로 요청됨. 실제 md는 **CloudFront 정적 파일**(`client/dist/learnings/...`). |
| 순서 깜빡임 | 첫 paint는 `learning-parent` config 순서(…→ SQLD → 빅데이터…). API·`LEARNING_SECTIONS` 는 빅데이터 → SQLD 순으로 내려옴. |
| 설명 깜빡임 | config(`build-learning-config`·`nodeMeta`)에는 `description`이 있으나, API·DB·폴더 스캔 응답에는 없음. 로드 후 API 트리로 바뀌며 설명만 사라짐. |

호스팅 분리 배경: [decisions/0018](../decisions/0018-aws-production-split-hosting.md).

## 수정 방법

### 1. 노드 없을 때 config 폴백

- `client/src/shared/api/learning.ts` — `fetchLearningSection`: `nodes.length === 0` 이면 `null` 반환.
- `client/src/pages/FileStructure/FileStructureBrowserPage.tsx` — `sectionOverride` 는 노드가 있을 때만 API 트리 사용.

### 2. 마크다운은 CloudFront(상대 경로)

- `client/src/shared/api/base.ts` — `learningMarkdownUrl()`: `basePath` 가 `/learnings/` 이면 `apiUrl` 없이 `/learnings/...` 로 fetch.

### 3. 섹션 목록 순서 고정

- `mergeLearningSectionSummaries()` — API 목록을 config(`learning-parent`) 순서에 맞춰 병합.
- `server/src/config/learning-sections.ts` — SQLD를 빅데이터분석기사 앞으로 정렬( config 와 동기).

### 3b. 부가 설명(description) 유지

- `shouldUseLearningConfigOnly()` — config에 `nodes`가 있는 섹션(필기·실기·SQLD 등)은 **상세 API를 호출하지 않음**.
- `LearningBrowserPage` — 위 섹션은 처음부터 config 트리만 사용 → 설명이 API 응답으로 덮이지 않음.

### 4. SQLD 섹션 등록

- `LEARNING_SECTIONS` + `scripts/build-learning-config.mjs` + `learning-sqld.ts` + `learning-parent` 등록.

### 5. 서버

- 스캔 결과도 `nodes` 가 비면 **404** — 클라이언트가 폴백하도록 (`server/src/routes/learning.ts`).

## 결과/참고

- 구조(목록·경로)는 **빌드에 포함된 config** + API 메타데이터, 본문 md는 **S3/CloudFront 정적 파일**.
- md 추가 후 클라이언트 config 갱신: `npm run build:learning-config`.
- 로컬과 동일 이슈(빈 API nodes): [0001 §3](./0001-learning-folder-session.md).
- 배포 후 **프론트 재빌드·S3 sync** 필요.
