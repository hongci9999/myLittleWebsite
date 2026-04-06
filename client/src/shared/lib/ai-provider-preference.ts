/** AI 제안 요청 시 서버가 사용할 텍스트 제공자. localStorage + X-AI-Provider 헤더와 동기화 */

export const AI_PROVIDER_HEADER = 'X-AI-Provider'

export type AiProviderPreference = 'local' | 'api'

const STORAGE_KEY = 'mlw-ai-provider-preference'

export function getAiProviderPreference(): AiProviderPreference {
  if (typeof window === 'undefined') return 'local'
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'api') return 'api'
  } catch {
    /* private mode 등 */
  }
  return 'local'
}

export function setAiProviderPreference(p: AiProviderPreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, p)
  } catch {
    /* ignore */
  }
}

/** 인증된 AI API fetch에 함께 넣을 헤더 */
export function aiProviderRequestHeaders(): Record<string, string> {
  return { [AI_PROVIDER_HEADER]: getAiProviderPreference() }
}

/** POST JSON 본문에 넣을 필드 (헤더가 프록시에서 빠져도 서버가 제공자 인식) */
export function aiProviderBodyField(): { aiProvider: AiProviderPreference } {
  return { aiProvider: getAiProviderPreference() }
}
