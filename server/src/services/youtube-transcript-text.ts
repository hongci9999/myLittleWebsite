import { createRequire } from 'node:module'

/** tsx 엔트리 실행 시 패키지 main(CJS)이 잡혀 named ESM import가 실패하므로 require로 로드 */
const require = createRequire(import.meta.url)
const { fetchTranscript } = require('youtube-transcript') as {
  fetchTranscript: (
    videoId: string,
    config?: { lang?: string; fetch?: typeof fetch }
  ) => Promise<Array<{ text: string; duration: number; offset: number; lang?: string }>>
}

/** AI 제안 API가 클라이언트에 그대로 넘길 메시지 */
export const YOUTUBE_AI_REQUIRES_TRANSCRIPT_MESSAGE =
  '이 동영상은 자막을 가져올 수 없어 AI 제안을 실행할 수 없습니다. 자막이 켜진 영상인지 확인하거나 수동으로 입력해 주세요.'

/** 유튜브인데 자막이 없거나(fetch 실패로) 콘텐츠가 없으면 AI 제안을 중단한다. */
export function assertYoutubeTranscriptForAi(
  url: string,
  content: { youtubeMissingTranscript?: boolean } | null
): void {
  if (!parseYoutubeVideoId(url.trim())) return
  if (!content || content.youtubeMissingTranscript) {
    throw new Error(YOUTUBE_AI_REQUIRES_TRANSCRIPT_MESSAGE)
  }
}

/** 클라이언트 `parseYoutubeVideoId`와 동일 규칙 (서버 전용) */
export function parseYoutubeVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim())
    const h = u.hostname.replace(/^www\./, '')
    if (h === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id && /^[\w-]{6,}$/.test(id) ? id : null
    }
    if (h === 'youtube.com' || h === 'm.youtube.com') {
      if (u.pathname === '/watch' || u.pathname.startsWith('/watch')) {
        const v = u.searchParams.get('v')
        return v && /^[\w-]{6,}$/.test(v) ? v : null
      }
      if (u.pathname.startsWith('/embed/')) {
        const id = u.pathname.split('/')[2]
        return id && /^[\w-]{6,}$/.test(id) ? id : null
      }
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.split('/')[2]
        return id && /^[\w-]{6,}$/.test(id) ? id : null
      }
    }
  } catch {
    return null
  }
  return null
}

const MAX_TRANSCRIPT_CHARS = 12_000

/**
 * 유튜브 자막이 있으면 평문으로 반환. 없거나 실패 시 null (호출부에서 HTML 폴백).
 */
export async function tryFetchYoutubeTranscriptPlain(videoUrl: string): Promise<string | null> {
  const id = parseYoutubeVideoId(videoUrl)
  if (!id) return null
  try {
    const chunks = await fetchTranscript(videoUrl.trim(), { fetch })
    let t = chunks.map((c) => c.text).join(' ').replace(/\s+/g, ' ').trim()
    if (!t) return null
    if (t.length > MAX_TRANSCRIPT_CHARS) {
      t = t.slice(0, MAX_TRANSCRIPT_CHARS) + '...'
    }
    return t
  } catch {
    return null
  }
}
