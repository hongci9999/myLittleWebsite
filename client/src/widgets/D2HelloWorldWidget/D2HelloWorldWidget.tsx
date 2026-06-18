import { useEffect, useState } from 'react'
import {
  fetchD2HelloWorldLatestCached,
  getCachedD2HelloWorldLatest,
  type D2HelloWorldVideo,
} from '@/shared/api/d2-helloworld'
import { BentoCard } from '@/shared/ui/BentoCard'

const HELLOWORLD_LIST_URL = 'https://d2.naver.com/helloworld'

function formatPublishedAt(publishedAt: string): string {
  if (!publishedAt) return '날짜 정보 없음'
  const parsed = new Date(publishedAt)
  if (Number.isNaN(parsed.getTime())) return '날짜 정보 없음'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed)
}

function D2HelloWorldSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
      <div className="aspect-video w-full shrink-0 animate-pulse rounded-xl bg-muted/40 sm:w-48 md:w-56" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="h-5 w-4/5 animate-pulse rounded bg-muted/40" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted/30" />
        <div className="h-12 w-full animate-pulse rounded bg-muted/30" />
      </div>
    </div>
  )
}

export default function D2HelloWorldWidget() {
  const cached = getCachedD2HelloWorldLatest(1)
  const [item, setItem] = useState<D2HelloWorldVideo | null>(cached?.[0] ?? null)
  const [loading, setLoading] = useState(cached === null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchD2HelloWorldLatestCached(1)
      .then((items) => {
        setItem(items[0] ?? null)
        if (items.length === 0) {
          setError('최신 D2 Hello world 영상을 가져오지 못했습니다')
        }
      })
      .catch(() => {
        setError('D2 Hello world 영상을 불러오는 중 오류가 발생했습니다')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <BentoCard className="h-full p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium tracking-tight text-muted-foreground">
          D2 Hello world · 최신 영상
        </h2>
        <a
          href={HELLOWORLD_LIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary no-underline transition-colors hover:underline"
        >
          전체 목록
        </a>
      </div>

      {loading ? (
        <D2HelloWorldSkeleton />
      ) : error ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{error}</p>
      ) : !item ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          표시할 영상이 없습니다
        </p>
      ) : (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex flex-col gap-3 rounded-xl border border-border/60 bg-background/70 p-3 no-underline transition-all hover:bg-muted/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-row sm:items-start"
        >
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-muted/40 sm:w-48 md:w-56">
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted/60 text-xs text-muted-foreground">
                NAVER TV
              </div>
            )}
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-foreground/10">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
              {item.title}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatPublishedAt(item.publishedAt)}
            </p>
            {item.summary ? (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {item.summary}
              </p>
            ) : null}
          </div>
        </a>
      )}
    </BentoCard>
  )
}
