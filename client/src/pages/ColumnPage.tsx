import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  deleteColumnScrap,
  fetchColumnScraps,
  columnSourceLabel,
  COLUMN_SOURCE_OPTIONS,
  type ColumnScrap,
  type ColumnSourceKind,
} from '@/shared/api/column-scraps'
import { useAuth } from '@/shared/context/AuthContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { OverflowMenu } from '@/shared/ui/OverflowMenu'
import {
  ColumnScrapAdminDialog,
  notifyColumnScrapsChanged,
  subscribeColumnScrapsChanged,
} from '@/widgets/ColumnScrapAdminDialog'

const kindAccent: Record<ColumnSourceKind, string> = {
  blog: 'from-violet-500/25 to-fuchsia-500/20',
  article: 'from-sky-500/25 to-cyan-500/15',
  readme: 'from-emerald-500/25 to-teal-500/15',
  youtube: 'from-red-500/30 to-rose-500/15',
  x: 'from-zinc-800/90 to-sky-600/25',
  other: 'from-muted/50 to-muted/30',
}

export default function ColumnPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [rawItems, setRawItems] = useState<ColumnScrap[]>([])
  const [loading, setLoading] = useState(true)
  const [dbOff, setDbOff] = useState(false)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [kind, setKind] = useState<ColumnSourceKind | ''>('')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminSlug, setAdminSlug] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q), 300)
    return () => window.clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    setLoading(true)
    setDbOff(false)
    try {
      const data = await fetchColumnScraps({
        q: debouncedQ || undefined,
        kind: kind || undefined,
      })
      setRawItems(data)
    } catch (e) {
      setRawItems([])
      if (e instanceof Error && e.message === 'SERVICE_UNAVAILABLE') {
        setDbOff(true)
      }
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, kind])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    return subscribeColumnScrapsChanged(() => {
      void load()
    })
  }, [load])

  const items = useMemo(() => {
    if (selectedTags.size === 0) return rawItems
    const need = [...selectedTags].map((t) => t.toLowerCase())
    return rawItems.filter((item) =>
      need.every((t) => item.tags.some((x) => x.toLowerCase() === t))
    )
  }, [rawItems, selectedTags])

  const tagUniverse = useMemo(() => {
    const set = new Set<string>()
    for (const item of rawItems) {
      for (const t of item.tags) {
        if (t.trim()) set.add(t)
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'))
  }, [rawItems])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  const filterControl =
    'h-9 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none ring-primary/40 focus-visible:ring-2'

  const openAdminNew = () => {
    setAdminSlug(null)
    setAdminOpen(true)
  }

  return (
    <>
      <ColumnScrapAdminDialog
        open={adminOpen}
        onOpenChange={(o) => {
          setAdminOpen(o)
          if (!o) setAdminSlug(null)
        }}
        initialSlug={adminSlug}
      />

      <div className="mx-auto max-w-6xl px-5 pb-16 pt-4 sm:px-8 sm:pt-6 md:px-10">
        <div className="rounded-xl border border-border/60 bg-card/30 p-3 shadow-sm sm:p-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="검색: 제목·URL·태그·메모…"
              aria-label="칼럼 스크랩 검색"
              className={cn(filterControl, 'min-w-0 flex-1')}
            />
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="column-kind">
                형식
              </label>
              <select
                id="column-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as ColumnSourceKind | '')}
                className={cn(filterControl, 'min-w-[6rem] sm:max-w-[9rem]')}
              >
                <option value="">전체 형식</option>
                {COLUMN_SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {token ? (
                <Button type="button" size="sm" className="h-9 shrink-0 px-3" onClick={openAdminNew}>
                  추가·편집
                </Button>
              ) : (
                <Button size="sm" variant="secondary" className="h-9 shrink-0 px-3" asChild>
                  <Link to={`/login?redirect=${encodeURIComponent('/column')}`}>로그인</Link>
                </Button>
              )}
            </div>
          </div>

          {tagUniverse.length > 0 ? (
            <div className="mt-3 border-t border-border/40 pt-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                태그 (선택한 태그를 모두 포함하는 카드만 — AND)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tagUniverse.map((t) => {
                  const on = selectedTags.has(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                        on
                          ? 'border-primary/50 bg-primary/15 text-foreground'
                          : 'border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      )}
                    >
                      {t}
                    </button>
                  )
                })}
                {selectedTags.size > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedTags(new Set())}
                    className="rounded-full border border-dashed border-border/70 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    태그 필터 해제
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {dbOff && (
          <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
            DB에 연결할 수 없거나{' '}
            <code className="rounded bg-muted px-1 font-mono text-xs">column_scraps</code> 테이블이 없을 수
            있습니다.{' '}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              docs/plans/2026-03-24-column-scraps-migration.sql
            </code>
            을 Supabase에서 실행해 주세요.
          </p>
        )}

        <div className="mt-8">
          {loading ? (
            <p className="text-sm text-muted-foreground">불러오는 중…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              항목이 없거나 필터에 맞는 스크랩이 없습니다.
            </p>
          ) : (
            <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex min-h-0 min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                  role="link"
                  tabIndex={0}
                  aria-label={`${item.title} 상세로 이동`}
                  onClick={() => navigate(`/column/${encodeURIComponent(item.slug)}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/column/${encodeURIComponent(item.slug)}`)
                    }
                  }}
                >
                  {token ? (
                    <div className="absolute right-2 top-2 z-20">
                      <OverflowMenu
                        items={[
                          {
                            label: '편집',
                            onSelect: () => {
                              setAdminSlug(item.slug)
                              setAdminOpen(true)
                            },
                          },
                          {
                            label: '삭제',
                            destructive: true,
                            onSelect: () => {
                              void (async () => {
                                if (!token || !confirm('삭제할까요?')) return
                                const ok = await deleteColumnScrap(token, item.id)
                                if (ok) {
                                  void load()
                                  notifyColumnScrapsChanged()
                                }
                              })()
                            },
                          },
                        ]}
                      />
                    </div>
                  ) : null}
                  <article className="flex min-h-[16rem] flex-1 flex-col overflow-hidden">
                    <div
                      className={cn(
                        'relative aspect-[16/10] shrink-0 overflow-hidden bg-gradient-to-br',
                        kindAccent[item.sourceKind]
                      )}
                    >
                      {item.coverImageUrl ? (
                        <img
                          src={item.coverImageUrl}
                          alt=""
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary backdrop-blur-sm">
                        {columnSourceLabel(item.sourceKind)}
                      </span>
                      <h2
                        className={cn(
                          'absolute bottom-3 left-3 line-clamp-2 text-base font-bold leading-snug text-foreground drop-shadow-sm',
                          token ? 'right-12' : 'right-3'
                        )}
                      >
                        {item.title}
                      </h2>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
                      {item.summary ? (
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {item.summary}
                        </p>
                      ) : null}
                      {item.tags.length > 0 ? (
                        <div className="mt-auto flex flex-wrap gap-1">
                          {item.tags.slice(0, 5).map((t) => (
                            <span
                              key={t}
                              className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {t}
                            </span>
                          ))}
                          {item.tags.length > 5 ? (
                            <span className="text-[10px] text-muted-foreground">+{item.tags.length - 5}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </article>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
