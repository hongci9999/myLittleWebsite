import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  createGeminiTextProvider,
  resolveGeminiYoutubeModel,
} from '../services/ai/providers/gemini-text-provider.js'
import { parseYoutubeVideoId } from '../services/youtube-transcript-text.js'

const router = Router()

const GEMINI_YOUTUBE_SMOKE_PROMPT = `이 유튜브 영상을 보고 한국어로 답하세요.
1. 영상 제목과 채널(알 수 있으면)
2. 핵심 내용 3~5줄 요약
3. 영상에서 실제로 말한 문장 1~2개 인용 (자막·음성을 실제로 읽었는지 확인용)`

/**
 * POST /api/ai-smoke/gemini-youtube  { url }
 * 서버 자막 fetch 없이 Gemini가 YouTube URL을 직접 분석할 수 있는지 확인 (임시 점검용).
 * Gemini 비용이 드므로 로그인 필요.
 */
router.post('/gemini-youtube', requireAuth, async (req, res) => {
  const raw = String((req.body as { url?: unknown })?.url ?? '').trim()
  const videoId = parseYoutubeVideoId(raw)
  if (!videoId) {
    return res.status(400).json({ ok: false, error: '유튜브 URL을 인식하지 못함', input: raw })
  }
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`
  const model = resolveGeminiYoutubeModel()
  const started = Date.now()
  try {
    const text = await createGeminiTextProvider().completeWithYoutubeUrl!(
      watchUrl,
      GEMINI_YOUTUBE_SMOKE_PROMPT
    )
    return res.json({ ok: true, watchUrl, model, ms: Date.now() - started, text })
  } catch (e) {
    return res.status(502).json({
      ok: false,
      watchUrl,
      model,
      ms: Date.now() - started,
      error: e instanceof Error ? e.message : String(e),
    })
  }
})

export default router
