import { useEffect, useState } from 'react'
import {
  fetchTechFeedLatestCached,
  getCachedTechFeedLatest,
  type D2HelloWorldVideo,
  type TechBlogPost,
  type TechFeedLatest,
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

function TechFeedSkeleton() {
  return (
    <div className="mt-4 space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-xl bg-muted/40" />
      ))}
    </div>
  )
}

function D2VideoCard({ item }: { item: D2HelloWorldVideo }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/70 p-3 no-underline transition-all hover:bg-muted/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-row sm:items-start"
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-muted/40 sm:w-44 md:w-52">
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
        <p className="text-xs font-medium text-primary">D2 Hello world</p>
        <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-foreground">
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
  )
}

function TechBlogCard({ item }: { item: TechBlogPost }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-xl border border-border/60 bg-background/70 p-3 no-underline transition-all hover:bg-muted/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:items-center"
    >
      {item.thumbnailUrl ? (
        <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-muted/40 sm:h-16 sm:w-28">
          <img
            src={item.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-primary">{item.sourceLabel}</p>
        <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {item.title}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatPublishedAt(item.publishedAt)}
        </p>
      </div>
    </a>
  )
}

export default function D2HelloWorldWidget() {
  const cached = getCachedTechFeedLatest()
  const [feed, setFeed] = useState<TechFeedLatest>(
    cached ?? { d2Video: null, blogs: [] }
  )
  const [loading, setLoading] = useState(cached === null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTechFeedLatestCached()
      .then((nextFeed) => {
        setFeed(nextFeed)
        if (!nextFeed.d2Video && nextFeed.blogs.length === 0) {
          setError('최신 콘텐츠를 가져오지 못했습니다')
        }
      })
      .catch(() => {
        setError('최신 콘텐츠를 불러오는 중 오류가 발생했습니다')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const hasContent = feed.d2Video !== null || feed.blogs.length > 0

  return (
    <BentoCard className="h-full p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium tracking-tight text-muted-foreground">
          최신 기술 콘텐츠
        </h2>
        <a
          href={HELLOWORLD_LIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary no-underline transition-colors hover:underline"
        >
          D2 Hello world
        </a>
      </div>

      {loading ? (
        <TechFeedSkeleton />
      ) : error ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{error}</p>
      ) : !hasContent ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          표시할 콘텐츠가 없습니다
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {feed.d2Video ? <D2VideoCard item={feed.d2Video} /> : null}
          {feed.blogs.map((item) => (
            <TechBlogCard key={`${item.source}-${item.url}`} item={item} />
          ))}
        </div>
      )}
    </BentoCard>
  )
}
