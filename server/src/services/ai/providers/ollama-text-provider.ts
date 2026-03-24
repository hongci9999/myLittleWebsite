import type { AiTextProvider } from './types.js'

export type OllamaTextProviderOptions = {
  host?: string
  model?: string
}

/**
 * Ollama HTTP /api/generate (비스트리밍)
 */
export function createOllamaTextProvider(options?: OllamaTextProviderOptions): AiTextProvider {
  const host = options?.host ?? process.env.OLLAMA_HOST ?? 'http://localhost:11434'
  const model = options?.model ?? process.env.OLLAMA_MODEL ?? 'lfm2:24b'

  return {
    async complete(prompt: string): Promise<string> {
      const res = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Ollama request failed: ${res.status} ${text}`)
      }
      const data = (await res.json()) as { response?: string }
      return (data.response ?? '').trim()
    },
  }
}
