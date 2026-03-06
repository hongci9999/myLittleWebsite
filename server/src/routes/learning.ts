import { Router } from 'express'
import { getSections, getSectionWithNodes } from '../db/queries/learning.js'
import { LEARNING_SECTIONS } from '../config/learning-sections.js'
import { scanLearningSection } from '../services/learning-scan.js'

const router = Router()

/** GET /api/learning/sections - 섹션 목록 (DB 우선, 없으면 config) */
router.get('/sections', async (_, res) => {
  try {
    const rows = await getSections()
    if (rows.length > 0) {
      const sections = rows.map((r) => ({
        sectionId: r.section_id,
        sectionLabel: r.label,
        basePath: r.base_path,
        nodes: [],
      }))
      return res.json(sections)
    }
  } catch {
    // Supabase 미설정 시 config 폴백
  }
  const sections = LEARNING_SECTIONS.map((s) => ({
    sectionId: s.sectionId,
    sectionLabel: s.label,
    basePath: `/learnings/${s.folderName}`,
    nodes: [],
  }))
  res.json(sections)
})

/** GET /api/learning/sections/:sectionId - 섹션 상세 (DB 우선, 없으면 폴더 스캔) */
router.get('/sections/:sectionId', async (req, res) => {
  const { sectionId } = req.params
  try {
    const section = await getSectionWithNodes(sectionId)
    if (section && (section.nodes?.length ?? 0) > 0) {
      return res.json(section)
    }
  } catch {
    // Supabase 미설정 시 스캔 폴백
  }
  const scanned = scanLearningSection(sectionId)
  if (!scanned) {
    return res.status(404).json({ error: 'Section not found' })
  }
  res.json(scanned)
})

export default router
