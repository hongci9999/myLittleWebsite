/**
 * 메인 위젯 그리드 배치. DOM 순서 = 읽기 순서 (CSS order 미사용).
 * @see docs/plans/2026-03-31-main-bento-widgets-design.md
 */
export type MainWidgetId = 'favorite-links' | 'geeknews-latest' | 'tarot-daily'

export type WidgetLayoutItem = {
  id: MainWidgetId
  enabled: boolean
  /** 그리드 셀용 Tailwind (md+: 12컬럼 기준 col-span/row-span) */
  gridClassName: string
}

export const MAIN_WIDGET_LAYOUT: WidgetLayoutItem[] = [
  {
    id: 'favorite-links',
    enabled: true,
    gridClassName: 'min-w-0 md:col-span-5 md:row-span-4',
  },
  {
    id: 'geeknews-latest',
    enabled: true,
    gridClassName: 'min-w-0 md:col-span-7 md:row-span-5',
  },
  {
    id: 'tarot-daily',
    enabled: true,
    gridClassName: 'min-w-0 md:col-span-5 md:row-span-6',
  },
]
