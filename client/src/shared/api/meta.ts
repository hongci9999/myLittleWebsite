import { apiUrl } from '@/shared/api/base'

export type PublicMetaResponse = {
  ai: {
    /** 일반 텍스트 생성(요약·필드 채우기) */
    model: string
    /** 자막이 막혔을 때 영상 직접 분석 */
    youtubeModel: string
    keyConfigured: boolean
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
