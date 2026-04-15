import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { getSections, getSectionWithNodes } from '../db/queries/learning.js'
import { LEARNING_SECTIONS, getSectionBasePath, getSectionFolderPath } from '../config/learning-sections.js'
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
    basePath: s.basePath ?? (s.folderName ? `/learnings/${s.folderName}` : ''),
    nodes: [],
  })).filter((s) => s.basePath)
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

/** GET /api/learning/raw/:sectionId/* - 섹션 파일 원문(마크다운) 조회 */
router.get('/raw/:sectionId/*', (req, res) => {
  const { sectionId } = req.params
  const relPath = Array.isArray(req.params[0]) ? req.params[0].join('/') : req.params[0]
  if (!relPath || !relPath.endsWith('.md')) {
    return res.status(400).send('Invalid markdown path')
  }

  const sectionDir = getSectionFolderPath(sectionId)
  const basePath = getSectionBasePath(sectionId)
  if (!sectionDir || !basePath || !basePath.startsWith('/api/learning/raw/')) {
    return res.status(404).send('Section not found')
  }

  const normalized = path.normalize(relPath)
  const target = path.resolve(sectionDir, normalized)
  const relative = path.relative(path.resolve(sectionDir), target)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return res.status(403).send('Forbidden')
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    return res.status(404).send('File not found')
  }

  const content = fs.readFileSync(target, 'utf-8')
  res.type('text/markdown; charset=utf-8').send(content)
})

export default router
