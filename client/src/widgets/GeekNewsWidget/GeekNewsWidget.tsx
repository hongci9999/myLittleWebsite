import { useEffect, useState } from 'react'
import {
  fetchGeekNewsLatestCached,
  getCachedGeekNewsLatest,
  type GeekNewsItem,
} from '@/shared/api/geeknews'
import { BentoCard } from '@/shared/ui/BentoCard'

const DEFAULT_LIMIT = 5

function formatPublishedAt(publishedAt: string): string {
  if (!publishedAt) return '날짜 정보 없음'
  const parsed = new Date(publishedAt)
  if (Number.isNaN(parsed.getTime())) return '날짜 정보 없음'
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed)
}

function GeekNewsSkeleton() {
  return (
    <div className="mt-4 space-y-2">
      {Array.from({ length: DEFAULT_LIMIT }).map((_, index) => (
        <div
          key={index}
          className="h-11 animate-pulse rounded-lg bg-muted/40"
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export default function GeekNewsWidget() {
  const cached = getCachedGeekNewsLatest(DEFAULT_LIMIT)
  const [items, setItems] = useState<GeekNewsItem[]>(cached ?? [])
  const [loading, setLoading] = useState(cached === null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGeekNewsLatestCached(DEFAULT_LIMIT)
      .then((nextItems) => {
        setItems(nextItems)
        if (nextItems.length === 0) {
          setError('최신 GeekNews를 가져오지 못했습니다')
        }
      })
      .catch(() => {
        setError('최신 GeekNews를 불러오는 중 오류가 발생했습니다')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <BentoCard className="h-full p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium tracking-tight text-muted-foreground">
          오늘의 GeekNews
        </h2>
        <a
          href="https://news.hada.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary no-underline transition-colors hover:underline"
        >
          사이트 열기
        </a>
      </div>

      {loading ? (
        <GeekNewsSkeleton />
      ) : error ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{error}</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          표시할 GeekNews가 없습니다
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.url}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-border/60 bg-background/70 px-3 py-2.5 no-underline transition-all hover:bg-muted/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatPublishedAt(item.publishedAt)}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </BentoCard>
  )
}
