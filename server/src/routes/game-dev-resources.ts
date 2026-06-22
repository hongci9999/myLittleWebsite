import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import {
  listGameDevResources,
  getGameDevResourceBySlug,
  createGameDevResource,
  updateGameDevResource,
  deleteGameDevResource,
  isMediaKind,
  isCategory,
  type MediaKind,
  type Category,
} from '../db/queries/game-dev-resources.js'
import { parseAiRequestPreference } from '../services/ai/index.js'
import { suggestGameDevResourceFromUrl } from '../services/ollama.js'
import { OBSIDIAN_YOUTUBE_CLIP_PARSE_ERROR } from '../services/parse-obsidian-youtube-clip.js'
import { YOUTUBE_AI_REQUIRES_TRANSCRIPT_MESSAGE } from '../services/youtube-transcript-text.js'

const router = Router()

function normalizeExtraLinks(raw: unknown): { label: string; url: string }[] {
  if (!Array.isArray(raw)) return []
  const out: { label: string; url: string }[] = []
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue
    const o = x as { label?: unknown; url?: unknown }
    if (typeof o.url !== 'string' || !o.url.trim()) continue
    const label = typeof o.label === 'string' && o.label.trim() ? o.label.trim() : '링크'
    out.push({ label, url: o.url.trim() })
  }
  return out
}

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((t): t is string => typeof t === 'string').map((t) => t.trim()).filter(Boolean)
  }
  if (typeof raw === 'string') {
    return raw.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
  }
  return []
}

/** GET /api/game-dev-resources?q=&kind=&category= */
router.get('/', async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : undefined
    const kind = req.query.kind ? String(req.query.kind) : undefined
    const category = req.query.category ? String(req.query.category) : undefined
    const items = await listGameDevResources({
      q,
      kind: kind && isMediaKind(kind) ? kind : undefined,
      category: category && isCategory(category) ? category : undefined,
    })
    res.json(items)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list resources'
    if (msg === 'Supabase not configured') {
      res.status(503).json({
        error: 'Database not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env',
      })
      return
    }
    console.error('[game-dev] list error:', err)
    res.status(500).json({ error: 'Failed to list resources' })
  }
})

/** GET /api/game-dev-resources/by-slug/:slug */
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const slug = decodeURIComponent(req.params.slug)
    const item = await getGameDevResourceBySlug(slug)
    if (!item) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json(item)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch resource'
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Database not configured' })
      return
    }
    console.error('[game-dev] getBySlug error:', err)
    res.status(500).json({ error: 'Failed to fetch resource' })
  }
})

