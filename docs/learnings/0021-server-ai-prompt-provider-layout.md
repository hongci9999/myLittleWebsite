# 서버 AI: 프롬프트 모듈·AiTextProvider 레이아웃

날짜: 2026-03-24  
태그: [ai, 백엔드, 아키텍처, 도구]

## 요약

스크랩·링크용 로컬 AI 호출을 `server/src/services/ai/` 아래로 모았다. 텍스트 생성은 `AiTextProvider`, Ollama는 그 구현체, 프롬프트는 기능별 객체로 두어 API 교체 시 레지스트리와 제공자 구현만 바꾸면 된다.

## 핵심 개념

| 구성요소 | 역할 |
|----------|------|
| `AiTextProvider` | `complete(prompt)` — 모델·벤더 무관한 최소 계약 |
| `createOllamaTextProvider()` | `/api/generate`, `OLLAMA_HOST` / `OLLAMA_MODEL` |
| `getAiTextProvider()` | 앱 전역에서 쓰는 기본 제공자 (싱글톤) |
| `*Prompts` | 문자열만 조합; 네트워크 호출 없음 |
| `suggest-*.ts` | `fetch-website` + 프롬프트 + `complete` + JSON 후처리 |

## 상세 설명 (디렉터리)

```
server/src/services/ai/
├── index.ts                    # 공개 export
├── types.ts                    # AiSuggestResult 등
├── json-from-model.ts          # 코드펜스 제거 등
├── url-hints.ts                # sourceKind 휴리스틱, X URL 처리
├── prompts/
│   ├── link-meta.prompts.ts
│   ├── column-scrap.prompts.ts
│   └── ai-tool-scrap.prompts.ts
├── providers/
│   ├── types.ts
│   ├── ollama-text-provider.ts
│   └── registry.ts
├── suggest-link-meta.ts
├── suggest-column-scrap.ts
└── suggest-ai-tool-scrap.ts
```

`server/src/services/ollama.ts`는 라우트 호환용으로 위 모듈을 재export한다.

## 참고

- [decisions/0015-ai-text-provider-abstraction.md](../decisions/0015-ai-text-provider-abstraction.md)
- [0018-local-ai-ollama-webllm.md](./0018-local-ai-ollama-webllm.md) — Ollama·WebLLM 개념
- [0012-ollama-ai-links.md](../decisions/0012-ollama-ai-links.md) — 왜 서버 경유 Ollama인지
