import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type OverflowMenuItem = {
  label: string
  onSelect: () => void
  destructive?: boolean
}

type Props = {
  items: OverflowMenuItem[]
  className?: string
  align?: 'end' | 'start'
}

/** 카드·행 우측 세로 점(⋮) 메뉴 — 클릭 시 목록, 바깥 클릭으로 닫힘 */
export function OverflowMenu({ items, className, align = 'end' }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div
      ref={rootRef}
      className={cn('relative', className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="h-8 w-8 border border-border/70 bg-background/90 text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-background"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="항목 메뉴"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="sr-only">메뉴</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
          className="!size-4"
        >
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </Button>
      {open ? (
        <ul
          role="menu"
          className={cn(
            'absolute z-50 mt-1 min-w-[7.5rem] rounded-lg border border-border/80 bg-card py-1 shadow-md',
            align === 'end' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                role="menuitem"
                className={cn(
                  'flex w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/70',
                  item.destructive && 'text-destructive hover:bg-destructive/10'
                )}
                onClick={() => {
                  setOpen(false)
                  item.onSelect()
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
