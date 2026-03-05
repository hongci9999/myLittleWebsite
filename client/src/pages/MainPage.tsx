/**
 * 메인 페이지. 히어로는 Layout에서 전체 너비로 렌더됨.
 * 콘텐츠 영역 = 위젯 영역 (즐겨찾기 링크 등)
 */
import FavoriteLinksWidget from '@/widgets/FavoriteLinksWidget'

export default function MainPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">
      <FavoriteLinksWidget />
    </div>
  )
}
