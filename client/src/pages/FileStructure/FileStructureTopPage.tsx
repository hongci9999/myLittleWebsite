import { FileListItem } from '@/shared/ui/FileListItem'
import {
  getFileStructureParent,
  getSectionPath,
  type FileStructureSectionSummary,
} from '@/shared/config/file-structure'

interface Props {
  parentPath: string
  /** API에서 가져온 섹션 목록 (동적) - 있으면 config 대신 사용 */
  sectionsOverride?: FileStructureSectionSummary[] | null
}

export default function FileStructureTopPage({
  parentPath,
  sectionsOverride,
}: Props) {
  const parent = getFileStructureParent(parentPath)
  const sections =
    sectionsOverride ?? parent?.sections ?? []

  if (sections.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-muted-foreground">항목을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <ul className="flex flex-col gap-2">
        {sections.map((section) => (
          <li key={section.sectionId}>
            <FileListItem
              to={getSectionPath(parentPath, section.sectionId)}
              label={section.sectionLabel}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
