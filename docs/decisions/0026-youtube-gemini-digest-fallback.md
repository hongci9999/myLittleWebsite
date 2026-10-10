# 유튜브 AI 채우기 — 자막 fetch 실패 시 Gemini 영상 직접 분석 폴백

날짜: 2026-10-11  
상태: 채택 ([0021](0021-youtube-transcript-unified-ai-path.md) 보완)

## 배경 (왜 이 결정이 필요한가)

- Vercel(AWS IP)에서 유튜브 자막 fetch가 막혀, 자막이 있는 영상도 「자막을 가져올 수 없어 AI 제안을 실행할 수 없습니다」로 실패했다. 그래서 Obsidian 클립을 매번 붙여넣고 있었다([0022](0022-obsidian-youtube-clip-column-scrap.md)).
- 2026-10-11 Vercel 실측: `youtube-transcript-api`(Python) 4개 영상 중 3개 `RequestBlocked`, 같은 영상은 로컬(가정용 IP)에서 모두 성공 → 라이브러리가 아니라 **IP 차단** 문제.
- Gemini는 구글 서버가 YouTube URL을 직접 읽으므로 서버 IP 차단과 무관하다(로컬·Vercel 스모크 테스트 성공).

## 결정 (무엇으로 했는지)

1. `fetchWebsiteContent`: 자막 fetch(InnerTube → npm)가 모두 실패하면 `fetchYoutubeGeminiDigest`로 Gemini가 영상을 보고 **자막 대체 텍스트**(제목·채널·시간순 상세 내용)를 만든다.
2. 그 텍스트를 `fullText`로 넘겨 이후 섹션별 AI 정리(심층 노트 → 제목·요약·본문·태그 JSON)는 기존 그대로 탄다 → 칼럼·게임 개발 도서관·AI 개발 도구·링크 모두 같은 형식.
3. Gemini 키가 없거나 실패하면 기존처럼 「자막 없음」 에러. 자막을 받을 수 있는 환경(로컬)은 동작 변화 없음. Obsidian 클립 경로는 예비로 유지.
4. 영상 분석이 30초 이상 걸려 `api/index.ts` `maxDuration` 60 → 300.

## 이유 (다른 선택지를 배제한 이유)

| 대안 | 배제 이유 |
|------|-----------|
| youtube-transcript-api 등 다른 자막 라이브러리 | 같은 IP라 동일하게 차단(실측) |
| 주거용 프록시 | 별도 유료 계정·키 관리 필요 |
| 로컬 PC 스크립트 | 기록할 때마다 PC에서 실행해야 함 |

[0021](0021-youtube-transcript-unified-ai-path.md)에서 Gemini 영상 입력을 뺀 이유(비용·비공개 영상 실패)는 **폴백 전용**으로만 써서 완화한다. 비공개·연령 제한 영상은 여전히 실패할 수 있다.

## 결과/참고

- 코드: `server/src/services/ai/youtube-ai-path.ts`, `server/src/services/fetch-website.ts`, `vercel.json`
- 점검: `/ai-smoke-test` 「Gemini YouTube 직접 분석」(`POST /api/ai-smoke/gemini-youtube`)
