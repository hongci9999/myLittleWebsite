# 링크 AI: Ollama 서버 방식 채택

- **날짜**: 2026-03-13
- **상태**: 채택

## 배경 (왜 이 결정이 필요한가)

유용한 링크 등록 시 AI가 제목·설명·태그를 자동 추천하는 기능을 추가하려 했다. 로컬/서버 AI를 우선 고려했고(프라이버시·비용), 여러 방식 중 하나를 선택해야 했다.

## 결정 (무엇으로 했는지)

**Ollama 서버 방식** 채택

- 서버(Express)와 Ollama를 같은 PC/인스턴스에서 실행
- 클라이언트 → 우리 API → 서버 내부 Ollama (`localhost:11434`)
- 모델: `OLLAMA_MODEL`로 지정 (코드 기본 태그 `gemma4`; 도입 당시 예시 `lfm2:24b`)
- 환경 변수: `OLLAMA_HOST` (기본 `http://localhost:11434`)

## 이유 (다른 선택지를 배제한 이유)

| 선택지 | 배제 이유 |
|--------|-----------|
| **WebLLM (브라우저 내 AI)** | 첫 실행 시 모델 다운로드(수백 MB~수 GB), WebGPU 필요, 저사양에서 느림. 나중에 폴백 옵션으로 검토 가능 |
| **Ollama 클라이언트(localhost)** | 같은 PC에서만 동작. B PC에서 접속 시 B PC의 localhost를 봄 → Ollama 없으면 실패 |
| **Ollama 서버** | 어느 PC에서 접속해도 동작, 배포 시에도 동일 구조. AWS EC2 등 클라우드 배포 시 그대로 사용 가능 |

## 결과/참고

- `server/src/services/ai/` — 제안 로직·프롬프트·`AiTextProvider`(기본 Ollama); `server/src/services/ollama.ts`는 라우트 호환 재export ([0015](./0015-ai-text-provider-abstraction.md))
- `docs/plans/2026-03-13-links-ai-suggest-design.md` — 설계·옵션 상세
- `docs/learnings/0018-local-ai-ollama-webllm.md` — Ollama, WebLLM 기술 상세
