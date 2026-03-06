import type {
  FileStructureSection,
  FileStructureSectionSummary,
} from '@/shared/config/file-structure'

const API_BASE = '/api/learning'

/** 섹션 목록 조회 */
export async function fetchLearningSections(): Promise<
  FileStructureSectionSummary[]
> {
  const res = await fetch(`${API_BASE}/sections`)
  if (!res.ok) return []
  const data = await res.json()
  return data as FileStructureSectionSummary[]
}

/** 섹션 상세 + 노드·문서 조회 */
export async function fetchLearningSection(
  sectionId: string
): Promise<FileStructureSection | null> {
  const res = await fetch(`${API_BASE}/sections/${sectionId}`)
  if (!res.ok) return null
  const data = await res.json()
  return data as FileStructureSection
}
