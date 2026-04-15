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
  /** learnings 하위 폴더명 (예: 정보처리기사_필기, 독후감) */
  folderName?: string
  /** 섹션 전용 루트 디렉터리(미지정 시 LEARNINGS_ROOT 사용) */
  rootDir?: string
  /** 문서 조회용 basePath(미지정 시 /learnings/<folderName>) */
  basePath?: string
}

/** 등록된 섹션 목록 - 새 섹션 추가 시 여기에 추가 */
export const LEARNING_SECTIONS: LearningSectionConfig[] = [
  { sectionId: 'info-engineer', label: '정보처리기사 필기', folderName: '정보처리기사_필기' },
  {
    sectionId: 'info-engineer-practical',
    label: '정보처리기사 실기',
    folderName: '정보처리기사_실기',
  },
  { sectionId: 'big-data-analyst', label: '빅데이터분석기사', folderName: '빅데이터분석기사' },
  {
    sectionId: 'project-learning',
    label: '프로젝트 학습 노트',
    rootDir: path.join(projectRoot, 'docs', 'learnings'),
    basePath: '/api/learning/raw/project-learning',
  },
  // { sectionId: 'book-reviews', label: '독후감', folderName: '독후감' },
  // { sectionId: 'db-engineer', label: '데이터베이스기사', folderName: '데이터베이스기사' },
]

export function getSectionConfig(sectionId: string): LearningSectionConfig | undefined {
  return LEARNING_SECTIONS.find((s) => s.sectionId === sectionId)
}

export function getSectionFolderPath(sectionId: string): string | null {
  const config = getSectionConfig(sectionId)
  if (!config) return null
  if (config.rootDir) return config.rootDir
  if (!config.folderName) return null
  return path.join(LEARNINGS_ROOT, config.folderName)
}

export function getSectionBasePath(sectionId: string): string | null {
  const config = getSectionConfig(sectionId)
  if (!config) return null
  if (config.basePath) return config.basePath
  if (!config.folderName) return null
  return `/learnings/${config.folderName}`
}
