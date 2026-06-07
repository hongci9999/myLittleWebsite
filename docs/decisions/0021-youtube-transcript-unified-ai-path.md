# 유튜브 AI 요약 — 자막·메타데이터 통합 경로

날짜: 2026-06-07  
상태: 채택

## 배경 (왜 이 결정이 필요한가)

- API(Gemini) 모드에서 유튜브 URL을 `completeWithYoutubeUrl`로 **영상·음성 직접 입력**하는 경로가 잠시 도입됐다. 모델·할당량·공개 영상 여부에 따라 실패가 잦고, 로컬(Ollama)과 **입력·품질 경로가 달라** 운영이 복잡했다.
- Obsidian Web Clipper 「YouTube with transcript」 템플릿처럼 **제목·채널·설명 + 자막(transcript)** 를 한 덩어리로 AI에 넣는 방식이 개인 워크플로와 맞고, [0016](0016-gemini-youtube-transcript-and-public-meta.md)의 「자막 필수」 원칙과도 일치한다.
- `youtube-transcript` npm만으로는 메타데이터(채널·게시일·재생시간)가 빈약해 AI 제목·요약 품질이 떨어질 수 있다.

## 결정 (무엇으로 했는지)

1. **모든 AI 제공자(Ollama·Gemini)에 동일 파이프라인**: YouTube URL → `fetchYoutubeContentBundle`(InnerTube/player 응답 + caption track) → `fullText` → 텍스트 `complete` → 필드 JSON 생성.
2. **`server/src/services/youtube-content.ts`**: player 응답에서 `videoDetails`·`microformat` 메타와 자막을 추출. 언어 우선순위: ko → en → en-US → ja. 실패 시 `youtube-transcript` npm 폴백.
3. **Gemini YouTube 직접 분석 제거**: `suggestColumnScrapViaGeminiYoutube`, `isColumnScrapGeminiYoutubeRequest` 삭제. `completeWithYoutubeUrl`은 제공자에 남을 수 있으나 칼럼 스크랩·링크 AI·AI 도구 스크랩 경로에서는 사용하지 않는다.
4. **유튜브 전용 프롬프트**: `deepAnalysisNoteYoutubeTranscript` — 자막을 주 근거, 메타는 보조.
5. **`GET /api/meta` features**: `columnScrapGeminiYoutube` → `columnScrapYoutubeTranscript: true`.

## 이유 (다른 선택지를 배제한 이유)

- **Gemini 영상 URL 유지**: API 비용·지연·비공개·연령 제한 영상에서 실패. 자막이 있으면 텍스트 모델로 충분하고 경로가 단순하다.
- **HTML 스크랩만**: 유튜브 watch 페이지 본문은 거의 비어 있다. 자막 없이는 0016과 같이 AI 제안을 막는다.
- **클라이언트에서 자막 추출**: Obsidian Web Clipper는 브라우저 확장 전제. 서버 스크랩·링크 AI·칼럼 스크랩은 서버에서 일관 처리해야 한다.

## 결과/참고

- 코드: `youtube-content.ts`, `fetch-website.ts`, `suggest-column-scrap.ts`, `column-scrap.prompts.ts`
- 학습: [learnings 0036](../learnings/0036-youtube-content-bundle-transcript.md)
- 이전: [0016](0016-gemini-youtube-transcript-and-public-meta.md) 자막 필수 원칙은 유지. API 모드의 영상 직접 입력 분기만 폐기.
