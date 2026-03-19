import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'
import { useFavoriteLinks } from '@/shared/hooks/useFavoriteLinks'
import {
  fetchLinks,
  fetchDimensions,
  type LinkWithValues,
  type DimensionWithValues,
  type ValueTree,
} from '@/shared/api/links'
import { AddLinkDialog } from '@/widgets/AddLinkDialog'

const SearchIcon = () => (
  <svg
    className="size-4 shrink-0 text-muted-foreground"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg
    className="size-3.5 shrink-0 opacity-60"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
)

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className="size-4 shrink-0"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
)

function collectValueIds(nodes: ValueTree[]): { id: string; label: string }[] {
  const result: { id: string; label: string }[] = []
  const walk = (items: ValueTree[]) => {
    for (const v of items) {
      result.push({ id: v.id, label: v.label })
      if (v.children?.length) walk(v.children)
    }
  }
  walk(nodes)
  return result
}

type SortKey = 'title' | 'createdAt' | 'sortOrder'

export default function LinksPage() {
  const { token } = useAuth()
  const { toggleFavorite, isFavorite } = useFavoriteLinks()
  const [links, setLinks] = useState<LinkWithValues[]>([])
  const [dimensions, setDimensions] = useState<DimensionWithValues[]>([])
  const [search, setSearch] = useState('')
  const [selectedByDimension, setSelectedByDimension] = useState<
    Record<string, Set<string>>
  >({})
  const [sortBy, setSortBy] = useState<SortKey>('sortOrder')
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  useEffect(() => {
    fetchDimensions().then(setDimensions)
  }, [])

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const valueIds = Object.values(selectedByDimension).flatMap((s) =>
      Array.from(s)
    )
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setLoading(true)
    })
    fetchLinks({
      q: search || undefined,
      valueIds: valueIds.length > 0 ? valueIds : undefined,
    })
      .then((data) => {
        const dimSlugs = Object.keys(selectedByDimension)
        if (dimSlugs.length <= 1) return data
        return data.filter((link) => {
          for (const slug of dimSlugs) {
            const ids = selectedByDimension[slug]
            const hasMatch = Array.from(ids).some((id) =>
              link.valueIds.includes(id)
            )
            if (!hasMatch) return false
          }
          return true
        })
      })
      .then((data) => {
        if (!cancelled) setLinks(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [search, selectedByDimension, refreshKey])

  const toggleValue = (dimensionSlug: string, valueId: string) => {
    setSelectedByDimension((prev) => {
      const dimSet = new Set(prev[dimensionSlug] ?? [])
      if (dimSet.has(valueId)) dimSet.delete(valueId)
      else dimSet.add(valueId)
      const next = { ...prev }
      if (dimSet.size > 0) next[dimensionSlug] = dimSet
      else delete next[dimensionSlug]
      return next
    })
  }

  const clearFilters = () => {
    setSelectedByDimension({})
    setSearch('')
  }

  const hasActiveFilters =
    search.trim() !== '' || Object.keys(selectedByDimension).length > 0

  const sortedLinks = useMemo(() => {
    const arr = [...links]
    if (sortBy === 'title') {
      arr.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortBy === 'createdAt') {
      arr.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } else {
      arr.sort((a, b) => a.sortOrder - b.sortOrder)
    }
    return arr
  }, [links, sortBy])

  const valueLabels = useMemo(() => {
    const all = dimensions.flatMap((d) => collectValueIds(d.values))
    return Object.fromEntries(all.map((v) => [v.id, v.label]))
  }, [dimensions])

  return (
    <div className="flex min-h-full flex-col">
      {/* 고정 검색창 - 상단 중앙 */}
      <div className="sticky top-16 z-40 flex justify-center border-b border-border/40 bg-background/80 px-4 py-4 backdrop-blur-md">
        <div className="flex w-full max-w-md items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>
            <input
              type="search"
              placeholder="링크 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border-0 bg-muted/40 py-3 pl-11 pr-5 text-sm text-foreground placeholder:text-muted-foreground/80 focus:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {token && (
            <button
              type="button"
              onClick={() => setAddDialogOpen(true)}
              className="shrink-0 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              추가
            </button>
          )}
        </div>
      </div>

      {token && (
        <AddLinkDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          token={token}
          dimensions={dimensions}
          setDimensions={setDimensions}
          onLinkAdded={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {/* 사이드바 + 링크 그리드 */}
      <div className="flex flex-1">
        {/* 좌측 사이드 - 태그 선택, 분류, 링크 관리 */}
        <aside className="sticky top-[8.5rem] hidden h-[calc(100vh-8.5rem)] w-56 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border/40 bg-background/50 py-6 pl-4 pr-4 lg:flex">
          {dimensions.map((dim) => {
            const values = collectValueIds(dim.values)
            const selected = selectedByDimension[dim.slug] ?? new Set()
            if (values.length === 0) return null
            return (
              <div key={dim.id} className="flex flex-col gap-2">
                <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/90">
                  {dim.label}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {values.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleValue(dim.slug, v.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        selected.has(v.id)
                          ? 'bg-secondary text-secondary-foreground shadow-sm'
                          : 'bg-muted/60 text-muted-foreground hover-bg hover:text-secondary'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          <div className="mt-auto flex flex-col gap-2 border-t border-border/40 pt-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="w-full rounded-lg border-0 bg-muted/50 py-2 pl-3 pr-8 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="sortOrder">기본 순서</option>
              <option value="title">제목순</option>
              <option value="createdAt">최신순</option>
            </select>
            {token && (
              <Link
                to="/links/admin"
                className="block rounded-lg bg-muted/50 px-3 py-2 text-center text-xs font-medium no-underline text-foreground transition-colors hover-bg hover:text-secondary"
              >
                링크 관리
              </Link>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-left text-xs text-muted-foreground underline-offset-2 hover:text-secondary hover:underline"
              >
                필터 초기화
              </button>
            )}
          </div>
        </aside>

        {/* 메인 콘텐츠: 모바일 필터 + 링크 그리드 */}
        <div className="min-w-0 flex-1 flex flex-col">
          {/* 모바일: 태그/분류/링크관리 - 상단 펼침 */}
          <div className="flex flex-wrap gap-3 border-b border-border/40 px-4 py-3 lg:hidden">
            {dimensions.map((dim) => {
              const values = collectValueIds(dim.values)
              const selected = selectedByDimension[dim.slug] ?? new Set()
              if (values.length === 0) return null
              return (
                <div key={dim.id} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {dim.label}:
                  </span>
                  {values.slice(0, 5).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleValue(dim.slug, v.id)}
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        selected.has(v.id)
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-muted/60 text-muted-foreground'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                  {values.length > 5 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{values.length - 5}
                    </span>
                  )}
                </div>
              )
            })}
            <div className="flex w-full items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="rounded-lg border-0 bg-muted/50 py-1.5 px-3 text-xs"
              >
                <option value="sortOrder">기본</option>
                <option value="title">제목순</option>
                <option value="createdAt">최신순</option>
              </select>
              {token && (
                <Link
                  to="/links/admin"
                  className="rounded-lg bg-muted/50 px-3 py-1.5 text-xs no-underline transition-colors hover:text-secondary"
                >
                  링크 관리
                </Link>
              )}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground underline transition-colors hover:text-secondary"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          {/* 링크 그리드 */}
          <div className="flex-1 px-4 py-6 lg:py-8">
            <div className="mx-auto max-w-5xl">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24">
                  <div className="size-8 animate-spin rounded-full border-2 border-secondary/30 border-t-secondary" />
                  <p className="text-sm text-muted-foreground">로딩 중...</p>
                </div>
              ) : sortedLinks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
                  <p className="text-sm text-muted-foreground">
                    등록된 링크가 없습니다.
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    필터를 조정하거나 검색어를 바꿔 보세요.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block no-underline"
                    >
                      <div className="flex h-full flex-col rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover-bg-card-lg">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="min-w-0 flex-1 font-semibold text-foreground line-clamp-2 group-hover:text-secondary">
                            {link.title}
                          </h3>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                toggleFavorite(link.id)
                              }}
                              className={`rounded-md p-1 transition-colors hover-bg ${
                                isFavorite(link.id)
                                  ? 'text-secondary'
                                  : 'text-muted-foreground hover:text-secondary'
                              }`}
                              aria-label={
                                isFavorite(link.id)
                                  ? '즐겨찾기 해제'
                                  : '즐겨찾기 추가'
                              }
                            >
                              <StarIcon filled={isFavorite(link.id)} />
                            </button>
                            <span className="rounded-md bg-muted/50 p-1 opacity-70 transition-opacity group-hover:opacity-100">
                              <ExternalLinkIcon />
                            </span>
                          </div>
                        </div>
                        {link.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {link.description}
                          </p>
                        )}
                        <p className="mt-2 truncate font-mono text-[11px] text-muted-foreground/80">
                          {link.url}
                        </p>
                        {link.valueIds.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {link.valueIds.map((vid) => (
                              <span
                                key={vid}
                                className="rounded-md bg-muted/70 px-2 py-0.5 font-medium text-[11px] text-muted-foreground"
                              >
                                {valueLabels[vid] ?? vid}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
