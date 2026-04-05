import { Router } from 'express'
import { DEFAULT_OLLAMA_MODEL } from '../services/ai/providers/ollama-text-provider.js'

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

export default router
