import { apiUrl } from '@/shared/api/base'

const API_BASE = apiUrl('/api/bootcamp')

/** 현대오토에버 부트캠프 기록 (DB bootcamp_docs). slug 'index' = 과정 소개 */
export type BootcampDoc = {
  slug: string
  title: string
  date: string | null
  summary: string | null
  tags: string[]
  bodyMd: string
  sortOrder: number
}

export type BootcampDocSummary = Omit<BootcampDoc, 'bodyMd'>

export async function fetchBootcampDocs(): Promise<BootcampDocSummary[]> {
  const res = await fetch(API_BASE)
  if (!res.ok) throw new Error('기록 목록을 불러오지 못했습니다')
  return (await res.json()) as BootcampDocSummary[]
}

export async function fetchBootcampDoc(slug: string): Promise<BootcampDoc | null> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(slug)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('기록을 불러오지 못했습니다')
  return (await res.json()) as BootcampDoc
}
