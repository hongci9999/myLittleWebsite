import { createOllamaTextProvider } from './ollama-text-provider.js'
import type { AiTextProvider } from './types.js'

let cached: AiTextProvider | null = null

/**
 * 기본 텍스트 제공자. 추후 AI_PROVIDER=openai 등으로 분기 가능.
 */
export function getAiTextProvider(): AiTextProvider {
  if (!cached) {
    cached = createOllamaTextProvider()
  }
  return cached
}
