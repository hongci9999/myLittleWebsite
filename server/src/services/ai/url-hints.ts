import type { ColumnSourceKind } from '../../db/queries/column-scraps.js'
import type { SourceKind as AiScrapSourceKind } from '../../db/queries/ai-scraps.js'

/** URL 호스트·경로로 칼럼 스크랩 형식 힌트 (AI·폴백용) */
export function inferColumnSourceKindFromUrl(urlStr: string): ColumnSourceKind {
  let u: URL
  try {
    u = new URL(urlStr.trim())
  } catch {
    return 'other'
  }
  const host = u.hostname.replace(/^www\./, '').toLowerCase()
  const path = u.pathname.toLowerCase()

  if (host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com')) {
    return 'youtube'
  }
  if (host === 'x.com' || host === 'twitter.com') {
    return 'x'
  }
  if (host === 'github.com') {
    if (
      path.includes('/blob/') ||
      path.includes('/tree/') ||
      path.endsWith('.md') ||
      path.includes('readme')
    ) {
      return 'readme'
    }
  }
  if (
    host.includes('velog') ||
    host === 'medium.com' ||
    host.includes('tistory') ||
    host.includes('brunch.co.kr')
  ) {
    return 'blog'
  }
  return 'article'
}

/** X/트위터는 로그인·JS 페이지라 fetch 시 오류 안내 HTML만 옴 → 본문 분석에 쓰지 않음 */
export function isXOrTwitterHost(urlStr: string): boolean {
  try {
    const host = new URL(urlStr.trim()).hostname.replace(/^www\./, '').toLowerCase()
    return host === 'x.com' || host === 'twitter.com'
  } catch {
    return false
  }
}

/** /user/status/123 → user */
export function xStatusHandleFromUrl(urlStr: string): string | null {
  try {
    const u = new URL(urlStr.trim())
    if (!isXOrTwitterHost(urlStr)) return null
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length >= 2 && parts[1].toLowerCase() === 'status' && /^[A-Za-z0-9_]{1,15}$/.test(parts[0])) {
      return parts[0]
    }
    if (parts.length >= 1 && /^[A-Za-z0-9_]{1,15}$/.test(parts[0])) {
      return parts[0]
    }
    return null
  } catch {
    return null
  }
}

/** URL 힌트 → AI 도구 스크랩 sourceKind */
export function inferAiToolSourceKindFromUrl(urlStr: string): AiScrapSourceKind {
  try {
    const u = new URL(urlStr.trim())
    const host = u.hostname.replace(/^www\./, '').toLowerCase()
    const path = u.pathname.toLowerCase()
    if (host === 'github.com' || host === 'gitlab.com' || host === 'codeberg.org') {
      return 'repo'
    }
    if (host.includes('modelcontextprotocol') || path.includes('/mcp')) {
      return 'mcp'
    }
    if (host === 'cursor.com' || host.endsWith('.cursor.com')) {
      return 'rules'
    }
    if (
      host.includes('agentskills') ||
      path.includes('/skills/') ||
      path.endsWith('skill.md') ||
      (host.includes('openai.com') && path.includes('skills'))
    ) {
      return 'skill'
    }
    if (host === 'npmjs.com' || host === 'www.npmjs.com') {
      return 'cli'
    }
    if (host === 'youtu.be' || host.includes('youtube.com')) {
      return 'doc'
    }
    return 'doc'
  } catch {
    return 'other'
  }
}
