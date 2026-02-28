import { FileListItem } from '@/shared/ui/FileListItem'
import { INFO_ENGINEER_CATEGORIES } from '@/shared/config/learningInfoEngineer'

export default function LearningCategoryListPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <ul className="flex flex-col gap-2">
        {INFO_ENGINEER_CATEGORIES.map((category) => (
          <li key={category.id}>
            <FileListItem
              to={`/learning/info-engineer/${category.id}`}
              label={category.name}
              description={category.description}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
