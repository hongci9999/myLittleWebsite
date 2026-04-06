/**
 * 메인 페이지. 히어로는 Layout에서 전체 너비로 렌더됨.
 * 콘텐츠 영역 = 위젯 그리드 (추천 링크 등)
 */
import type { ComponentType } from 'react'
import FavoriteLinksWidget from '@/widgets/FavoriteLinksWidget'
import GeekNewsWidget from '@/widgets/GeekNewsWidget'
import { WidgetGrid } from '@/widgets/WidgetGrid'
import {
  MAIN_WIDGET_LAYOUT,
  type MainWidgetId,
} from '@/shared/config/main-widget-layout'

const WIDGET_COMPONENTS: Record<MainWidgetId, ComponentType> = {
  'favorite-links': FavoriteLinksWidget,
  'geeknews-latest': GeekNewsWidget,
}

export default function MainPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:py-10">
      <WidgetGrid>
        {MAIN_WIDGET_LAYOUT.filter((item) => item.enabled).map(
          ({ id, gridClassName }) => {
            const Comp = WIDGET_COMPONENTS[id]
            return (
              <div key={id} className={gridClassName}>
                <Comp />
              </div>
            )
          }
        )}
      </WidgetGrid>
    </div>
  )
}
