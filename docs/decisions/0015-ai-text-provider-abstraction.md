# 서버 AI: 텍스트 제공자 추상화·프롬프트 모듈화

- **날짜**: 2026-03-24
- **상태**: 채택

## 배경 (왜 이 결정이 필요한가)

링크 메타·칼럼 스크랩·AI 도구 스크랩 제안 로직이 `ollama.ts` 한 파일에 프롬프트·휴리스틱·파싱이 뒤섞여 유지보수가 어려웠다. 이후 **OpenAI 등 원격 API**로 바꿀 때도 호출부를 전부 손대야 할 위험이 있었다.

## 결정 (무엇으로 했는지)

1. **`AiTextProvider` 인터페이스**  
   - `complete(prompt: string): Promise<string>` 한 가지로 텍스트 생성을 추상화한다.
2. **Ollama 구현 분리**  
   - `createOllamaTextProvider()` — `OLLAMA_HOST`, `OLLAMA_MODEL` 사용.
3. **기본 인스턴스**  
   - `getAiTextProvider()` 싱글톤에서 구현체를 선택한다. (추후 `AI_TEXT_PROVIDER` 등 환경 변수로 분기 확장 가능.)
4. **프롬프트는 기능별 객체**  
   - `LinkMetaPrompts`, `ColumnScrapPrompts`, `AiToolScrapPrompts` — 파일 단위로 분리.
5. **유스케이스 파일**  
   - `suggest-link-meta.ts`, `suggest-column-scrap.ts`, `suggest-ai-tool-scrap.ts`가 fetch·프롬프트·파싱·`AiTextProvider`를 조합한다.
6. **라우트 import 경로 유지**  
   - `server/src/services/ollama.ts`는 `ai/index`를 재export만 한다.

## 이유 (다른 선택지를 배제한 이유)

| 선택지 | 배제 이유 |
|--------|-----------|
| 파일만 쪼개고 인터페이스 없음 | API 교체 시 유스케이스마다 `fetch` 형식을 다시 맞춰야 함 |
| 클라이언트에서 직접 OpenAI 호출 | 키 노출·CORS·기존 Ollama 서버 방식(0012)과 충돌 |
| 단일 `prompts.ts` 거대 파일 | 기능별 탐색·리뷰가 어려움 |

## 결과/참고

- 코드: `server/src/services/ai/`
- 학습 요약: [learnings/0021-server-ai-prompt-provider-layout.md](../learnings/0021-server-ai-prompt-provider-layout.md)
- 링크 AI 백엔드 선택(Ollama) 자체는 [0012](./0012-ollama-ai-links.md)와 동일; 본 ADR은 **코드 구조·교체 용이성**에 한정한다.
