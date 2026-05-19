import {
  getFileStructureParent,
  type FileStructureSection,
  type FileStructureSectionSummary,
} from '@/shared/config/file-structure'
import { apiUrl } from '@/shared/api/base'

const API_BASE = apiUrl('/api/learning')
const LEARNING_PARENT_PATH = '/learning'

export function getLearningSectionFromConfig(
  sectionId: string
): FileStructureSection | undefined {
  return getFileStructureParent(LEARNING_PARENT_PATH)?.sections.find(
    (s) => s.sectionId === sectionId
  )
}

/** config에 트리·부가 설명이 있으면 API 상세를 쓰지 않음 (설명 깜빡임 방지) */
export function shouldUseLearningConfigOnly(sectionId: string): boolean {
  return (getLearningSectionFromConfig(sectionId)?.nodes?.length ?? 0) > 0
}

/** 학습 기록 config 순서 = 표시 순서 (API·DB와 불일치 시 깜빡임 방지) */
export function mergeLearningSectionSummaries(
  fromApi: FileStructureSectionSummary[]
): FileStructureSectionSummary[] {
  const config = (getFileStructureParent(LEARNING_PARENT_PATH)?.sections ?? []).map(
    ({ sectionId, sectionLabel, basePath }) => ({ sectionId, sectionLabel, basePath })
  )
  if (fromApi.length === 0) return config

  const apiById = new Map(fromApi.map((s) => [s.sectionId, s]))
  const merged: FileStructureSectionSummary[] = []

  for (const c of config) {
    merged.push(apiById.get(c.sectionId) ?? c)
  }
  for (const s of fromApi) {
    if (!config.some((c) => c.sectionId === s.sectionId)) {
      merged.push(s)
    }
  }
  return merged
}

/** 섹션 목록 조회 */
export async function fetchLearningSections(): Promise<
  FileStructureSectionSummary[]
> {
  const res = await fetch(`${API_BASE}/sections`)
  if (!res.ok) return mergeLearningSectionSummaries([])
  const data = (await res.json()) as FileStructureSectionSummary[]
  return mergeLearningSectionSummaries(data)
}

/** 섹션 상세 + 노드·문서 조회 (노드 없으면 null → 클라이언트 config 폴백) */
export async function fetchLearningSection(
  sectionId: string
): Promise<FileStructureSection | null> {
  if (shouldUseLearningConfigOnly(sectionId)) {
    return null
  }

  const res = await fetch(`${API_BASE}/sections/${sectionId}`)
  if (!res.ok) return null
  const data = (await res.json()) as FileStructureSection
  if ((data.nodes?.length ?? 0) === 0) return null
  return data
}
