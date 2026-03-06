/**
 * 학습 기록 섹션 정의 (동적 폴더 스캔용)
 * 새 섹션 추가: 폴더 생성 후 여기에 등록
 */
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** learnings 루트 경로 (client/public/learnings) */
const projectRoot = path.join(__dirname, '..', '..', '..')
export const LEARNINGS_ROOT =
  process.env.LEARNINGS_ROOT ?? path.join(projectRoot, 'client', 'public', 'learnings')

export interface LearningSectionConfig {
  sectionId: string
  label: string
  /** learnings 하위 폴더명 (예: 정처기, 독후감) */
  folderName: string
}

/** 등록된 섹션 목록 - 새 섹션 추가 시 여기에 추가 */
export const LEARNING_SECTIONS: LearningSectionConfig[] = [
  { sectionId: 'info-engineer', label: '정보처리기사', folderName: '정처기' },
  // { sectionId: 'book-reviews', label: '독후감', folderName: '독후감' },
  // { sectionId: 'db-engineer', label: '데이터베이스기사', folderName: '데이터베이스기사' },
]

export function getSectionConfig(sectionId: string): LearningSectionConfig | undefined {
  return LEARNING_SECTIONS.find((s) => s.sectionId === sectionId)
}

export function getSectionFolderPath(sectionId: string): string | null {
  const config = getSectionConfig(sectionId)
  if (!config) return null
  return path.join(LEARNINGS_ROOT, config.folderName)
}
