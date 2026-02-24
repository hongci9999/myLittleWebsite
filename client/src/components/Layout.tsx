import { Outlet, Link, useLocation } from 'react-router-dom'
import { MAIN_NAV } from '@/shared/config/nav'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-svh flex flex-col bg-background text-foreground font-sans">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link
          to="/main"
          className="font-semibold text-lg text-foreground no-underline hover:text-primary"
        >
          myLittleWebsite
        </Link>
        <nav className="flex gap-4">
          <Link
            to="/main"
            className={`text-sm no-underline hover:text-primary ${
              location.pathname === '/main' ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}
          >
            홈
          </Link>
          {MAIN_NAV.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`text-sm no-underline hover:text-primary ${
                location.pathname === path ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
