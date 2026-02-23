import { Outlet, Link } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-svh flex flex-col bg-background text-foreground font-sans">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link
          to="/"
          className="font-semibold text-lg text-foreground no-underline hover:text-primary"
        >
          myLittleWebsite
        </Link>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
