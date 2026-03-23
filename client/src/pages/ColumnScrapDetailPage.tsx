import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  fetchColumnScrapBySlug,
  columnSourceLabel,
  type ColumnScrap,
} from '@/shared/api/column-scraps'
import { parseYoutubeVideoId, youtubeNocookieEmbedSrc } from '@/shared/lib/youtube'
import { MarkdownWithMath } from '@/shared/ui/MarkdownWithMath'
import { Button } from '@/components/ui/button'
import { ColumnScrapAdminDialog, subscribeColumnScrapsChanged } from '@/widgets/ColumnScrapAdminDialog'
import { useAuth } from '@/shared/context/AuthContext'

export default function ColumnScrapDetailPage() {
  const { slug: slugParam } = useParams<{ slug: string }>()
  const { token } = useAuth()
  const [scrap, setScrap] = useState<ColumnScrap | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbOff, setDbOff] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  useEffect(() => {
    if (!slugParam) {
      setScrap(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setDbOff(false)
    ;(async () => {
      try {
        const item = await fetchColumnScrapBySlug(slugParam)
        if (!cancelled) setScrap(item)
      } catch (e) {
        if (!cancelled) {
          setScrap(null)
          if (e instanceof Error && e.message === 'SERVICE_UNAVAILABLE') {
            setDbOff(true)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slugParam])

  useEffect(() => {
    return subscribeColumnScrapsChanged(() => {
      if (!slugParam) return
      void fetchColumnScrapBySlug(slugParam).then(setScrap)
    })
  }, [slugParam])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12 text-center text-sm text-muted-foreground sm:px-8 md:px-10 md:py-16">
        불러오는 중…
      </div>
    )
  }

  if (dbOff) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12 text-center sm:px-8 md:px-10 md:py-16">
        <p className="text-xl font-semibold text-foreground">DB를 쓸 수 없습니다</p>
        <p className="mt-2 text-sm text-muted-foreground">
          <code className="rounded bg-muted px-1 font-mono text-xs">column_scraps</code> 마이그레이션을
          확인하세요.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/column">목록</Link>
        </Button>
      </div>
    )
  }

  if (!slugParam || !scrap) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center md:py-16">
        <p className="text-xl font-semibold text-foreground">없는 항목입니다</p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/column">목록</Link>
        </Button>
      </div>
    )
  }

  const s = scrap
  const ytId = s.sourceKind === 'youtube' ? parseYoutubeVideoId(s.url) : null

  return (
    <>
      <ColumnScrapAdminDialog
        open={adminOpen}
        onOpenChange={setAdminOpen}
        initialSlug={adminOpen ? s.slug : null}
      />
      <div className="mx-auto max-w-3xl px-5 pb-14 pt-6 sm:px-8 md:px-10 md:pb-20 md:pt-8">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground">
            <Link to="/column">← 목록</Link>
          </Button>
          {token ? (
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setAdminOpen(true)}>
              편집
            </Button>
          ) : null}
        </div>

        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
          {columnSourceLabel(s.sourceKind)}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{s.title}</h1>

        <div className="mt-6 space-y-4">
          {ytId ? (
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-border/60 bg-muted/30 shadow-sm">
              <iframe
                title={s.title}
                src={youtubeNocookieEmbedSrc(ytId)}
                className="size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                원문 열기 →
              </a>
            </Button>
          </div>
        </div>

        {s.extraLinks.length > 0 ? (
          <div className="mt-8 border-t border-border/50 pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              추가 링크
            </h2>
            <ul className="mt-3 space-y-2">
              {s.extraLinks.map((l, i) => (
                <li key={`${l.url}-${i}`}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {s.tags.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-2">
            {s.tags.map((t) => (
              <li key={t}>
                <span className="inline-flex rounded-full border border-border/60 bg-muted/35 px-3 py-1 text-xs font-medium text-foreground">
                  {t}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {s.summary ? (
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground md:text-base">{s.summary}</p>
        ) : null}

        {s.bodyMd?.trim() ? (
          <div className="mt-8 border-t border-border/50 pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">메모·요약</h2>
            <MarkdownWithMath className="prose prose-neutral mt-4 max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-a:text-primary">
              {s.bodyMd}
            </MarkdownWithMath>
          </div>
        ) : null}

        <p className="mt-10 text-xs text-muted-foreground">
          슬러그: <code className="font-mono text-foreground">{s.slug}</code>
        </p>
      </div>
    </>
  )
}
