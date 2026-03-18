import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface FileListItemProps {
  to?: string
  label: string
  description?: string
  className?: string
}

/**
 * 파일 구조처럼 가로 전체를 차지하는 직사각형 리스트 아이템
 */
export function FileListItem({
  to,
  label,
  description,
  className,
}: FileListItemProps) {
  const baseClass =
    'flex w-full flex-col justify-center gap-1 rounded-lg border border-border/60 bg-card pl-6 pr-6 py-6 text-left transition-colors hover-bg'

  const content = (
    <>
      <span className="text-lg font-semibold">{label}</span>
      {description && (
        <span className="text-sm text-muted-foreground">{description}</span>
      )}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={cn(baseClass, 'no-underline', className)}>
        {content}
      </Link>
    )
  }

  return (
    <div className={cn(baseClass, 'cursor-default', className)}>{content}</div>
  )
}
