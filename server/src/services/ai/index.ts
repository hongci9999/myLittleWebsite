/**
 * 도메인 AI 제안(링크 메타, 칼럼·도구 스크랩 채우기).
 * 텍스트 생성은 AiTextProvider — 기본 구현은 Ollama, 교체 시 registry만 확장하면 된다.
 */
export type { AiTextProvider } from './providers/types.js'
export { createOllamaTextProvider } from './providers/ollama-text-provider.js'
export type { OllamaTextProviderOptions } from './providers/ollama-text-provider.js'
export { getAiTextProvider } from './providers/registry.js'

export type { AiSuggestResult, AiToolScrapAiFillResult, ColumnScrapAiFillResult } from './types.js'

export { suggestLinkMeta } from './suggest-link-meta.js'
export { suggestColumnScrapFromUrl } from './suggest-column-scrap.js'
export { suggestAiToolScrapFromUrl } from './suggest-ai-tool-scrap.js'
