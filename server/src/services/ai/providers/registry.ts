import { createGeminiTextProvider } from './gemini-text-provider.js'
import type { AiTextProvider } from './types.js'

let cached: AiTextProvider | null = null

/** 텍스트 제공자 — Gemini 하나 (로컬 Ollama 선택지는 2026-10 제거) */
export function getAiTextProvider(): AiTextProvider {
  if (!cached) cached = createGeminiTextProvider()
  return cached
}
