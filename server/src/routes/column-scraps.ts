import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import {
  listColumnScraps,
  getColumnScrapBySlug,
  createColumnScrap,
  updateColumnScrap,
  deleteColumnScrap,
  isColumnSourceKind,
  type ColumnSourceKind,
} from '../db/queries/column-scraps.js'
import { suggestColumnScrapFromUrl } from '../services/ollama.js'

const router = Router()

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

function parseTagsAndQuery(q: unknown): string[] {
  if (!q) return []
  if (Array.isArray(q)) {
    return q.flatMap((x) => String(x).split(/[,，]/)).map((t) => t.trim()).filter(Boolean)
  }
  return String(q)
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
}

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

/** GET /api/column-scraps?q=&kind=&tags= (tags: 쉼표로 여러 개 = AND) */
router.get('/', async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : undefined
    const kind = req.query.kind ? String(req.query.kind) : undefined
    const tagsAnd = parseTagsAndQuery(req.query.tags)
    const items = await listColumnScraps({
      q,
      kind: kind && isColumnSourceKind(kind) ? kind : undefined,
      tagsAnd: tagsAnd.length ? tagsAnd : undefined,
    })
    res.json(items)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list column scraps'
    if (msg === 'Supabase not configured') {
      res.status(503).json({
        error: 'Database not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env',
      })
      return
    }
    console.error('[column-scraps] list error:', err)
    res.status(500).json({ error: 'Failed to list column scraps' })
  }
})

router.get('/by-slug/:slug', async (req, res) => {
  try {
    const slug = decodeURIComponent(req.params.slug)
    const item = await getColumnScrapBySlug(slug)
    if (!item) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json(item)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch'
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Database not configured' })
      return
    }
    console.error('[column-scraps] getBySlug error:', err)
    res.status(500).json({ error: 'Failed to fetch column scrap' })
  }
})

/** POST /api/column-scraps/ai-fill — 로컬 Ollama로 URL 기준 폼 필드 제안 (인증 필요) */
router.post('/ai-fill', requireAuth, async (req, res) => {
  try {
    const url = (req.body as { url?: string })?.url?.trim()
    if (!url) {
      res.status(400).json({ error: 'url is required' })
      return
    }
    const result = await suggestColumnScrapFromUrl(url)
    res.json({
      title: result.title,
      summary: result.summary,
      bodyMd: result.bodyMd,
      sourceKind: result.sourceKind,
      coverImageUrl: result.coverImageUrl,
      tags: result.tags,
      rawResponse: result.rawResponse,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI fill failed'
    if (msg.includes('Ollama') || msg.includes('fetch')) {
      res.status(503).json({
        error: 'Ollama를 실행 중인지 확인하세요. (OLLAMA_HOST, OLLAMA_MODEL)',
      })
      return
    }
    console.error('[column-scraps] ai-fill error:', err)
    res.status(500).json({ error: msg })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const body = req.body as {
      title?: string
      url?: string
      sourceKind?: string
      summary?: string | null
      bodyMd?: string | null
      coverImageUrl?: string | null
      tags?: unknown
      extraLinks?: unknown
      slug?: string | null
    }
    const title = body.title?.trim()
    const url = body.url?.trim()
    const sk = body.sourceKind?.trim()
    if (!title || !url || !sk || !isColumnSourceKind(sk)) {
      res.status(400).json({
        error: 'title, url, and valid sourceKind are required',
      })
      return
    }
    const item = await createColumnScrap(authToken, {
      title,
      url,
      sourceKind: sk as ColumnSourceKind,
      summary: body.summary,
      bodyMd: body.bodyMd,
      coverImageUrl: body.coverImageUrl,
      tags: normalizeTags(body.tags),
      extraLinks: normalizeExtraLinks(body.extraLinks),
      slug: body.slug?.trim() || null,
    })
    res.status(201).json(item)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create'
    if (msg === 'Slug already exists') {
      res.status(409).json({ error: msg })
      return
    }
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Auth not configured' })
      return
    }
    console.error('[column-scraps] create error:', err)
    res.status(500).json({ error: 'Failed to create column scrap' })
  }
})

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
      coverImageUrl?: string | null
      tags?: unknown
      extraLinks?: unknown
      slug?: string | null
    }
    const patch: Parameters<typeof updateColumnScrap>[2] = {}
    if (body.title != null) patch.title = body.title
    if (body.url != null) patch.url = body.url
    if (body.sourceKind != null) {
      if (!isColumnSourceKind(body.sourceKind)) {
        res.status(400).json({ error: 'Invalid sourceKind' })
        return
      }
      patch.sourceKind = body.sourceKind
    }
    if (body.summary !== undefined) patch.summary = body.summary
    if (body.bodyMd !== undefined) patch.bodyMd = body.bodyMd
    if (body.coverImageUrl !== undefined) patch.coverImageUrl = body.coverImageUrl
    if (body.tags !== undefined) patch.tags = normalizeTags(body.tags)
    if (body.extraLinks !== undefined) patch.extraLinks = normalizeExtraLinks(body.extraLinks)
    if (body.slug !== undefined) patch.slug = body.slug

    const item = await updateColumnScrap(authToken, id, patch)
    res.json(item)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update'
    if (msg === 'Slug already exists') {
      res.status(409).json({ error: msg })
      return
    }
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Auth not configured' })
      return
    }
    console.error('[column-scraps] update error:', err)
    res.status(500).json({ error: 'Failed to update column scrap' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const { id } = req.params
    await deleteColumnScrap(authToken, id)
    res.status(204).send()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete'
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Auth not configured' })
      return
    }
    console.error('[column-scraps] delete error:', err)
    res.status(500).json({ error: 'Failed to delete column scrap' })
  }
})

export default router
