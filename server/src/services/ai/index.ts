/**
 * 도메인 AI 제안(링크 메타, 칼럼·도구 스크랩 채우기).
 * 텍스트 생성은 AiTextProvider(Gemini) — registry 참고.
 */
export type { AiTextProvider } from './providers/types.js'
export { createGeminiTextProvider } from './providers/gemini-text-provider.js'
export type { GeminiTextProviderOptions } from './providers/gemini-text-provider.js'
export { getAiTextProvider } from './providers/registry.js'

export type {
  AiSuggestResult,
  AiToolScrapAiFillResult,
  ColumnScrapAiFillResult,
  GameDevResourceAiFillResult,
} from './types.js'

export { suggestLinkMeta } from './suggest-link-meta.js'
export { suggestColumnScrapFromUrl } from './suggest-column-scrap.js'
export { suggestAiToolScrapFromUrl } from './suggest-ai-tool-scrap.js'
export { suggestGameDevResourceFromUrl } from './suggest-game-dev-resource.js'
export {
  suggestTarotReading,
  normalizeTarotCards,
} from './suggest-tarot-reading.js'
