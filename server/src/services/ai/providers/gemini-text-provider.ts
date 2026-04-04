import type { AiTextProvider } from './types.js'

export type GeminiTextProviderOptions = {
  apiKey?: string
  model?: string
}

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
  }>
  error?: { message?: string; code?: number }
}

/**
 * Google AI Studio / Gemini API — generateContent (비스트리밍)
 * @see https://ai.google.dev/api/rest/v1beta/models.generateContent
 */
export function createGeminiTextProvider(
  options?: GeminiTextProviderOptions
): AiTextProvider {
  const apiKey =
    options?.apiKey ??
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_AI_API_KEY
  const model =
    options?.model ??
    process.env.GEMINI_MODEL ??
    'gemini-3.1-flash-lite-preview'

  return {
    async complete(prompt: string): Promise<string> {
      if (!apiKey?.trim()) {
        throw new Error(
          'Gemini: GEMINI_API_KEY or GOOGLE_AI_API_KEY is not set'
        )
      }
      const url = new URL(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
      )
      url.searchParams.set('key', apiKey.trim())

      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      })

      const data = (await res.json()) as GeminiGenerateResponse
      if (!res.ok) {
        const msg = data.error?.message ?? (await res.text())
        throw new Error(`Gemini request failed: ${res.status} ${msg}`)
      }

      const text =
        data.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? '')
          .join('') ?? ''
      return text.trim()
    },
  }
}
