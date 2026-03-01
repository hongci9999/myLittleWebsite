import { Router } from 'express'
import { getSections, getSectionWithNodes } from '../db/queries/learning.js'

const router = Router()

/** GET /api/learning/sections - 섹션 목록 */
router.get('/sections', async (_, res) => {
  try {
    const rows = await getSections()
    const sections = rows.map((r) => ({
      sectionId: r.section_id,
      sectionLabel: r.label,
      basePath: r.base_path,
      nodes: [], // 목록에서는 노드 생략
    }))
    res.json(sections)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch sections'
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Database not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env' })
      return
    }
    console.error('[learning] getSections error:', err)
    res.status(500).json({ error: 'Failed to fetch sections' })
  }
})

/** GET /api/learning/sections/:sectionId - 섹션 상세 + 노드·문서 */
router.get('/sections/:sectionId', async (req, res) => {
  try {
    const { sectionId } = req.params
    const section = await getSectionWithNodes(sectionId)
    if (!section) {
      res.status(404).json({ error: 'Section not found' })
      return
    }
    res.json(section)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch section'
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Database not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env' })
      return
    }
    console.error('[learning] getSectionWithNodes error:', err)
    res.status(500).json({ error: 'Failed to fetch section' })
  }
})

export default router
