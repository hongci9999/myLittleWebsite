import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import {
  getDimensionsWithValues,
  getLinks,
  createLink,
  updateLink,
  deleteLink,
} from '../db/queries/links.js'

const router = Router()

/** GET /api/links/dimensions - 분류 축 + 값 트리 (공개) */
router.get('/dimensions', async (_, res) => {
  try {
    const dimensions = await getDimensionsWithValues()
    res.json(dimensions)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch dimensions'
    if (msg === 'Supabase not configured') {
      res.status(503).json({
        error: 'Database not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env',
      })
      return
    }
    console.error('[links] getDimensionsWithValues error:', err)
    res.status(500).json({ error: 'Failed to fetch dimensions' })
  }
})

/** GET /api/links - 링크 목록 (공개). query: valueIds, q */
router.get('/', async (req, res) => {
  try {
    const valueIds = req.query.valueIds
      ? String(req.query.valueIds).split(',').filter(Boolean)
      : undefined
    const q = req.query.q ? String(req.query.q) : undefined

    const links = await getLinks({ valueIds, q })
    res.json(links)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch links'
    if (msg === 'Supabase not configured') {
      res.status(503).json({
        error: 'Database not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env',
      })
      return
    }
    console.error('[links] getLinks error:', err)
    res.status(500).json({ error: 'Failed to fetch links' })
  }
})

/** POST /api/links - 링크 추가 (인증 필요) */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const body = req.body as {
      url?: string
      title?: string
      description?: string
      valueIds?: string[]
    }
    if (!body.url || !body.title) {
      res.status(400).json({ error: 'url and title are required' })
      return
    }
    const link = await createLink(authToken, {
      url: body.url,
      title: body.title,
      description: body.description,
      valueIds: body.valueIds,
    })
    res.status(201).json(link)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create link'
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Auth not configured' })
      return
    }
    console.error('[links] createLink error:', err)
    res.status(500).json({ error: 'Failed to create link' })
  }
})

/** PATCH /api/links/:id - 링크 수정 (인증 필요) */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const { id } = req.params
    const body = req.body as {
      url?: string
      title?: string
      description?: string
      valueIds?: string[]
    }
    const link = await updateLink(authToken, id, body)
    res.json(link)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update link'
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Auth not configured' })
      return
    }
    console.error('[links] updateLink error:', err)
    res.status(500).json({ error: 'Failed to update link' })
  }
})

/** DELETE /api/links/:id - 링크 삭제 (인증 필요) */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const { id } = req.params
    await deleteLink(authToken, id)
    res.status(204).send()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete link'
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Auth not configured' })
      return
    }
    console.error('[links] deleteLink error:', err)
    res.status(500).json({ error: 'Failed to delete link' })
  }
})

export default router
