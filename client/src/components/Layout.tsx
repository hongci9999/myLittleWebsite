import { Outlet, useLocation } from 'react-router-dom'
import Header from '@/widgets/Header'
import Hero from '@/widgets/Hero'
import RightSidebar from '@/widgets/RightSidebar'
import ChatDock from '@/widgets/ChatDock'
import { ScrapAdminDialogProvider } from '@/shared/context/ScrapAdminDialogContext'
import { GameDevAdminDialogProvider } from '@/shared/context/GameDevAdminDialogContext'

export default function Layout() {
  const { pathname } = useLocation()
  const isMainPage = pathname === '/main' || pathname === '/main/'

  return (
    <ScrapAdminDialogProvider>
    <GameDevAdminDialogProvider>
    <div className="min-h-svh flex flex-col bg-background text-foreground font-sans">
      <Header />
      {/* 히어로: 메인 페이지에서만 전체 너비, 사이드바 침범 없음 */}
      {isMainPage && (
        <div className="w-full shrink-0 border-b border-border/40">
          <Hero />
        </div>
      )}
      <div className="flex flex-1 min-h-0">
        {/* pb-24: 하단 대화창이 본문 끝을 가리지 않게 */}
        <main className="min-w-0 flex-1 pb-24 lg:pr-40">
          <Outlet />
        </main>
        <RightSidebar />
      </div>
      <ChatDock />
    </div>
    </GameDevAdminDialogProvider>
    </ScrapAdminDialogProvider>
  )
}
