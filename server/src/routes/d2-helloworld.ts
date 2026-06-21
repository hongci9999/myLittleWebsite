import { Router } from 'express'
import { fetchTechFeedLatest } from '../services/tech-feed-latest.js'

const router = Router()

/** GET /api/d2-helloworld/latest - D2 Hello world 최신 영상 + 기술 블로그 최신글 (공개) */
router.get('/latest', async (_req, res) => {
  try {
    const feed = await fetchTechFeedLatest()
    res.json(feed)
  } catch (err) {
    console.error('[d2-helloworld] latest error:', err)
    res.status(500).json({ error: 'Failed to fetch tech feed' })
  }
})

export default router
