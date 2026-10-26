# AI 채우기 진행 스트림 — NDJSON + AsyncLocalStorage, 헤더 모델 배지

날짜: 2026-10-25  
상태: 채택

## 배경 (왜 이 결정이 필요한가)

- 유튜브 AI 채우기는 배포 환경에서 자막이 막혀 Gemini가 영상을 직접 보는 경로(ADR 0026)를 타고, 이어서 AI 호출이 2~3번 더 있다. 수십 초~2분 동안 버튼에 「AI 분석 중…」만 보여서 **진짜 진행 중인지, 어딘가 막힌 건지** 알 수 없었다.
- 로컬 AI(Ollama) 선택지를 없애면서(2026-10) 헤더의 로컬/API 전환 자리가 비었다. 지금 어떤 모델을 쓰는지는 여전히 보이면 좋다.

## 결정 (무엇으로 했는지)

1. **응답 형식 = NDJSON 스트림** — 요청에 `Accept: application/x-ndjson`이 있으면 한 줄씩 `{t, msg}`(진행 단계), `{t, beat: true}`(3초 heartbeat), 마지막 `{t, done: true, status, body}`. 헤더가 없으면 기존 JSON 그대로.
2. **미들웨어 하나로 감쌈 (`services/progress.ts`의 `progressStream`)** — `res.status()`·`res.json()`을 가로채 마지막 줄로 보낸다. 라우트 핸들러·오류 처리는 수정하지 않는다. 칼럼·게임 개발·AI 도구 `ai-fill`에 적용.
3. **단계 보고 = `AsyncLocalStorage`** — 깊은 호출(자막 fetch, Gemini 호출)에서 `reportProgress('…')`만 부르면 된다. 함수 인자로 콜백을 넘기지 않는다. 스트림 요청이 아니면 아무 일도 안 한다. Gemini 제공자는 호출마다 모델명·응답 시간을 보고한다.
4. **클라이언트 = `postAiFill` + `useAiFillProgress`** — 단계 로그, 경과 시간, 마지막 서버 신호. heartbeat가 10초 넘게 없으면 빨간 경고(연결 끊김·버퍼링 구분). 끝나면 패널이 완료(초록)·실패(빨강)로 바뀌고 버튼은 「✓ 다시 채우기」.
5. **헤더 모델 배지 (`AiModelBadge`)** — 옛 전환 자리에 `GET /api/meta`의 `ai.model`(툴팁에 영상 분석 모델·키 상태).

## 이유 (다른 선택지를 배제한 이유)

| 대안 | 배제 이유 |
|------|-----------|
| SSE(`text/event-stream`) | POST 본문을 보내려면 `EventSource`를 못 쓰고 결국 fetch 스트림을 직접 읽어야 함 — NDJSON이 더 단순 |
| 작업 ID + 폴링 | 서버리스라 진행 상태를 저장할 곳(DB·KV)이 필요 |
| 단계 콜백을 함수 인자로 전달 | `fetchWebsiteContent`·제공자 등 여러 층의 시그니처를 바꿔야 함 |
| 가짜 진행 바(시간 기반) | 「진짜 진행 중인가」라는 질문에 답하지 못함 |

## 결과/참고

- Vercel 배포에서 단계가 생기는 즉시(약 1초 내) 도착함을 실측 — 응답 버퍼링 없음.
- 코드: `server/src/services/progress.ts`, `client/src/shared/api/ai-fill-stream.ts`, `client/src/shared/ui/AiFillProgress.tsx`, `client/src/widgets/Header/AiModelBadge.tsx`
- API: [api-spec](../api-spec.md) 칼럼 `ai-fill`의 「진행 스트림」, §8 `/api/meta`
