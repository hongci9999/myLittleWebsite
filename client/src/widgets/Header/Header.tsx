/**
 * 스티키 헤더 + 좌측 사이드 메뉴 (GitHub 스타일)
 * 경로는 파일 구조처럼 breadcrumb 형태로 표시
 */
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MAIN_NAV } from '@/shared/config/nav'
import { getFileStructureBreadcrumb } from '@/shared/config/file-structure'
import { useTheme } from '@/shared/context/ThemeContext'
import { THEME_OPTIONS } from '@/shared/config/themes'
import { cn } from '@/lib/utils'

type BreadcrumbItem = { label: string; href?: string }

function useBreadcrumb(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: 'myLittleWebsite', href: '/main' }]

  if (pathname === '/main' || pathname === '/') {
    return items
  }

  if (pathname === '/patch-notes') {
    items.push({ label: '패치노트', href: undefined })
    return items
  }

  const fsBreadcrumb = getFileStructureBreadcrumb(pathname)
  if (fsBreadcrumb) {
    items.push(...fsBreadcrumb)
    return items
  }

  const nav = MAIN_NAV.find((n) => pathname === n.path || pathname.startsWith(n.path + '/'))
  if (nav) {
    items.push({ label: nav.label, href: nav.path })
  }

  return items
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div
      className="flex rounded-full bg-muted/50 p-0.5"
      role="tablist"
      aria-label="테마 선택"
    >
      {THEME_OPTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={theme === id}
          onClick={() => setTheme(id)}
          className={cn(
            'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
            theme === id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function SidebarNavLink({
  to,
  children,
  isActive,
  onNavigate,
}: {
  to: string
  children: React.ReactNode
  isActive: boolean
  onNavigate: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        'block rounded-lg px-4 py-3 text-base font-medium no-underline transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-foreground hover:bg-muted/50'
      )}
    >
      {children}
    </Link>
  )
}

export default function Header() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const breadcrumb = useBreadcrumb(location.pathname)

  const closeSidebar = () => setSidebarOpen(false)

  useEffect(() => {
    if (!sidebarOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted/50 transition-colors"
              aria-label="메뉴 열기"
              aria-expanded={sidebarOpen}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
            <nav
              className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-xl font-semibold tracking-tight"
              aria-label="경로"
            >
              {breadcrumb.map((item, i) => (
                <span key={i} className="flex shrink-0 items-center gap-1.5">
                  {i > 0 && (
                    <span className="font-semibold text-muted-foreground">/</span>
                  )}
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="truncate text-foreground no-underline hover:text-primary hover:underline"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="truncate text-foreground">
                      {item.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <ThemeToggle />
        </div>
      </header>

      {/* Overlay */}
      <div
        role="presentation"
        className={cn(
          'fixed inset-0 z-[60] bg-foreground/20 backdrop-blur-sm transition-opacity',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeSidebar}
        aria-hidden
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-[70] h-full w-72 border-r border-border bg-background shadow-xl transition-transform duration-300 ease-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="메인 메뉴"
        aria-hidden={!sidebarOpen}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <span className="text-lg font-semibold">메뉴</span>
          <button
            type="button"
            onClick={closeSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            aria-label="메뉴 닫기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-4" aria-label="대주제">
          <SidebarNavLink
            to="/main"
            isActive={location.pathname === '/main'}
            onNavigate={closeSidebar}
          >
            홈
          </SidebarNavLink>
          {MAIN_NAV.map(({ path, label }) => (
            <SidebarNavLink
              key={path}
              to={path}
              isActive={location.pathname === path}
              onNavigate={closeSidebar}
            >
              {label}
            </SidebarNavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
