/**
 * 학습 기록 parent 등록 - API 동적 섹션 + config 폴백
 * 브레드크럼용 스텁 섹션 포함 (서버 LEARNING_SECTIONS와 동기화)
 */
import { registerFileStructureParent } from '../file-structure'
import type { FileStructureSection } from '../file-structure'
import { infoEngineerSection } from './learning-info-engineer'

/** 브레드크럼용 스텁 - 서버에 등록 시 여기에 추가 */
const STUB_SECTIONS: FileStructureSection[] = [
  { sectionId: 'big-data-analyst', sectionLabel: '빅데이터분석기사', basePath: '/learnings/빅데이터분석기사', nodes: [] },
  // { sectionId: 'book-reviews', sectionLabel: '독후감', basePath: '/learnings/독후감', nodes: [] },
  // { sectionId: 'db-engineer', sectionLabel: '데이터베이스기사', basePath: '/learnings/데이터베이스기사', nodes: [] },
]

registerFileStructureParent({
  parentPath: '/learning',
  parentLabel: '학습 기록',
  sections: [infoEngineerSection, ...STUB_SECTIONS],
})
