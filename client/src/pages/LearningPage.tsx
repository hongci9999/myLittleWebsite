import { useEffect, useState } from 'react'
import FileStructureTopPage from './FileStructure/FileStructureTopPage'
import { fetchLearningSections } from '@/shared/api/learning'
import type { FileStructureSectionSummary } from '@/shared/config/file-structure'

export default function LearningPage() {
  const [sections, setSections] = useState<FileStructureSectionSummary[] | null>(
    null
  )

  useEffect(() => {
    fetchLearningSections()
      .then(setSections)
      .catch(() => setSections([]))
  }, [])

  return (
    <FileStructureTopPage
      parentPath="/learning"
      sectionsOverride={sections}
    />
  )
}
