/**
 * 학습 폴더 런타임 스캔 - build-learning-config 로직과 동일
 * DB 없이 .md 파일 추가 시 즉시 목록 반영
 */
import fs from 'fs'
import path from 'path'
import {
  getSectionConfig,
  getSectionFolderPath,
} from '../config/learning-sections.js'
import type { FileStructureSectionResponse } from '../db/queries/learning.js'

function slugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, '')
}

interface ScanDoc {
  slug: string
  title: string
  filePath: string
}

interface ScanChild {
  id: string
  name: string
  docs?: ScanDoc[]
  children?: ScanChild[]
}

function scanDir(dirPath: string, baseRelPath = ''): { docs: ScanDoc[]; children: ScanChild[] } {
  if (!fs.existsSync(dirPath)) return { docs: [], children: [] }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const docs: ScanDoc[] = []
  const children: ScanChild[] = []

  for (const ent of entries) {
    const fullPath = path.join(dirPath, ent.name)
    const relPath = baseRelPath ? `${baseRelPath}/${ent.name}` : ent.name

    if (ent.isDirectory()) {
      const sub = scanDir(fullPath, relPath)
      const hasContent = sub.docs.length > 0 || sub.children.length > 0
      if (hasContent) {
        const child: ScanChild = {
          id: ent.name,
          name: ent.name.replace(/^\d+_/, '').trim() || ent.name,
        }
        if (sub.docs.length > 0) {
          child.docs = sub.docs.sort((a, b) => a.title.localeCompare(b.title))
        }
        if (sub.children.length > 0) {
          child.children = sub.children
        }
        children.push(child)
      }
    } else if (ent.isFile() && ent.name.endsWith('.md')) {
      const slug = slugFromFilename(ent.name)
      docs.push({ slug, title: slug, filePath: relPath })
    }
  }

  return { docs, children }
}

/**
 * 섹션 폴더 스캔 → FileStructureSection 반환
 */
export function scanLearningSection(sectionId: string): FileStructureSectionResponse | null {
  const config = getSectionConfig(sectionId)
  const dirPath = getSectionFolderPath(sectionId)
  if (!config || !dirPath) return null

  if (!fs.existsSync(dirPath)) {
    return { sectionId, sectionLabel: config.label, basePath: `/learnings/${config.folderName}`, nodes: [] }
  }

  const topDirs = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()

  const nodes = topDirs.map((nodeId) => {
    const nodePath = path.join(dirPath, nodeId)
    const { docs, children } = scanDir(nodePath, nodeId)
    const node: { id: string; name: string; description?: string; docs?: ScanDoc[]; children?: ScanChild[] } = {
      id: nodeId,
      name: nodeId.replace(/^\d+_/, '').trim() || nodeId,
    }
    if (children.length > 0) node.children = children
    if (docs.length > 0) node.docs = docs.sort((a, b) => a.title.localeCompare(b.title))
    return node
  })

  return {
    sectionId,
    sectionLabel: config.label,
    basePath: `/learnings/${config.folderName}`,
    nodes,
  }
}
