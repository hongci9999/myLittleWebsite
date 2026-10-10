import { parseYoutubeVideoId } from '../youtube-transcript-text.js'
import { createGeminiTextProvider } from './providers/gemini-text-provider.js'

export function isYoutubeWatchUrl(url: string): boolean {
  return parseYoutubeVideoId(url.trim()) != null
}

const GEMINI_YOUTUBE_DIGEST_PROMPT = `이 유튜브 영상을 직접 보고 아래 형식으로 한국어로 작성하세요. 이 결과는 자막 대신 다음 단계 AI 정리의 근거로 쓰입니다.

제목: (영상 제목)
채널: (채널명, 모르면 비움)

영상 내용:
(영상에서 실제로 말하고 보여준 내용을 시간 순서대로 최대한 자세히. 요약하지 말고 발언·설명·예시·수치·코드·도구 이름을 빠짐없이 옮길 것. 추측은 쓰지 말 것.)`

/**
 * 서버 자막 fetch가 막혔을 때(클라우드 IP 차단) Gemini가 영상 URL을 직접 보고 자막 대체 텍스트를 만든다.
 * Gemini 키가 없거나 실패하면 null — 호출부는 기존처럼 자막 없음으로 처리.
 */
export async function fetchYoutubeGeminiDigest(watchUrl: string): Promise<string | null> {
  const id = parseYoutubeVideoId(watchUrl.trim())
  if (!id) return null
  try {
    const text = await createGeminiTextProvider().completeWithYoutubeUrl!(
      `https://www.youtube.com/watch?v=${id}`,
      GEMINI_YOUTUBE_DIGEST_PROMPT
    )
    return text.trim().length > 40 ? text.trim() : null
  } catch (e) {
    console.error('[youtube] gemini digest failed', e instanceof Error ? e.message : e)
    return null
  }
}
