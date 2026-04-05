import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import {
  listAiToolScraps,
  getAiToolScrapBySlug,
  createAiToolScrap,
  updateAiToolScrap,
  deleteAiToolScrap,
  isSourceKind,
  type SourceKind,
} from '../db/queries/ai-scraps.js'
import { parseAiRequestPreference } from '../services/ai/index.js'
import { suggestAiToolScrapFromUrl } from '../services/ollama.js'
import { YOUTUBE_AI_REQUIRES_TRANSCRIPT_MESSAGE } from '../services/youtube-transcript-text.js'

const router = Router()

function normalizeExtraLinks(raw: unknown): { label: string; url: string }[] {
  if (!Array.isArray(raw)) return []
  const out: { label: string; url: string }[] = []
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue
    const o = x as { label?: unknown; url?: unknown }
    if (typeof o.url !== 'string' || !o.url.trim()) continue
    const label =
      typeof o.label === 'string' && o.label.trim() ? o.label.trim() : '링크'
    out.push({ label, url: o.url.trim() })
  }
  return out
}

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim())
      .filter(Boolean)
  }
  if (typeof raw === 'string') {
    return raw
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
  }
  return []
}

/** GET /api/ai-scraps?q=&kind=&tag= */
router.get('/', async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : undefined
    const kind = req.query.kind ? String(req.query.kind) : undefined
    const tag = req.query.tag ? String(req.query.tag) : undefined
    const items = await listAiToolScraps({
      q,
      kind: kind && isSourceKind(kind) ? kind : undefined,
      tag,
    })
    res.json(items)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list scraps'
    if (msg === 'Supabase not configured') {
      res.status(503).json({
        error: 'Database not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env',
      })
      return
    }
    console.error('[ai-scraps] list error:', err)
    res.status(500).json({ error: 'Failed to list scraps' })
  }
})

/** GET /api/ai-scraps/by-slug/:slug */
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const slug = decodeURIComponent(req.params.slug)
    const item = await getAiToolScrapBySlug(slug)
    if (!item) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json(item)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch scrap'
    if (msg === 'Supabase not configured') {
      res.status(503).json({
        error: 'Database not configured',
      })
      return
    }
    console.error('[ai-scraps] getBySlug error:', err)
    res.status(500).json({ error: 'Failed to fetch scrap' })
  }
})

/** POST /api/ai-scraps/ai-fill — 로컬 Ollama로 URL 기준 폼 필드 제안 (인증 필요) */
router.post('/ai-fill', requireAuth, async (req, res) => {
  try {
    const url = (req.body as { url?: string })?.url?.trim()
    if (!url) {
      res.status(400).json({ error: 'url is required' })
      return
    }
    const pref = parseAiRequestPreference(req.headers, req.body)
    const result = await suggestAiToolScrapFromUrl(url, pref)
    res.json({
      title: result.title,
      summary: result.summary,
      bodyMd: result.bodyMd,
      sourceKind: result.sourceKind,
      tags: result.tags,
      rawResponse: result.rawResponse,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI fill failed'
    if (msg === YOUTUBE_AI_REQUIRES_TRANSCRIPT_MESSAGE) {
      res.status(400).json({ error: msg })
      return
    }
    if (msg.includes('GEMINI_API_KEY') || msg.includes('GOOGLE_AI_API_KEY')) {
      res.status(503).json({
        error: 'API 모드에는 서버에 GEMINI_API_KEY(또는 GOOGLE_AI_API_KEY)가 필요합니다.',
      })
      return
    }
    if (msg.includes('Ollama') || msg.includes('fetch')) {
      res.status(503).json({
        error: 'Ollama를 실행 중인지 확인하세요. (ollama run gemma4)',
      })
      return
    }
    console.error('[ai-scraps] ai-fill error:', err)
    res.status(500).json({ error: msg })
  }
})

/** POST /api/ai-scraps */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const body = req.body as {
      title?: string
      url?: string
      sourceKind?: string
      summary?: string | null
      bodyMd?: string | null
      extraLinks?: unknown
      tags?: unknown
      slug?: string | null
    }
    const title = body.title?.trim()
    const url = body.url?.trim()
    const sk = body.sourceKind?.trim()
    if (!title || !url || !sk || !isSourceKind(sk)) {
      res.status(400).json({
        error: 'title, url, and valid sourceKind are required',
      })
      return
    }
    const item = await createAiToolScrap(authToken, {
      title,
      url,
      sourceKind: sk as SourceKind,
      summary: body.summary,
      bodyMd: body.bodyMd,
      extraLinks: normalizeExtraLinks(body.extraLinks),
      tags: normalizeTags(body.tags),
      slug: body.slug?.trim() || null,
    })
    res.status(201).json(item)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create scrap'
    if (msg === 'Slug already exists') {
      res.status(409).json({ error: msg })
      return
    }
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Auth not configured' })
      return
    }
    console.error('[ai-scraps] create error:', err)
    res.status(500).json({ error: 'Failed to create scrap' })
  }
})

/** PATCH /api/ai-scraps/:id */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const { id } = req.params
    const body = req.body as {
      title?: string
      url?: string
      sourceKind?: string
      summary?: string | null
      bodyMd?: string | null
      extraLinks?: unknown
      tags?: unknown
      slug?: string | null
    }
    const patch: Parameters<typeof updateAiToolScrap>[2] = {}
    if (body.title != null) patch.title = body.title
    if (body.url != null) patch.url = body.url
    if (body.sourceKind != null) {
      if (!isSourceKind(body.sourceKind)) {
        res.status(400).json({ error: 'Invalid sourceKind' })
        return
      }
      patch.sourceKind = body.sourceKind
    }
    if (body.summary !== undefined) patch.summary = body.summary
    if (body.bodyMd !== undefined) patch.bodyMd = body.bodyMd
    if (body.extraLinks !== undefined) patch.extraLinks = normalizeExtraLinks(body.extraLinks)
    if (body.tags !== undefined) patch.tags = normalizeTags(body.tags)
    if (body.slug !== undefined) patch.slug = body.slug

    const item = await updateAiToolScrap(authToken, id, patch)
    res.json(item)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update scrap'
    if (msg === 'Slug already exists') {
      res.status(409).json({ error: msg })
      return
    }
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Auth not configured' })
      return
    }
    console.error('[ai-scraps] update error:', err)
    res.status(500).json({ error: 'Failed to update scrap' })
  }
})

/** DELETE /api/ai-scraps/:id */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const { id } = req.params
    await deleteAiToolScrap(authToken, id)
    res.status(204).send()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete scrap'
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Auth not configured' })
      return
    }
    console.error('[ai-scraps] delete error:', err)
    res.status(500).json({ error: 'Failed to delete scrap' })
  }
})

export default router
