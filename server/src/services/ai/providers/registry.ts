import type { IncomingHttpHeaders } from 'http'
import { createGeminiTextProvider } from './gemini-text-provider.js'
import {
  createOllamaTextProvider,
  DEFAULT_OLLAMA_MODEL,
} from './ollama-text-provider.js'
import type { AiTextProvider } from './types.js'

/** 클라이언트·요청 단위 AI 경로. 기본은 로컬(Ollama). */
export type AiRequestPreference = 'local' | 'api'

let cachedOllama: AiTextProvider | null = null
let cachedGemini: AiTextProvider | null = null

function getOllamaCached(): AiTextProvider {
  if (!cachedOllama) cachedOllama = createOllamaTextProvider()
  return cachedOllama
}

function getGeminiCached(): AiTextProvider {
  if (!cachedGemini) cachedGemini = createGeminiTextProvider()
  return cachedGemini
}

/**
 * 요청별 텍스트 제공자. `X-AI-Provider: api` → Gemini, 그 외·누락 → Ollama(로컬).
 */
export function getAiTextProvider(preference: AiRequestPreference): AiTextProvider {
  if (preference === 'api') return getGeminiCached()
  return getOllamaCached()
}

/**
 * 헤더 `X-AI-Provider` 우선, 없거나 비어 있으면 JSON `aiProvider` (`local` | `api`).
 * 프록시가 커스텀 헤더를 누락하는 경우에도 본문으로 로컬/API를 맞출 수 있다.
 */
export function parseAiRequestPreference(
  headers: IncomingHttpHeaders,
  body?: unknown
): AiRequestPreference {
  const raw = headers['x-ai-provider']
  const v = Array.isArray(raw) ? raw[0] : raw
  if (typeof v === 'string') {
    const h = v.trim().toLowerCase()
    if (h === 'api') return 'api'
    if (h === 'local') return 'local'
  }

  if (body && typeof body === 'object' && body !== null && !Array.isArray(body)) {
    const p = (body as { aiProvider?: unknown }).aiProvider
    if (typeof p === 'string') {
      const q = p.trim().toLowerCase()
      if (q === 'api') return 'api'
      if (q === 'local') return 'local'
    }
  }

  return 'local'
}

export type AiProviderPublicInfo = {
  mode: 'api' | 'local'
  /** 짧은 설명 (모델·호스트 힌트) */
  label: string
}

/** 헤더 전광판(클라이언트 AiStatusTicker)에 나가는 로컬 모드 한 줄 문구 */
function buildLocalPublicInfo(): AiProviderPublicInfo {
  const model = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL
  const host = (process.env.OLLAMA_HOST ?? 'http://localhost:11434').replace(/^https?:\/\//, '')
  return {
    mode: 'local',
    label: `Ollama · ${model} @ ${host}`,
  }
}

/** 헤더 전광판에 나가는 API(Gemini) 모드 한 줄 문구 */
function buildApiPublicInfo(): AiProviderPublicInfo {
  const model =
    process.env.GEMINI_MODEL?.trim() ||
    'gemini-3.1-flash-lite-preview'
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY
  return {
    mode: 'api',
    label: key?.trim() ? `Gemini · ${model}` : `Gemini(키 없음) · ${model}`,
  }
}

/**
 * `GET /api/meta` 응답의 `ai` — 헤더 전광판·제공자 드롭다운에 쓰는 `label` 원본
 */
export function getAiProviderOptionsMeta(): {
  local: AiProviderPublicInfo
  api: AiProviderPublicInfo
} {
  return {
    local: buildLocalPublicInfo(),
    api: buildApiPublicInfo(),
  }
}
