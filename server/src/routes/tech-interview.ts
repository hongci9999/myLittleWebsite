import { Router } from 'express'
import { pickRandomTechInterviewDoc } from '../services/tech-interview-pick.js'

const router = Router()

/** GET /api/tech-interview/random - 허용 폴더에서 무작위 md 1건 (요청마다 새로 뽑음) */
router.get('/random', async (_req, res) => {
  try {
    const doc = await pickRandomTechInterviewDoc()
    res.json(doc)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to fetch tech interview doc'
    if (message.includes('GitHub')) {
      res.status(503).json({ error: 'GitHub source temporarily unavailable' })
      return
    }
    console.error('[tech-interview] random error:', err)
    res.status(500).json({ error: 'Failed to fetch tech interview doc' })
  }
})

export default router
