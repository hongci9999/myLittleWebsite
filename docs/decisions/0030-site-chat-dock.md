# 사이트 대화창 — 하단 입력창 + `POST /api/chat` (MCP 도구 재사용)

날짜: 2026-10-23  
상태: 채택

## 배경 (왜 이 결정이 필요한가)

- 모은 자료가 늘어 "그 MCP 영상 뭐였지" 같은 검색을 사이트 안에서 바로 하고 싶다. MCP(ADR 0028)는 외부 AI 앱을 열어야 해서 사이트를 둘러보다 묻기엔 번거롭다.
- 방문자(채용 담당자 등)도 설치 없이 "이 사람 어떤 프로젝트 했어?"를 물을 수 있으면 좋다.
- MCP용 `knowledgeTools`를 이미 만들어 둬서, 같은 도구를 LLM function calling에 넘기면 검색 로직을 새로 만들 필요가 없다.

## 결정 (무엇으로 했는지)

1. **`POST /api/chat { messages }` → `{ text }`** — Gemini function calling 루프(최대 5회 도구 호출). 도구 선언은 `z.toJSONSchema(z.object(inputSchema))`를 `parametersJsonSchema`로 그대로. 모델은 기존 `GEMINI_MODEL`(기본 `gemini-3.1-flash-lite`).
2. **주 용도는 사이트 주인의 자료 검색** — 시스템 프롬프트: `list_scraps`로 후보 → 필요하면 `get_scraps`·`get_source`, 찾은 항목은 제목·한 줄 요약·사이트 링크, 도구로 확인한 것만 답. 링크를 바로 달 수 있게 `list_scraps` 결과에 `siteUrl` 추가(MCP도 같이 받음).
3. **사용 제한** — 로그인(관리자) 토큰이 유효하면 무제한, 아니면 IP sha256 해시별 하루 10회. 서버리스라 메모리 카운터 대신 Supabase `chat_usage` 테이블 + `chat_hit` RPC(security definer, 테이블은 RLS로 막음).
4. **UI = 화면 중앙 하단 입력창(`widgets/ChatDock`)** — 답변이 오면 입력창 위로 대화 패널이 내용 길이만큼 펼쳐지고(최대 60vh, 넘으면 스크롤) 이전 대화를 같이 보여준다. 접기·새 대화 버튼. 대화는 브라우저 메모리에만. 질문·답변 모두 말풍선(답변은 `bg-muted` + 상세 페이지와 같은 `prose`), 대기 중엔 점 세 개 bounce(`motion-reduce`면 정지).

## 이유 (다른 선택지를 배제한 이유)

| 대안 | 배제 이유 |
|------|-----------|
| 별도 `/chat` 페이지 | 둘러보다 바로 묻는 용도에 페이지 이동이 끼어듦 |
| 우하단 플로팅 버튼 | 검색창처럼 늘 보이는 입력창이 "검색" 용도에 맞음 |
| 키워드 검색(DB full-text) | "게임 AI 관련해서 할 만한 거" 같은 자연어·요약 답변이 안 됨 |
| `gemini-generate.ts` 확장 | 텍스트 전용 함수에 도구 루프를 넣으면 기존 호출부까지 복잡해짐 |
| 스트리밍(SSE) | 1차엔 완성 응답으로 충분. 체감 느리면 추가 |

## 결과/참고

- 로컬 확인: "유니티 관련 뭐 있어?" → `list_scraps` 2회 후 게임 개발 7건, "MCP 관련 영상" → 3건 사이트 링크와 함께 답변.
- 실행 필요 SQL: [2026-10-23-chat-usage.sql](../plans/2026-10-23-chat-usage.sql). 실행 전엔 비로그인 요청이 503.
