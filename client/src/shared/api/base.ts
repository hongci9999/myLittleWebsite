const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''

/** 비어 있으면 same-origin(`/api/...`), 설정되면 절대 URL로 API를 호출한다. */
export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '')

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return API_BASE_URL ? `${API_BASE_URL}${normalized}` : normalized
}
