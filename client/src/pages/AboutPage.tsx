import { useEffect, useMemo, useState } from 'react'
import { MarkdownWithMath } from '@/shared/ui/MarkdownWithMath'
import { extractMarkdownH2Toc } from '@/shared/lib/markdown-headings'
import { cn } from '@/lib/utils'

function AboutPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-4 w-2/3 rounded bg-muted" />
      <div className="h-3 w-full rounded bg-muted/80" />
      <div className="h-3 w-5/6 rounded bg-muted/80" />
      <div className="mt-8 h-6 w-1/3 rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-muted/70" />
        <div className="h-3 w-full rounded bg-muted/70" />
        <div className="h-3 w-4/5 rounded bg-muted/70" />
      </div>
    </div>
  )
}

function AboutTableOfContents({
  items,
  className,
}: {
  items: { id: string; title: string }[]
  className?: string
}) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="목차"
      className={cn(
        'rounded-xl border border-border/60 bg-muted/30 p-4 text-sm',
        className
      )}
    >
      <p className="mb-2 font-medium text-foreground">목차</p>
      <ol className="m-0 list-none space-y-1.5 p-0">
        {items.map(({ id, title }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="text-muted-foreground no-underline transition-colors hover:text-primary"
            >
              {title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default function AboutPage() {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/about.md')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then(setContent)
      .catch((err) => setError(err.message))
  }, [])

  const toc = useMemo(
    () => (content ? extractMarkdownH2Toc(content) : []),
    [content]
  )

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="doc-reader about-page mx-auto max-w-7xl px-6 py-16 sm:px-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] lg:gap-x-16 lg:gap-y-10">
        {content && toc.length > 0 && (
          <AboutTableOfContents
            items={toc}
            className="mb-8 lg:sticky lg:top-24 lg:mb-0 lg:h-fit lg:self-start"
          />
        )}

        <div className="min-w-0">
          {!content ? (
            <AboutPageSkeleton />
          ) : (
            <article className="prose prose-neutral dark:prose-invert max-w-none doc-article">
              <MarkdownWithMath headingIds>{content}</MarkdownWithMath>
            </article>
          )}
        </div>
      </div>
    </div>
  )
}
