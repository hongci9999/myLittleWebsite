/**
 * client/public/learnings/정처기 폴더 스캔 → learning-info-engineer config 생성
 * 실행: node scripts/build-learning-config.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LEARNINGS_DIR = path.join(__dirname, '../client/public/learnings/정처기')
const OUTPUT_FILE = path.join(__dirname, '../client/src/shared/config/file-structure-sections/learning-info-engineer.ts')

const NODE_META = {
  '01_소프트웨어설계': { name: '소프트웨어 설계', description: 'SDLC, UML, 요구공학 등' },
  '02_소프트웨어개발': { name: '소프트웨어 개발', description: '자료구조, 알고리즘, 테스트 등' },
  '03_데이터베이스구축': { name: '데이터베이스 구축', description: 'ERD, SQL, 정규화 등' },
  '04_프로그래밍언어활용': { name: '프로그래밍 언어 활용', description: 'C, Python, 객체지향 등' },
  '05_정보시스템구축관리': { name: '정보시스템 구축관리', description: '통신, 보안, 프로토콜 등' },
  '99_노트': { name: '노트', description: '기출·복습 노트' },
}

function slugFromFilename(filename) {
  return filename.replace(/\.md$/, '')
}

function scanDir(dirPath, baseRelPath = '') {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const docs = []
  const children = []

  for (const ent of entries) {
    const fullPath = path.join(dirPath, ent.name)
    const relPath = baseRelPath ? `${baseRelPath}/${ent.name}` : ent.name

    if (ent.isDirectory()) {
      const sub = scanDir(fullPath, relPath)
      const hasContent = sub.docs.length > 0 || sub.children.length > 0
      if (hasContent) {
        const child = {
          id: ent.name,
          name: ent.name.replace(/^\d+_/, '').trim() || ent.name,
        }
        if (sub.docs.length > 0) child.docs = sub.docs.sort((a, b) => a.title.localeCompare(b.title))
        if (sub.children.length > 0) child.children = sub.children
        children.push(child)
      }
    } else if (ent.isFile() && ent.name.endsWith('.md')) {
      const slug = slugFromFilename(ent.name)
      docs.push({
        slug,
        title: slug,
        filePath: relPath,
      })
    }
  }

  return { docs, children }
}

function buildNode(nodeId, dirPath, baseRelPath) {
  const meta = NODE_META[nodeId] ?? { name: nodeId, description: undefined }
  const { docs, children } = scanDir(dirPath, baseRelPath)

  const node = {
    id: nodeId,
    name: meta.name,
    ...(meta.description && { description: meta.description }),
  }

  if (children.length > 0) {
    node.children = children
  }
  if (docs.length > 0) {
    node.docs = docs.sort((a, b) => a.title.localeCompare(b.title))
  }

  return node
}

function main() {
  const topDirs = fs.readdirSync(LEARNINGS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()

  const nodes = []
  for (const nodeId of topDirs) {
    const dirPath = path.join(LEARNINGS_DIR, nodeId)
    const node = buildNode(nodeId, dirPath, nodeId)
    nodes.push(node)
  }

  const section = {
    sectionId: 'info-engineer',
    sectionLabel: '정보처리기사',
    basePath: '/learnings/정처기',
    nodes,
  }

  const tsContent = `/**
 * 정보처리기사 학습 섹션 (자동 생성)
 * scripts/build-learning-config.mjs 로 public/learnings/정처기 폴더 스캔 후 생성
 * 수동 수정 시 다음 빌드에서 덮어쓰임
 */
import {
  registerFileStructureParent,
  type FileStructureSection,
} from '../file-structure'

const infoEngineerSection: FileStructureSection = ${JSON.stringify(section, null, 2)}

registerFileStructureParent({
  parentPath: '/learning',
  parentLabel: '학습 기록',
  sections: [infoEngineerSection],
})
`

  fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf-8')
  console.log(`Generated ${OUTPUT_FILE}`)
  console.log(`Nodes: ${nodes.length}, Total docs: ${nodes.reduce((acc, n) => acc + (n.docs?.length ?? 0) + (n.children?.reduce((a, c) => a + (c.docs?.length ?? 0), 0) ?? 0), 0)}`)
}

main()
