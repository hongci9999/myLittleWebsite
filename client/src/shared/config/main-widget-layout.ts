/**
 * 메인 위젯 그리드 배치.
 * md+ 에서 col/row-start 로 슬롯 고정 (자동 배치로 위치가 밀리지 않게).
 * 모바일은 DOM 순서대로 1열 스택.
 *
 * md 12열 그리드 (row = --widget-cell-size):
 *   [즐겨찾기 5×4] [GeekNews 7×5]
 *   [타로 5×6    ] [CS 한 조각 7×5]
 *
 * @see docs/plans/2026-03-31-main-bento-widgets-design.md
 */
export type MainWidgetId =
  | 'favorite-links'
  | 'geeknews-latest'
  | 'tech-interview-random'
  | 'tarot-daily'
  | 'd2-helloworld-latest'

export type WidgetLayoutItem = {
  id: MainWidgetId
  enabled: boolean
  /** 그리드 셀용 Tailwind (md+: 12컬럼, col/row-start 포함) */
  gridClassName: string
}

export const MAIN_WIDGET_LAYOUT: WidgetLayoutItem[] = [
  {
    id: 'favorite-links',
    enabled: true,
    gridClassName:
      'h-full min-h-0 min-w-0 overflow-hidden md:col-start-1 md:row-start-1 md:col-span-5 md:row-span-4',
  },
  {
    id: 'geeknews-latest',
    enabled: true,
    gridClassName:
      'min-w-0 md:col-start-6 md:row-start-1 md:col-span-7 md:row-span-5',
  },
  {
    id: 'tech-interview-random',
    enabled: true,
    gridClassName:
      'h-full min-h-0 min-w-0 overflow-hidden md:col-start-6 md:row-start-6 md:col-span-7 md:row-span-5',
  },
  {
    id: 'tarot-daily',
    enabled: true,
    gridClassName:
      'min-w-0 md:col-start-1 md:row-start-5 md:col-span-5 md:row-span-6',
  },
  {
    id: 'd2-helloworld-latest',
    enabled: true,
    gridClassName:
      'min-w-0 md:col-start-1 md:row-start-11 md:col-span-12 md:row-span-10',
  },
]
