/**
 * 메인 페이지. 히어로는 Layout에서 전체 너비로 렌더됨.
 * 콘텐츠 영역 = 위젯 영역 (즐겨찾기 링크 등)
 */
import FavoriteLinksWidget from '@/widgets/FavoriteLinksWidget'
import AiDevToolsOverviewWidget from '@/widgets/AiDevToolsOverviewWidget'

export default function MainPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 md:py-10">
      <FavoriteLinksWidget />
      <AiDevToolsOverviewWidget />
    </div>
  )
}
