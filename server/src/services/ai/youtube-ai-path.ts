import type { AiRequestPreference } from './providers/registry.js'
import type { AiTextProvider } from './providers/types.js'
import { parseYoutubeVideoId } from '../youtube-transcript-text.js'

export function isYoutubeWatchUrl(url: string): boolean {
  return parseYoutubeVideoId(url.trim()) != null
}

export function aiSupportsYoutubeUrlInput(ai: AiTextProvider): ai is AiTextProvider & {
  completeWithYoutubeUrl: (watchUrl: string, prompt: string) => Promise<string>
} {
  return typeof ai.completeWithYoutubeUrl === 'function'
}

/** API(Gemini) 모드 + YouTube URL → 서버 자막 스크래핑 없이 Gemini 영상 입력 */
export function shouldUseGeminiYoutubeColumnPath(
  preference: AiRequestPreference,
  url: string,
  ai: AiTextProvider
): boolean {
  return (
    preference === 'api' &&
    isYoutubeWatchUrl(url) &&
    aiSupportsYoutubeUrlInput(ai)
  )
}

/**
 * 칼럼 스크랩 라우팅용 — `api` + watch URL이면 Gemini YouTube 경로.
 * (구 EB 빌드에서 `aiSupportsYoutubeUrlInput`만 false인 경우에도 API 의도를 존중)
 */
export function isColumnScrapGeminiYoutubeRequest(
  preference: AiRequestPreference,
  url: string
): boolean {
  return preference === 'api' && isYoutubeWatchUrl(url)
}
