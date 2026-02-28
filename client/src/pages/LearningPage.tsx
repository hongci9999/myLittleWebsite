import { FileListItem } from '@/shared/ui/FileListItem'

const TOP_LEVEL_ITEMS = [
  { to: '/learning/info-engineer', label: '정보처리기사' },
] as const

export default function LearningPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <ul className="flex flex-col gap-2">
        {TOP_LEVEL_ITEMS.map((item) => (
          <li key={item.to}>
            <FileListItem to={item.to} label={item.label} />
          </li>
        ))}
      </ul>
    </div>
  )
}
