/**
 * 링크·스크랩 AI 제안 진입점 (라우트 import 경로 유지).
 * 실제 로직·프롬프트·제공자 추상화는 `./ai/` 참고.
 */
export {
  suggestAiToolScrapFromUrl,
  suggestColumnScrapFromUrl,
  suggestLinkMeta,
  type AiSuggestResult,
  type AiToolScrapAiFillResult,
  type ColumnScrapAiFillResult,
} from './ai/index.js'
