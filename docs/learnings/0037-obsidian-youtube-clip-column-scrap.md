# Obsidian 유튜브 클립 붙여넣기 — 배포 환경 칼럼 AI 요약

날짜: 2026-06-07  
태그: [ai, 백엔드, 프론트, 도구]

## 요약

- 로컬에서는 YouTube URL → 서버 자막 fetch → AI 요약이 됐지만, **배포(EB)** 에서는 YouTube가 서버 요청에 자막을 안 주는 경우가 많았다.
- **Obsidian Web Clipper** `raw/youtube` 노트(frontmatter·JSON 템플릿·`## 트랜스크립트`)를 칼럼 스크랩에 **붙여넣기**하면 서버 fetch 없이 자막·메타를 AI에 넘긴다.

## 핵심 개념

### 1) 두 가지 입력 경로

| 경로 | 언제 쓰나 | 전제 |
|------|-----------|------|
| **URL만** | 로컬·자막 fetch 성공 환경 | `fetchYoutubeContentBundle` 또는 npm 폴백 |
| **youtubeClip 붙여넣기** | 배포에서 URL 실패·Clipper 워크플로 | 클립에 `## 트랜스크립트` 또는 `noteContentFormat` 안 타임스탬프 자막 |

### 2) 지원 형식

- `---` frontmatter + 마크다운 본문
- clipper **JSON 템플릿만** 붙여넣기 (`schemaVersion`, `properties`, `noteContentFormat`)
- `noteNameFormat` 등 **비표준 JSON**(따옴표 깨짐) — `JSON.parse` 실패 시 properties·`noteContentFormat` 문자열을 직접 추출

### 3) API·UI

- `POST /api/column-scraps/ai-fill` — `{ "url": "…", "youtubeClip": "…" }`
- UI: textarea 붙여넣기 · 파일 가져오기 · 「클립 적용」 · 「AI 채우기」(붙여넣기만으로도 클립 인식)

## 상세 설명 (이해한 내용)

- 배포 서버 IP는 YouTube InnerTube·timedtext에서 로컬과 다른 응답(빈 caption track·차단)을 받을 수 있다. 사용자 PC의 Clipper는 로그인·쿠키·브라우저 맥락으로 자막을 받는 경우가 많다.
- 파서는 `**0:00** · 문장` 타임스탬프 줄을 평문 자막으로 합친 뒤 [0021](../decisions/0021-youtube-transcript-unified-ai-path.md)과 같은 `deepAnalysisNoteYoutubeTranscript` → JSON 필드 생성을 탄다.

## 참고

- ADR: [0022](../decisions/0022-obsidian-youtube-clip-column-scrap.md), [0021](../decisions/0021-youtube-transcript-unified-ai-path.md)
- 코드: `server/src/services/parse-obsidian-youtube-clip.ts`, `client/src/widgets/ColumnScrapAdminDialog/`
