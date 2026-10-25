import { reportProgress } from '../../progress.js'
import { geminiGenerateContent } from './gemini-generate.js'
import type { AiTextProvider } from './types.js'

export type GeminiTextProviderOptions = {
  apiKey?: string
  model?: string
  /** YouTube URL 멀티모달용 (미설정 시 GEMINI_MODEL → gemini-2.5-flash) */
  youtubeModel?: string
}

/** YouTube watch URL 입력에 쓸 모델 — 2.5+ 권장 */
export function resolveGeminiYoutubeModel(options?: GeminiTextProviderOptions): string {
  return (
    options?.youtubeModel?.trim() ||
    process.env.GEMINI_YOUTUBE_MODEL?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    'gemini-2.5-flash'
  )
}

/** 일반 텍스트 생성 모델 */
export function resolveGeminiTextModel(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite'
}

/**
 * Google AI Studio / Gemini API — generateContent (비스트리밍)
 * @see https://ai.google.dev/api/rest/v1beta/models.generateContent
 * @see https://ai.google.dev/gemini-api/docs/video-understanding#youtube
 */
export function createGeminiTextProvider(
  options?: GeminiTextProviderOptions
): AiTextProvider {
  const apiKey =
    options?.apiKey ??
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_AI_API_KEY
  const model =
    options?.model ?? resolveGeminiTextModel()
  const youtubeModel = resolveGeminiYoutubeModel(options)

  async function completeWithParts(
    parts: Parameters<typeof geminiGenerateContent>[2],
    modelId: string
  ): Promise<string> {
    if (!apiKey?.trim()) {
      throw new Error('Gemini: GEMINI_API_KEY or GOOGLE_AI_API_KEY is not set')
    }
    const started = Date.now()
    const text = await geminiGenerateContent(apiKey, modelId, parts)
    reportProgress(`  ↳ ${modelId} 응답 (${((Date.now() - started) / 1000).toFixed(1)}초)`)
    return text
  }

  return {
    async complete(prompt: string): Promise<string> {
      return completeWithParts([{ text: prompt }], model)
    },

    async completeWithYoutubeUrl(watchUrl: string, prompt: string): Promise<string> {
      const trimmed = watchUrl.trim()
      return completeWithParts(
        [{ file_data: { file_uri: trimmed } }, { text: prompt }],
        youtubeModel
      )
    },
  }
}
