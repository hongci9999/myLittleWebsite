import { FileListItem } from '@/shared/ui/FileListItem'
import {
  getFileStructureParent,
  getSectionPath,
} from '@/shared/config/file-structure'

interface Props {
  parentPath: string
}

export default function FileStructureTopPage({ parentPath }: Props) {
  const parent = getFileStructureParent(parentPath)

  if (!parent) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-muted-foreground">항목을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <ul className="flex flex-col gap-2">
        {parent.sections.map((section) => (
          <li key={section.sectionId}>
            <FileListItem
              to={getSectionPath(parent.parentPath, section.sectionId)}
              label={section.sectionLabel}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
