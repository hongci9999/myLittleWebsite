import { Router } from 'express'
import { fetchGeekNewsLatest, parseLimit } from '../services/geeknews-rss.js'

const router = Router()

/** GET /api/geeknews/latest - 최신 GeekNews 항목 (공개) */
router.get('/latest', async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, 5)
    const items = await fetchGeekNewsLatest(limit)
    res.json(items)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch GeekNews'
    if (message.includes('limit must be between')) {
      res.status(400).json({ error: message })
      return
    }
    if (message.includes('RSS request failed')) {
      res.status(503).json({ error: 'GeekNews RSS temporarily unavailable' })
      return
    }
    console.error('[geeknews] latest error:', err)
    res.status(500).json({ error: 'Failed to fetch GeekNews' })
  }
})

export default router
