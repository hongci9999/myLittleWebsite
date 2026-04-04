export type AiProviderPublicInfo = {
  mode: 'api' | 'local'
  label: string
}

export type PublicMetaResponse = {
  ai: AiProviderPublicInfo
}

export async function fetchPublicMeta(): Promise<PublicMetaResponse | null> {
  try {
    const res = await fetch('/api/meta')
    if (!res.ok) return null
    return (await res.json()) as PublicMetaResponse
  } catch {
    return null
  }
}
