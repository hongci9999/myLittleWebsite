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