/** POST /api/game-dev-resources/ai-fill — URL 또는 Obsidian 클립 기준 폼 필드 제안 (인증 필요) */
router.post('/ai-fill', requireAuth, async (req, res) => {
  try {
    const body = req.body as { url?: string; youtubeClip?: string }
    const youtubeClip = body.youtubeClip?.trim()
    const url = body.url?.trim()
    if (!url && !youtubeClip) {
      res.status(400).json({
        error: '원문 URL 또는 Obsidian YouTube 클립(youtubeClip)이 필요합니다.',
      })
      return
    }
    const pref = parseAiRequestPreference(req.headers, req.body)
    const result = await suggestGameDevResourceFromUrl(url ?? '', pref, {
      youtubeClip,
    })
    res.json({
      title: result.title,
      summary: result.summary,
      bodyMd: result.bodyMd,
      mediaKind: result.mediaKind,
      category: result.category,
      coverImageUrl: result.coverImageUrl,
      tags: result.tags,
      rawResponse: result.rawResponse,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI fill failed'
    if (msg === OBSIDIAN_YOUTUBE_CLIP_PARSE_ERROR) {
      res.status(400).json({ error: msg })
      return
    }
    if (msg === YOUTUBE_AI_REQUIRES_TRANSCRIPT_MESSAGE) {
      const pref = parseAiRequestPreference(req.headers, req.body)
      console.error('[game-dev] ai-fill transcript required', {
        resolvedPreference: pref,
        headerAiProvider: req.headers['x-ai-provider'],
        bodyAiProvider: (req.body as { aiProvider?: string })?.aiProvider,
        url: (req.body as { url?: string })?.url?.slice(0, 120),
      })
      res.status(400).json({
        error: msg,
        resolvedPreference: pref,
        hint: '자막이 켜진 공개 영상인지 확인하세요. 한국어·영어 자막이 없으면 AI 제안을 사용할 수 없습니다.',
      })
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
    console.error('[game-dev] ai-fill error:', err)
    res.status(500).json({ error: msg })
  }
})

/** POST /api/game-dev-resources */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const body = req.body as {
      title?: string; url?: string; mediaKind?: string; category?: string
      summary?: string | null; bodyMd?: string | null; coverImageUrl?: string | null
      extraLinks?: unknown; tags?: unknown; slug?: string | null
    }
    const title = body.title?.trim()
    const url = body.url?.trim()
    const mk = body.mediaKind?.trim()
    if (!title || !url || !mk || !isMediaKind(mk)) {
      res.status(400).json({ error: 'title, url, and valid mediaKind are required' })
      return
    }
    const cat = body.category?.trim()
    if (cat && !isCategory(cat)) {
      res.status(400).json({ error: 'Invalid category' })
      return
    }
    const category: Category = cat && isCategory(cat) ? cat : 'graphics'
    const item = await createGameDevResource(authToken, {
      title,
      url,
      mediaKind: mk as MediaKind,
      category,
      summary: body.summary,
      bodyMd: body.bodyMd,
      coverImageUrl: body.coverImageUrl,
      extraLinks: normalizeExtraLinks(body.extraLinks),
      tags: normalizeTags(body.tags),
      slug: body.slug?.trim() || null,
    })
    res.status(201).json(item)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create resource'
    if (msg === 'Slug already exists') { res.status(409).json({ error: msg }); return }
    if (msg === 'Supabase not configured') { res.status(503).json({ error: 'Auth not configured' }); return }
    console.error('[game-dev] create error:', err)
    res.status(500).json({ error: 'Failed to create resource' })
  }
})

/** PATCH /api/game-dev-resources/:id */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const { id } = req.params
    const body = req.body as {
      title?: string; url?: string; mediaKind?: string; category?: string
      summary?: string | null; bodyMd?: string | null; coverImageUrl?: string | null
      extraLinks?: unknown; tags?: unknown; slug?: string | null
    }
    const patch: Parameters<typeof updateGameDevResource>[2] = {}
    if (body.title != null) patch.title = body.title
    if (body.url != null) patch.url = body.url
    if (body.mediaKind != null) {
      if (!isMediaKind(body.mediaKind)) { res.status(400).json({ error: 'Invalid mediaKind' }); return }
      patch.mediaKind = body.mediaKind
    }
    if (body.category != null) {
      if (!isCategory(body.category)) { res.status(400).json({ error: 'Invalid category' }); return }
      patch.category = body.category
    }
    if (body.summary !== undefined) patch.summary = body.summary
    if (body.bodyMd !== undefined) patch.bodyMd = body.bodyMd
    if (body.coverImageUrl !== undefined) patch.coverImageUrl = body.coverImageUrl
    if (body.extraLinks !== undefined) patch.extraLinks = normalizeExtraLinks(body.extraLinks)
    if (body.tags !== undefined) patch.tags = normalizeTags(body.tags)
    if (body.slug !== undefined) patch.slug = body.slug

    const item = await updateGameDevResource(authToken, id, patch)
    res.json(item)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update resource'
    if (msg === 'Slug already exists') { res.status(409).json({ error: msg }); return }
    if (msg === 'Supabase not configured') { res.status(503).json({ error: 'Auth not configured' }); return }
    console.error('[game-dev] update error:', err)
    res.status(500).json({ error: 'Failed to update resource' })
  }
})

/** DELETE /api/game-dev-resources/:id */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const { id } = req.params
    await deleteGameDevResource(authToken, id)
    res.status(204).send()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete resource'
    if (msg === 'Supabase not configured') { res.status(503).json({ error: 'Auth not configured' }); return }
    console.error('[game-dev] delete error:', err)
    res.status(500).json({ error: 'Failed to delete resource' })
  }
})

export default router
