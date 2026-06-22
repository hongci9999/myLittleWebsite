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

const mediaKindAccent: Record<MediaKind, string> = {
  youtube: 'from-red-500/30 to-rose-500/15',
  article: 'from-sky-500/25 to-cyan-500/15',
  repo: 'from-emerald-500/25 to-teal-500/15',
  blog: 'from-violet-500/25 to-fuchsia-500/20',
  doc: 'from-cyan-500/25 to-blue-500/15',
  book: 'from-amber-500/25 to-orange-500/15',
  asset: 'from-pink-500/25 to-fuchsia-500/20',
  other: 'from-muted/50 to-muted/30',
}

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
              (및 표지 컬럼{' '}
              <code className="rounded bg-muted px-1 font-mono text-xs">
                docs/plans/2026-06-22-game-dev-resources-cover-image.sql
              </code>
              )를 Supabase에서 실행해 주세요.
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
              <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => (
                  <div
                    key={s.id}
                    className="group relative min-h-0 min-w-0 flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                  >
                    {token ? (
                      <div className="absolute right-2 top-2 z-20">
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
                    <Link
                      to={`/game-dev/${encodeURIComponent(s.slug)}`}
                      className="flex min-h-0 min-w-0 flex-1 flex-col text-inherit no-underline"
                      aria-label={`${s.title} 상세로 이동`}
                    >
                      <article className="flex min-h-[16rem] flex-1 flex-col overflow-hidden">
                        <div
                          className={cn(
                            'relative aspect-[16/10] shrink-0 overflow-hidden bg-gradient-to-br',
                            mediaKindAccent[s.mediaKind]
                          )}
                        >
                          {s.coverImageUrl ? (
                            <img
                              src={s.coverImageUrl}
                              alt=""
                              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary backdrop-blur-sm">
                            {categoryLabel(s.category)}
                          </span>
                          <span className="absolute right-3 top-3 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur-sm">
                            {mediaKindLabel(s.mediaKind)}
                          </span>
                          <h2
                            className={cn(
                              'absolute bottom-3 left-3 line-clamp-2 text-base font-bold leading-snug text-foreground drop-shadow-sm',
                              token ? 'right-12' : 'right-3'
                            )}
                          >
                            {s.title}
                          </h2>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
                          {s.summary ? (
                            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {s.summary}
                            </p>
                          ) : null}
                          {s.tags.length > 0 ? (
                            <div className="mt-auto flex flex-wrap gap-1">
                              {s.tags.slice(0, 5).map((t) => (
                                <span
                                  key={t}
                                  className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </article>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
