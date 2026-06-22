import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useListPageScrollRestore } from '@/shared/hooks/useListPageScrollRestore'
import { useListPageSearchInput } from '@/shared/hooks/useListPageSearchInput'
import { patchSearchParams } from '@/shared/lib/list-page-url'
import {
  deleteGameDevResource,
  fetchGameDevResources,
  mediaKindLabel,
  categoryLabel,
  MEDIA_KIND_OPTIONS,
  CATEGORY_OPTIONS,
  type GameDevResource,
  type MediaKind,
  type Category,
} from '@/shared/api/game-dev'
import { useAuth } from '@/shared/context/AuthContext'
import { useGameDevAdmin } from '@/shared/context/GameDevAdminDialogContext'
import {
  notifyGameDevChanged,
  subscribeGameDevChanged,
} from '@/widgets/GameDevAdminDialog'
import { GameDevCategoryNav } from '@/widgets/GameDevCategoryNav'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { OverflowMenu } from '@/shared/ui/OverflowMenu'

export default function GameDevLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { token } = useAuth()
  const { openGameDevAdmin } = useGameDevAdmin()
  const [items, setItems] = useState<GameDevResource[]>([])
  const [loading, setLoading] = useState(true)
  const [dbOff, setDbOff] = useState(false)
  const { committedValue: q, inputProps: searchInputProps } =
    useListPageSearchInput('q')
  const kind = (searchParams.get('kind') ?? '') as MediaKind | ''
  const category = (searchParams.get('category') ?? '') as Category | ''

  const load = useCallback(async () => {
    setLoading(true)
    setDbOff(false)
    try {
      const data = await fetchGameDevResources({
        q: q || undefined,
        kind,
        category,
      })
      setItems(data)
    } catch (e) {
      setItems([])
      if (e instanceof Error && e.message === 'SERVICE_UNAVAILABLE') {
        setDbOff(true)
      }
    } finally {
      setLoading(false)
    }
  }, [q, kind, category])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    return subscribeGameDevChanged(() => {
      load()
    })
  }, [load])

  useListPageScrollRestore('game-dev', !loading)

  const setKind = (value: MediaKind | '') => {
    setSearchParams(
      (prev) => patchSearchParams(prev, { kind: value || null }),
      { replace: true }
    )
  }

  const setCategory = (value: Category | '') => {
    setSearchParams(
      (prev) => patchSearchParams(prev, { category: value || null }),
      { replace: true }
    )
  }

  const filterControl =
    'h-9 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none ring-primary/40 focus-visible:ring-2'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-8 md:py-10">
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <aside className="hidden w-48 shrink-0 md:block">
          <div className="sticky top-20">
            <GameDevCategoryNav active={category} onSelect={setCategory} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 md:hidden">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category | '')}
              aria-label="분야"
              className={cn(filterControl, 'w-full')}
            >
              <option value="">전체 분야</option>
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/30 p-3 shadow-sm sm:p-3.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <input
                type="search"
                {...searchInputProps}
                placeholder="검색: 제목·URL·본문·태그…"
                aria-label="자료 검색"
                className={cn(filterControl, 'min-w-0 flex-1')}
              />
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0">
                <label className="sr-only" htmlFor="game-dev-kind-filter">
                  형식
                </label>
                <select
                  id="game-dev-kind-filter"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as MediaKind | '')}
                  className={cn(filterControl, 'min-w-[6.5rem] sm:max-w-[10rem]')}
                >
                  <option value="">전체 형식</option>
                  {MEDIA_KIND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {token ? (
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 shrink-0 px-3"
                    onClick={() => openGameDevAdmin()}
                  >
                    추가·편집
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" className="h-9 shrink-0 px-3" asChild>
                    <Link to={`/login?redirect=${encodeURIComponent('/game-dev')}`}>
                      로그인
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {dbOff && (
            <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
              DB에 연결할 수 없거나{' '}
              <code className="rounded bg-muted px-1 font-mono text-xs">game_dev_resources</code> 테이블이 없을
              수 있습니다.{' '}
              <code className="rounded bg-muted px-1 font-mono text-xs">
                docs/plans/2026-06-22-game-dev-resources-migration.sql
              </code>
              를 Supabase에서 실행해 주세요.
            </p>
          )}

          <div className="mt-8">
            {loading ? (
              <p className="text-sm text-muted-foreground">불러오는 중…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {category
                  ? `이 분야(${categoryLabel(category)})에 자료가 없거나 필터에 맞는 자료가 없습니다.`
                  : '항목이 없거나 필터에 맞는 자료가 없습니다.'}
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((s) => (
                  <li key={s.id}>
                    <div
                      className={cn(
                        'group flex overflow-hidden rounded-2xl border border-border/60 bg-background/80 transition-all',
                        'hover:border-primary/35 hover:shadow-md'
                      )}
                    >
                      <Link
                        to={`/game-dev/${encodeURIComponent(s.slug)}`}
                        className="min-w-0 flex-1 px-4 py-4 text-inherit no-underline"
                        aria-label={`${s.title} 상세로 이동`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                              {categoryLabel(s.category)}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {mediaKindLabel(s.mediaKind)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(s.updatedAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground group-hover:text-primary">
                          {s.title}
                        </h2>
                        {s.summary ? (
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {s.summary}
                          </p>
                        ) : null}
                        <p className="mt-2 truncate font-mono text-xs text-muted-foreground">{s.url}</p>
                        {s.tags.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {s.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-xs text-foreground"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </Link>
                      {token ? (
                        <div className="flex shrink-0 items-start border-l border-border/50 px-2 py-3">
                          <OverflowMenu
                            items={[
                              {
                                label: '편집',
                                onSelect: () => openGameDevAdmin({ slug: s.slug }),
                              },
                              {
                                label: '삭제',
                                destructive: true,
                                onSelect: () => {
                                  void (async () => {
                                    if (!token || !confirm('삭제할까요?')) return
                                    const ok = await deleteGameDevResource(token, s.id)
                                    if (ok) {
                                      void load()
                                      notifyGameDevChanged()
                                    }
                                  })()
                                },
                              },
                            ]}
                          />
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
