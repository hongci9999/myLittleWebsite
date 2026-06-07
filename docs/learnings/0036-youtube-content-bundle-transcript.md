# YouTube 메타데이터·자막 통합 추출 (youtube-content)

날짜: 2026-06-07  
태그: [ai, 백엔드, 도구]

## 요약

- 유튜브 URL은 **InnerTube player API** 또는 watch 페이지의 `ytInitialPlayerResponse`에서 메타·caption track 목록을 얻고, track URL로 **자막 XML**을 받아 평문으로 합친다.
- Obsidian Web Clipper 「YouTube with transcript」와 같이 **제목·채널·설명·자막**을 `fullText`로 묶어 Ollama·Gemini 모두에 넘긴다.
- 실패 시 [0023](0023-youtube-transcript-cjs-load.md)의 `youtube-transcript` npm으로 폴백한다.

## 핵심 개념

### 1) 데이터 흐름

```
watch URL
  → videoId 파싱
  → POST youtubei/v1/player (ANDROID client)  [1순위]
  → 또는 GET watch?v=… HTML → ytInitialPlayerResponse  [2순위]
  → videoDetails (title, author, shortDescription, lengthSeconds, thumbnail)
  → captionTracks → baseUrl fetch → XML 파싱 → transcript 평문
  → youtubeBundleToFullText → fetchWebsiteContent.fullText
  → AI deepAnalysisNoteYoutubeTranscript → metadata JSON
```

### 2) 자막 track 선택

- 수동 자막(`kind !== 'asr'`)을 자동 생성보다 우선.
- 언어: `ko` → `en` → `en-US` → `ja` → 첫 track.
- 자막 없으면 `youtubeMissingTranscript: true` → AI 제안 400 ([0016](../decisions/0016-gemini-youtube-transcript-and-public-meta.md)).

### 3) AI 입력 형식 (fullText 예)

```text
제목: …
채널: …
게시일: …
재생시간: …
설명:
…

동영상 자막 기반 텍스트 (언어: ko) — 요약·본문 작성의 주요 근거:

…자막 평문…
```

### 4) Gemini 영상 URL 입력과의 차이

- 이전: API 모드 + YouTube → `completeWithYoutubeUrl`(멀티모달 file_uri).
- 현재: 자막 텍스트만 `complete`(텍스트 프롬프트). [ADR 0021](../decisions/0021-youtube-transcript-unified-ai-path.md).

## 상세 설명 (이해한 내용)

- `MAX_TRANSCRIPT_CHARS`는 16_000자. 초과 시 잘라 `...` 붙임.
- `fetch-website`는 유튜브면 HTML fetch 전에 bundle을 시도해, watch HTML이 빈약해도 자막·메타만으로 `WebsiteContent`를 만든다.
- 링크 AI 제안·AI 도구 스크랩도 동일 `fetchWebsiteContent`를 쓰므로 유튜브는 모두 자막 경로다.

## 참고

- 코드: `server/src/services/youtube-content.ts`, `youtube-transcript-text.ts`, `fetch-website.ts`
- 칼럼 파이프라인: [0020](0020-column-scrap-markdown-youtube.md)
- npm 로드: [0023](0023-youtube-transcript-cjs-load.md)
