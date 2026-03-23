import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  deleteAiScrap,
  fetchAiScraps,
  sourceKindLabel,
  SOURCE_KIND_OPTIONS,
  type AiToolScrap,
  type SourceKind,
} from '@/shared/api/ai-scraps'
import { useAuth } from '@/shared/context/AuthContext'
import { useScrapAdminDialog } from '@/shared/context/ScrapAdminDialogContext'
import {
  notifyAiScrapsChanged,
  subscribeAiScrapsChanged,
} from '@/widgets/AiToolScrapAdminDialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { OverflowMenu } from '@/shared/ui/OverflowMenu'

export default function AiDevToolsPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { openScrapAdmin } = useScrapAdminDialog()
  const [items, setItems] = useState<AiToolScrap[]>([])
  const [loading, setLoading] = useState(true)
  const [dbOff, setDbOff] = useState(false)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [kind, setKind] = useState<SourceKind | ''>('')
  const [tag, setTag] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q), 300)
    return () => window.clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    setLoading(true)
    setDbOff(false)
    try {
      const data = await fetchAiScraps({
        q: debouncedQ || undefined,
        kind,
        tag: tag || undefined,
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
  }, [debouncedQ, kind, tag])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    return subscribeAiScrapsChanged(() => {
      load()
    })
  }, [load])

  const allTags = Array.from(
    new Set(items.flatMap((s) => s.tags))
  ).sort((a, b) => a.localeCompare(b, 'ko'))

  const filterControl =
    'h-9 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none ring-primary/40 focus-visible:ring-2'

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 md:px-10 md:py-12">
      <div className="rounded-xl border border-border/60 bg-card/30 p-3 shadow-sm sm:p-3.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="검색: 제목·URL·본문·태그…"
            aria-label="스크랩 검색"
            className={cn(filterControl, 'min-w-0 flex-1')}
          />
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0">
            <label className="sr-only" htmlFor="scrap-kind-filter">
              종류
            </label>
            <select
              id="scrap-kind-filter"
              value={kind}
              onChange={(e) => setKind(e.target.value as SourceKind | '')}
              className={cn(filterControl, 'min-w-[6.5rem] sm:max-w-[10rem]')}
            >
              <option value="">전체 종류</option>
              {SOURCE_KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="scrap-tag-filter">
              태그
            </label>
            <input
              id="scrap-tag-filter"
              list="scrap-tag-suggestions"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="태그"
              aria-label="태그로 필터"
              className={cn(filterControl, 'w-full min-w-[5rem] sm:w-28')}
            />
            <datalist id="scrap-tag-suggestions">
              {allTags.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            {token ? (
              <Button
                type="button"
                size="sm"
                className="h-9 shrink-0 px-3"
                onClick={() => openScrapAdmin()}
              >
                추가·편집
              </Button>
            ) : (
              <Button size="sm" variant="secondary" className="h-9 shrink-0 px-3" asChild>
                <Link to={`/login?redirect=${encodeURIComponent('/ai-dev-tools')}`}>
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
          <code className="rounded bg-muted px-1 font-mono text-xs">ai_tool_scraps</code> 테이블이 없을
          수 있습니다.{' '}
          <code className="rounded bg-muted px-1 font-mono text-xs">
            docs/plans/2026-03-23-ai-tool-scraps-migration.sql
          </code>
          를 Supabase에서 실행해 주세요.
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
          <ul className="space-y-3">
            {items.map((s) => (
              <li key={s.id}>
                <div
                  className={cn(
                    'group flex overflow-hidden rounded-2xl border border-border/60 bg-background/80 transition-all',
                    'hover:border-primary/35 hover:shadow-md'
                  )}
                >
                  <div
                    className="min-w-0 flex-1 cursor-pointer px-4 py-4"
                    role="link"
                    tabIndex={0}
                    aria-label={`${s.title} 상세로 이동`}
                    onClick={() => navigate(`/ai-dev-tools/${encodeURIComponent(s.slug)}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/ai-dev-tools/${encodeURIComponent(s.slug)}`)
                      }
                    }}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary/90">
                        {sourceKindLabel(s.sourceKind)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.updatedAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground group-hover:text-primary">
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
                  </div>
                  {token ? (
                    <div className="flex shrink-0 items-start border-l border-border/50 px-2 py-3">
                      <OverflowMenu
                        items={[
                          {
                            label: '편집',
                            onSelect: () => openScrapAdmin({ slug: s.slug }),
                          },
                          {
                            label: '삭제',
                            destructive: true,
                            onSelect: () => {
                              void (async () => {
                                if (!token || !confirm('삭제할까요?')) return
                                const ok = await deleteAiScrap(token, s.id)
                                if (ok) {
                                  void load()
                                  notifyAiScrapsChanged()
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
  )
}
