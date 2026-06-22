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

/** GET /api/game-dev-resources?q=&kind= */
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
      res.status(503).json({ error: 'Database not configured' })
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

/** POST /api/game-dev-resources */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const body = req.body as {
      title?: string; url?: string; mediaKind?: string; category?: string
      summary?: string | null; bodyMd?: string | null
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
    const category: Category = cat && isCategory(cat) ? cat : 'graphics'
    const item = await createGameDevResource(authToken, {
      title,
      url,
      mediaKind: mk as MediaKind,
      category,
      summary: body.summary,
      bodyMd: body.bodyMd,
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
      summary?: string | null; bodyMd?: string | null
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
