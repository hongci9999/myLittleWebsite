import { useParams } from 'react-router-dom'
import { FileListItem } from '@/shared/ui/FileListItem'
import { INFO_ENGINEER_CATEGORIES } from '@/shared/config/learningInfoEngineer'

export default function LearningDocListPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const category = INFO_ENGINEER_CATEGORIES.find((c) => c.id === categoryId)

  if (!category) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-muted-foreground">과목을 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (category.docs.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-muted-foreground">준비 중입니다.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <ul className="flex flex-col gap-2">
        {category.docs.map((doc) => (
          <li key={doc.slug}>
            <FileListItem
              to={`/learning/info-engineer/${category.id}/${doc.slug}`}
              label={doc.title}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
