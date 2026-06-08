import { useCallback, useEffect, useState } from 'react'
import {
  fetchRandomTechInterviewDoc,
  type TechInterviewRandomDoc,
} from '@/shared/api/tech-interview'
import { BentoCard } from '@/shared/ui/BentoCard'
import { MarkdownWithMath } from '@/shared/ui/MarkdownWithMath'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function WidgetSkeleton() {
  return (
    <div className="mt-3 space-y-2" aria-hidden="true">
      <div className="h-5 w-2/3 animate-pulse rounded bg-muted/50" />
      <div className="h-32 animate-pulse rounded-lg bg-muted/40" />
    </div>
  )
}

export default function TechInterviewRandomWidget() {
  const [doc, setDoc] = useState<TechInterviewRandomDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await fetchRandomTechInterviewDoc()
      if (!next) {
        setDoc(null)
        setError('문서를 불러오지 못했습니다')
        return
      }
      setDoc(next)
    } catch {
      setDoc(null)
      setError('문서를 불러오는 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <BentoCard className="flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="text-sm font-medium tracking-tight text-muted-foreground">
            CS 한 조각
          </h2>
          {doc ? (
            <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {doc.category}
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            disabled={loading}
            onClick={() => void load()}
          >
            다른 문서
          </Button>
          {doc ? (
            <a
              href={doc.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground no-underline transition-colors hover:bg-primary/90"
            >
              원문 보기
            </a>
          ) : null}
        </div>
      </div>

      <div className="scrollbar-gutter mt-3 min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <WidgetSkeleton />
        ) : error ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{error}</p>
        ) : doc ? (
          <article>
            <h3 className="text-base font-semibold leading-snug text-foreground">
              {doc.title}
            </h3>
            <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground/80">
              {doc.path}
            </p>
            <MarkdownWithMath
              className={cn(
                'prose prose-neutral mt-3 max-w-none text-sm dark:prose-invert',
                'prose-headings:text-foreground prose-p:leading-relaxed',
                'prose-pre:text-xs prose-code:text-xs',
                'prose-img:max-h-48 prose-img:object-contain'
              )}
            >
              {doc.content}
            </MarkdownWithMath>
          </article>
        ) : null}
      </div>

      <p className="mt-2 shrink-0 text-[10px] text-muted-foreground/70">
        출처:{' '}
        <a
          href="https://github.com/gyoogle/tech-interview-for-developer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary no-underline hover:underline"
        >
          gyoogle/tech-interview-for-developer
        </a>
      </p>
    </BentoCard>
  )
}
