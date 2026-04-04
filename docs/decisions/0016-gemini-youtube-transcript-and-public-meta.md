# Gemini API·유튜브 자막 필수·공개 /api/meta

날짜: 2026-04-04  
상태: 채택

## 배경 (왜 이 결정이 필요한가)

- 로컬 Ollama만 쓰면 기기·모델 설치 여부에 따라 품질·응답 속도가 들쭉날쭉하고, 배포 서버에서 동일 경험을 주기 어렵다.
- 유튜브 페이지 HTML만 스크랩하면 본문 텍스트가 거의 없어 AI 입력이 빈약하거나 오해를 부른다.
- 방문자·관리자가 “지금 어떤 AI 경로를 쓰는지” 한눈에 알면 운영·학습 기록에 유리하다.

## 결정 (무엇으로 했는지)

1. **텍스트 제공자 확장**: `AI_TEXT_PROVIDER=ollama`(기본) | `google` | `gemini` 로 Google Generative AI(Gemini) 호출. 키는 `GEMINI_API_KEY` 또는 `GOOGLE_AI_API_KEY`, 모델은 `GEMINI_MODEL`(기본 `gemini-2.0-flash` 등 환경 기본값).
2. **유튜브 URL**: `youtube-transcript`로 자막을 가져와 `fetchWebsiteContent`의 본문에 병합한다. 자막을 가져오지 못하면 `youtubeMissingTranscript`를 세팅하고, 링크 AI 제안·칼럼 스크랩·AI 도구 스크랩의 AI 제안 단계는 실행하지 않고 클라이언트에 넘길 수 있는 메시지와 함께 거부한다(400).
3. **공개 메타 API**: 인증 없이 `GET /api/meta`로 `{ ai: { mode, label } }` 만 반환한다. 비밀은 넣지 않는다.
4. **헤더**: 전광판·랜덤 인사는 제거하고, 위 `label`을 짧게 보여 주며 클릭 시 브라우저 탭 단위(`sessionStorage`)로 숨길 수 있게 한다.

## 이유 (다른 선택지를 배제한 이유)

- **Gemini**: 기존 `AiTextProvider` 추상화([0015](0015-ai-text-provider-abstraction.md))에 맞춰 한 파일·레지스트리 분기로 넣어 교체 비용을 낮췄다. 별도 마이크로서비스는 과하다.
- **자막 없으면 AI 제안 중단**: HTML만 넣어 hallucination·쓰레기 입력을 막는 것이 우선이다. 수동 입력은 항상 가능하다.
- **`/api/meta` 공개**: JWT 없이 헤더에 표시해야 하므로. 키·내부 호스트 전체는 노출하지 않고 요약 라벨만 쓴다.

## 결과/참고

- 패키지: 서버에 `youtube-transcript` 추가. tsx 실행 시 named ESM import 이슈가 있어 `createRequire`로 CJS 진입 로드 — [learnings 0023](../learnings/0023-youtube-transcript-cjs-load.md).
- API 명세: [api-spec §8](../api-spec.md).
