import { CATEGORY_OPTIONS, type Category } from '@/shared/api/game-dev'
import { cn } from '@/lib/utils'

type Props = {
  active: Category | ''
  onSelect: (next: Category | '') => void
}

export function GameDevCategoryNav({ active, onSelect }: Props) {
  const items: { value: Category | ''; label: string }[] = [
    { value: '', label: '전체' },
    ...CATEGORY_OPTIONS,
  ]
  return (
    <nav aria-label="분야" className="flex flex-col gap-1">
      <h2 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        분야
      </h2>
      {items.map((it) => {
        const isActive = active === it.value
        return (
          <button
            key={it.value || 'all'}
            type="button"
            onClick={() => onSelect(it.value)}
            aria-current={isActive ? 'true' : undefined}
            className={cn(
              'rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors',
              isActive
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-transparent text-foreground hover:bg-muted/60'
            )}
          >
            {it.label}
          </button>
        )
      })}
    </nav>
  )
}
