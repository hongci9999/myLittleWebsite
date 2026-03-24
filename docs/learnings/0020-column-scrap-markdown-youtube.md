# 칼럼 스크랩 AI 파이프라인과 마크다운 속 YouTube 임베드

날짜: 2026-03-24  
태그: [ai, 백엔드, 프론트, 도구]

## 요약

- 칼럼 스크랩 **로컬 AI 채우기**는 (일반 URL 기준) **심층 분석 → JSON 필드 생성 → (필요 시) 본문만 재생성** 순서로 동작한다.
- **X(트위터)** 는 서버 fetch 본문을 쓰지 않고 URL 패턴만으로 채운다.
- **react-markdown**에서 `components.a`를 바꿔 `href`가 유튜브면 `<iframe>`과 링크를 같이 렌더한다.

## 핵심 개념

### 1) Ollama 다단계 생성

- **1단계**: 페이지에서 뽑은 `fullText`(제한된 길이)를 넣고, 주제·사실·구조·독자 등 **항목별 장문 분석**을 요청한다. 이 출력이 2·3단계의 재료가 된다.
- **2단계**: 분석 + HTML 제목 + URL 형식 힌트를 주고 **JSON 한 덩어리**로 `title`, `summary`, `bodyMd`, `sourceKind`, `tags`를 받는다. `bodyMd`는 마크다운이며 JSON 문자열 안에서는 `\n` 이스케이프가 필요하다고 프롬프트에 적어 둔다.
- **3단계(조건부)**: 분석 텍스트는 긴데 `bodyMd`가 짧으면, JSON 없이 **마크다운 원문만** 다시 생성해 품질을 맞춘다.

### 2) X를 fetch하지 않는 이유

- `x.com` 등은 비로그인 `fetch` 응답에 **Something went wrong**, 확장 프로그램 경고 등 **의미 없는 문구**가 많다.
- 이 문자열이 분석 입력으로 들어가면 모델이 그대로 요약에 넣을 수 있어, **전용 분기**로 막는다.

### 3) 마크다운 링크 → YouTube iframe

- `react-markdown`은 기본적으로 링크를 `<a>`로 만든다.
- `components={{ a: CustomAnchor }}`에서 `parseYoutubeVideoId(href)`로 ID를 뽑을 수 있으면, **같은 단락 안에** `<iframe>`(권장: youtube-nocookie)과 원문 `<a>`를 반환한다.
- HTML5에서 `<p>` 안에 `<iframe>`을 두는 것은 유효해, 단락 속 링크도 동작한다.

## 상세 설명 (이해한 내용)

- 환경 변수: `OLLAMA_HOST`, `OLLAMA_MODEL` (기본 `lfm2:24b` 등).
- `fetch-website`는 본문 길이 상한이 있어 **아주 긴 페이지**는 잘린 텍스트만 분석에 쓴다.
- 칼럼과 무관하게 `MarkdownWithMath`를 쓰는 페이지(패치노트 등)에도 **동일한 YouTube 동작**이 적용된다.

## 참고

- 코드: `server/src/services/ai/`(칼럼 스크랩 제안), `client/src/shared/ui/MarkdownWithMath.tsx`, `client/src/shared/lib/youtube.ts`
- 의사결정: `docs/decisions/0014-column-scraps-and-scrap-ux.md`
