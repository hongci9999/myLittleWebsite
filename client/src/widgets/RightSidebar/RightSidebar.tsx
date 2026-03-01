import { Link, useLocation } from 'react-router-dom'
import { SIDEBAR_SHORTCUTS } from '@/shared/config/shortcuts'
import { cn } from '@/lib/utils'

export default function RightSidebar() {
  const location = useLocation()

  return (
    <aside
      className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
      aria-label="바로가기"
    >
      <div className="w-40 rounded-l-xl border border-r-0 border-border bg-card/95 py-3 pl-3 pr-2 shadow-lg backdrop-blur-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          바로가기
        </h2>
        <nav className="mt-3 flex flex-col gap-1.5">
          {SIDEBAR_SHORTCUTS.map(({ path, label, icon }) => {
            const isActive = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'group flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium no-underline transition-all duration-200',
                  isActive
                    ? 'border-primary/40 bg-primary/10 text-primary shadow-sm'
                    : 'border-border/60 bg-card text-foreground hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm'
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded text-sm transition-colors',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted/80 text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary'
                  )}
                >
                  {icon}
                </span>
                <span className="min-w-0 truncate">{label}</span>
                <span
                  className={cn(
                    'ml-auto shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5',
                    isActive && 'text-primary'
                  )}
                >
                  →
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
