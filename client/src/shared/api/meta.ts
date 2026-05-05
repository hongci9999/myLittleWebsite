import { apiUrl } from '@/shared/api/base'
export type AiProviderPublicInfo = {
  mode: 'api' | 'local'
  label: string
}

export type PublicMetaResponse = {
  ai: {
    local: AiProviderPublicInfo
    api: AiProviderPublicInfo
  }
}

export async function fetchPublicMeta(): Promise<PublicMetaResponse | null> {
  try {
    const res = await fetch(apiUrl('/api/meta'))
    if (!res.ok) return null
    return (await res.json()) as PublicMetaResponse
  } catch {
    return null
  }
}

