import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import FileStructureBrowserPage from './FileStructure/FileStructureBrowserPage'
import {
  fetchLearningSection,
  shouldUseLearningConfigOnly,
} from '@/shared/api/learning'
import type { FileStructureSection } from '@/shared/config/file-structure'

export default function LearningBrowserPage() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const [section, setSection] = useState<FileStructureSection | null | undefined>(
    undefined
  )

  useEffect(() => {
    if (!sectionId) return
    if (shouldUseLearningConfigOnly(sectionId)) {
      setSection(null)
      return
    }
    let cancelled = false
    setSection(undefined)
    fetchLearningSection(sectionId)
      .then((data) => {
        if (!cancelled) setSection(data ?? null)
      })
      .catch(() => {
        if (!cancelled) setSection(null)
      })
    return () => {
      cancelled = true
    }
  }, [sectionId])

  if (!sectionId) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-muted-foreground">섹션을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <FileStructureBrowserPage
      parentPath="/learning"
      sectionId={sectionId}
      sectionOverride={section}
    />
  )
}
