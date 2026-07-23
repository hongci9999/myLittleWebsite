/**
 * 학습 기록 섹션 정의 (동적 폴더 스캔용)
 * 새 섹션 추가: 폴더 생성 후 여기에 등록
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * 프로젝트 루트 해석.
 * 로컬(tsx/컴파일)은 소스 파일 기준 상위 3단계가 레포 루트다.
 * Vercel 서버리스 번들에서는 `__dirname`이 번들 경로라 이 기준이 깨지므로,
 * `docs/learnings`가 존재하지 않으면 함수 실행 cwd(배포 루트)로 폴백한다.
 * (docs/learnings는 vercel.json functions.includeFiles로 배포 루트에 포함됨)
 */
function resolveProjectRoot(): string {
  const fromSource = path.join(__dirname, '..', '..', '..')
  if (fs.existsSync(path.join(fromSource, 'docs', 'learnings'))) return fromSource
  return process.cwd()
}

/** learnings 루트 경로 (client/public/learnings) */
const projectRoot = resolveProjectRoot()
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
  { sectionId: 'sqld', label: 'SQLD', folderName: 'SQLD' },
  { sectionId: 'cs-interview', label: 'CS 면접대비', folderName: 'CS_면접대비' },
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
