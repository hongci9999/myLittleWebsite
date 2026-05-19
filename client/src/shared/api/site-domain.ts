import { apiUrl } from '@/shared/api/base'
import type { SiteDomainDatesInput } from '@/shared/lib/domain-expiry'

const API_BASE = apiUrl('/api/site-domain')

export type SiteDomainSettings = SiteDomainDatesInput & {
  source: 'database' | 'config'
  updatedAt?: string
}

export async function fetchSiteDomainSettings(): Promise<SiteDomainSettings> {
  const res = await fetch(API_BASE)
  if (!res.ok) {
    throw new Error('도메인 설정을 불러오지 못했습니다')
  }
  return res.json() as Promise<SiteDomainSettings>
}

export async function renewSiteDomainSettings(
  token: string
): Promise<SiteDomainSettings> {
  const res = await fetch(`${API_BASE}/renew`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? '도메인 연장 반영에 실패했습니다')
  }
  return res.json() as Promise<SiteDomainSettings>
}
