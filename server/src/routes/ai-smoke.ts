import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  createGeminiTextProvider,
  resolveGeminiYoutubeModel,
} from '../services/ai/providers/gemini-text-provider.js'
import { DEFAULT_OLLAMA_MODEL } from '../services/ai/providers/ollama-text-provider.js'
import { parseYoutubeVideoId } from '../services/youtube-transcript-text.js'

const router = Router()

function normalizeHost(raw: string): string {
  return raw.replace(/\/$/, '')
}

function modelBaseName(model: string): string {
  const i = model.indexOf(':')
  return i === -1 ? model : model.slice(0, i)
}

/**
 * GET /api/ai-smoke/local
 * Ollama `/api/tags`로 연결 확인 후, 설정 모델로 짧은 `/api/generate` 1회.
 * (로컬 개발용 공개 엔드포인트 — 배포 시 방화벽·경로 숨김 검토)
 */
router.get('/local', async (_, res) => {
  const host = normalizeHost(process.env.OLLAMA_HOST ?? 'http://localhost:11434')
  const model = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL
  const base = modelBaseName(model)

  const payload: Record<string, unknown> = {
    ok: false,
    ollamaHost: host,
    modelConfigured: model,
    steps: {} as Record<string, unknown>,
  }

  try {
    const tagsRes = await fetch(`${host}/api/tags`)
    ;(payload.steps as Record<string, unknown>).tags = {
      httpStatus: tagsRes.status,
      ok: tagsRes.ok,
    }
    if (!tagsRes.ok) {
      const t = await tagsRes.text()
      return res.status(503).json({
        ...payload,
        error: 'Ollama /api/tags 실패',
        detail: t.slice(0, 400),
      })
    }

    const tagsJson = (await tagsRes.json()) as { models?: { name?: string }[] }
    const names = (tagsJson.models ?? [])
      .map((m) => m.name)
      .filter((n): n is string => typeof n === 'string' && n.length > 0)
    payload.installedModelNames = names

    const resolvedModel =
      names.find((n) => n === model) ??
      names.find((n) => n.startsWith(`${base}:`)) ??
      names.find((n) => modelBaseName(n) === base)

    if (!resolvedModel) {
      return res.status(200).json({
        ...payload,
        error: '설정한 모델이 Ollama 목록에 없음',
        hint: `ollama pull ${model}`,
      })
    }
    payload.modelResolved = resolvedModel

    const genRes = await fetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: resolvedModel,
        prompt: 'Reply with exactly one word: OK',
        stream: false,
      }),
    })
    const genText = await genRes.text()
    ;(payload.steps as Record<string, unknown>).generate = {
      httpStatus: genRes.status,
      ok: genRes.ok,
    }

    if (!genRes.ok) {
      return res.status(503).json({
        ...payload,
        error: 'Ollama /api/generate 실패',
        detail: genText.slice(0, 400),
      })
    }

    let preview = ''
    try {
      const genJson = JSON.parse(genText) as { response?: string }
      preview = (genJson.response ?? '').trim().slice(0, 200)
    } catch {
      preview = genText.slice(0, 200)
    }

    return res.json({
      ...payload,
      ok: true,
      generateResponsePreview: preview,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return res.status(503).json({
      ...payload,
      error: 'Ollama에 연결하지 못함',
      detail: msg,
    })
  }
})

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
