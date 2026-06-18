import { Router } from 'express'
import { fetchD2HelloWorldLatest, parseLimit } from '../services/d2-helloworld-atom.js'

const router = Router()

/** GET /api/d2-helloworld/latest - D2 Hello world 최신 영상 (공개) */
router.get('/latest', async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, 1)
    const items = await fetchD2HelloWorldLatest(limit)
    res.json(items)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch D2 Hello world'
    if (message.includes('limit must be between')) {
      res.status(400).json({ error: message })
      return
    }
    if (message.includes('Atom request failed')) {
      res.status(503).json({ error: 'D2 Atom feed temporarily unavailable' })
      return
    }
    console.error('[d2-helloworld] latest error:', err)
    res.status(500).json({ error: 'Failed to fetch D2 Hello world' })
  }
})

export default router
