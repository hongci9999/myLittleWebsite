/**
 * 스크랩 원문 추출 — 유튜브 자막 / GitHub README / 웹페이지 본문 (길이 제한 없음).
 * 백필 스크립트(`scripts/backfill-sources.ts`)와 MCP `get_source` 실시간 폴백이 같이 쓴다.
 */
import { fetchWebsiteContent } from '../fetch-website.js'
import { fetchYoutubeContentBundle } from '../youtube-content.js'
import { parseYoutubeVideoId } from '../youtube-transcript-text.js'
import { fetchYoutubeGeminiDigest } from '../ai/youtube-ai-path.js'

export type SourceKind = 'transcript' | 'readme' | 'page' | 'ai-digest'

export interface SourceText {
  kind: SourceKind
  text: string
}

async function fetchGithubReadme(owner: string, repo: string): Promise<string | null> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: {
      Accept: 'application/vnd.github.raw',
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
    signal: AbortSignal.timeout(10000),
  })
  return res.ok ? res.text() : null
}

/**
 * `allowAiDigest`: 자막을 못 받으면(Vercel IP 차단) Gemini가 영상을 보고 만든 요약으로 대신한다.
 * 백필에선 끈다 — 저장소엔 진짜 원문만 둔다.
 */
export async function fetchSourceText(
  url: string,
  { allowAiDigest = false } = {}
): Promise<SourceText | null> {
  if (parseYoutubeVideoId(url)) {
    const bundle = await fetchYoutubeContentBundle(url, Infinity)
    if (bundle) return { kind: 'transcript', text: bundle.transcript }
    if (!allowAiDigest) return null
    const digest = await fetchYoutubeGeminiDigest(url)
    return digest ? { kind: 'ai-digest', text: digest } : null
  }

  const gh = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)\/?$/)
  if (gh) {
    const readme = await fetchGithubReadme(gh[1], gh[2].replace(/\.git$/, ''))
    if (readme) return { kind: 'readme', text: readme }
  }

  const page = await fetchWebsiteContent(url, Infinity)
  return page?.bodyText ? { kind: 'page', text: page.bodyText } : null
}
