import { Router } from 'express'
import { getBootcampDoc, listBootcampDocs } from '../db/queries/bootcamp.js'

const router = Router()

/** GET /api/bootcamp — 부트캠프 기록 목록 (공개, 본문 제외) */
router.get('/', async (_req, res) => {
  try {
    res.json(await listBootcampDocs())
  } catch (err) {
    console.error('[bootcamp] list error:', err)
    res.status(500).json({ error: 'Failed to fetch bootcamp docs' })
  }
})

/** GET /api/bootcamp/:slug — 기록 한 건 (공개). 'index' = 과정 소개 */
router.get('/:slug', async (req, res) => {
  try {
    const doc = await getBootcampDoc(req.params.slug)
    if (!doc) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json(doc)
  } catch (err) {
    console.error('[bootcamp] get error:', err)
    res.status(500).json({ error: 'Failed to fetch bootcamp doc' })
  }
})

export default router
