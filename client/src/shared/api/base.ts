const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''

/** 비어 있으면 same-origin(`/api/...`), 설정되면 절대 URL로 API를 호출한다. */
export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '')

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return API_BASE_URL ? `${API_BASE_URL}${normalized}` : normalized
}

/**
 * 학습 마크다운 fetch URL.
 * `/learnings/*` 는 Vite public → CloudFront 정적 파일이므로 API 베이스를 붙이지 않는다.
 */
export function learningMarkdownUrl(basePath: string, filePath: string): string {
  const base = basePath.replace(/\/$/, '')
  const file = filePath.replace(/^\//, '')
  const path = `${base}/${file}`
  if (base.startsWith('/learnings/')) {
    return path.startsWith('/') ? path : `/${path}`
  }
  return apiUrl(path)
}
