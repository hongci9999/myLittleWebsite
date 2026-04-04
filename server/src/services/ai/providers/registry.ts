import { createGeminiTextProvider } from './gemini-text-provider.js'
import { createOllamaTextProvider } from './ollama-text-provider.js'
import type { AiTextProvider } from './types.js'

let cached: AiTextProvider | null = null

function createProviderFromEnv(): AiTextProvider {
  const kind = (process.env.AI_TEXT_PROVIDER ?? 'ollama').toLowerCase()
  if (kind === 'google' || kind === 'gemini') {
    const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY
    if (!key?.trim()) {
      throw new Error(
        'AI_TEXT_PROVIDER is google/gemini but GEMINI_API_KEY (or GOOGLE_AI_API_KEY) is missing'
      )
    }
    return createGeminiTextProvider()
  }
  return createOllamaTextProvider()
}

/**
 * 기본 텍스트 제공자. `AI_TEXT_PROVIDER=ollama`(기본) | `google` | `gemini`
 */
export function getAiTextProvider(): AiTextProvider {
  if (!cached) {
    cached = createProviderFromEnv()
  }
  return cached
}

/** 공개 메타(헤더 표시용). 환경 변수만 읽고 프로바이더 인스턴스는 만들지 않는다. */
export type AiProviderPublicInfo = {
  mode: 'api' | 'local'
  /** 짧은 설명 (모델·호스트 힌트) */
  label: string
}

export function getAiProviderPublicInfo(): AiProviderPublicInfo {
  const kind = (process.env.AI_TEXT_PROVIDER ?? 'ollama').toLowerCase()
  if (kind === 'google' || kind === 'gemini') {
    const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
    const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY
    return {
      mode: 'api',
      label: key?.trim() ? `Gemini · ${model}` : `Gemini(키 없음) · ${model}`,
    }
  }
  const model = process.env.OLLAMA_MODEL ?? 'lfm2:24b'
  const host = (process.env.OLLAMA_HOST ?? 'http://localhost:11434').replace(/^https?:\/\//, '')
  return {
    mode: 'local',
    label: `Ollama · ${model} @ ${host}`,
  }
}
