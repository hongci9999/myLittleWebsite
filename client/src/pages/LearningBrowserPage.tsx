import { useEffect, useState } from 'react'
import FileStructureBrowserPage from './FileStructure/FileStructureBrowserPage'
import { fetchLearningSection } from '@/shared/api/learning'
import type { FileStructureSection } from '@/shared/config/file-structure'

export default function LearningBrowserPage() {
  const [section, setSection] = useState<FileStructureSection | null | undefined>(
    undefined
  )

  useEffect(() => {
    fetchLearningSection('info-engineer')
      .then((data) => {
        // API가 노드를 포함하면 사용, 없으면 config 폴백
        const hasNodes = (data?.nodes?.length ?? 0) > 0
        setSection(hasNodes ? data : null)
      })
      .catch(() => setSection(null))
  }, [])

  return (
    <FileStructureBrowserPage
      parentPath="/learning"
      sectionId="info-engineer"
      sectionOverride={section}
    />
  )
}
