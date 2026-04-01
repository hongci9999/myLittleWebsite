import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type WidgetGridProps = {
  children: ReactNode
  className?: string
}

/**
 * 메인 `/main` 위젯 영역: 12컬럼 그리드, 모바일 1열.
 * @see docs/plans/2026-03-31-main-widget-section-ui-design.md §2
 */
export function WidgetGrid({ children, className }: WidgetGridProps) {
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [cellSize, setCellSize] = useState(0)

  useEffect(() => {
    const gridEl = gridRef.current
    if (!gridEl) return

    const updateCellSize = () => {
      const width = gridEl.clientWidth
      const gap = 24 // md:gap-6
      const nextCellSize = Math.max((width - gap * 11) / 12, 0)
      setCellSize(nextCellSize)
    }

    updateCellSize()

    const observer = new ResizeObserver(() => {
      updateCellSize()
    })
    observer.observe(gridEl)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={gridRef}
      style={
        cellSize > 0
          ? ({ '--widget-cell-size': `${cellSize}px` } as React.CSSProperties)
          : undefined
      }
      className={cn(
        'grid grid-cols-1 gap-4 md:grid-cols-12 md:[grid-auto-rows:var(--widget-cell-size)] md:gap-6',
        className
      )}
    >
      {children}
    </div>
  )
}
