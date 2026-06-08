import { apiUrl } from '@/shared/api/base'

const API_BASE = apiUrl('/api/tech-interview')

export type TechInterviewRandomDoc = {
  path: string
  category: string
  title: string
  content: string
  githubUrl: string
}

/** 캐시 없음 — 페이지 새로고침·다른 문서 버튼마다 새 요청 */
export async function fetchRandomTechInterviewDoc(): Promise<TechInterviewRandomDoc | null> {
  const res = await fetch(`${API_BASE}/random`)
  if (!res.ok) return null
  return (await res.json()) as TechInterviewRandomDoc
}
