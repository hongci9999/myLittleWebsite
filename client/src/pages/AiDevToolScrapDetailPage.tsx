import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  fetchAiScrapBySlug,
  sourceKindLabel,
  type AiToolScrap,
} from '@/shared/api/ai-scraps'
import { useAuth } from '@/shared/context/AuthContext'
import { useScrapAdminDialog } from '@/shared/context/ScrapAdminDialogContext'
import { MarkdownWithMath } from '@/shared/ui/MarkdownWithMath'
import { Button } from '@/components/ui/button'

export default function AiDevToolScrapDetailPage() {
  const { slug: slugParam } = useParams<{ slug: string }>()
  const { token } = useAuth()
  const { openScrapAdmin } = useScrapAdminDialog()
  const [scrap, setScrap] = useState<AiToolScrap | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbOff, setDbOff] = useState(false)

  useEffect(() => {
    if (!slugParam) {
      setScrap(null)
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setDbOff(false)
      try {
        const s = await fetchAiScrapBySlug(slugParam)
        if (!cancelled) setScrap(s)
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
        <h1 className="text-xl font-semibold text-foreground">DB를 쓸 수 없습니다</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Supabase와{' '}
          <code className="rounded bg-muted px-1 font-mono text-xs">ai_tool_scraps</code> 마이그레이션을
          확인하세요.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/ai-dev-tools">목록으로</Link>
        </Button>
      </div>
    )
  }

  if (!slugParam || !scrap) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12 text-center sm:px-8 md:px-10 md:py-16">
        <h1 className="text-xl font-semibold text-foreground">없는 항목입니다</h1>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/ai-dev-tools">목록으로</Link>
        </Button>
      </div>
    )
  }

  const s = scrap

  return (
    <div className="mx-auto max-w-3xl px-5 pb-14 pt-6 sm:px-8 md:px-10 md:pb-20 md:pt-8">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground">
          <Link to="/ai-dev-tools">← 목록</Link>
        </Button>
        {token ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => openScrapAdmin({ slug: s.slug })}
          >
            편집
          </Button>
        ) : null}
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
        {sourceKindLabel(s.sourceKind)}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {s.title}
      </h1>

      {s.summary ? (
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{s.summary}</p>
      ) : null}

      <div className="mt-5">
        <Button asChild>
          <a href={s.url} target="_blank" rel="noopener noreferrer">
            원문 열기 →
          </a>
        </Button>
      </div>

      {s.tags.length > 0 ? (
        <ul className="mt-8 flex flex-wrap gap-2">
          {s.tags.map((t) => (
            <li key={t}>
              <span className="inline-flex rounded-full border border-border/60 bg-muted/35 px-3 py-1 text-xs font-medium text-foreground">
                {t}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {s.extraLinks.length > 0 ? (
        <div className="mt-10 border-t border-border/50 pt-8">
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

      {s.bodyMd?.trim() ? (
        <div className="mt-12 border-t border-border/50 pt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            기록 (Markdown)
          </h2>
          <MarkdownWithMath className="prose prose-neutral mt-6 max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-a:text-primary">
            {s.bodyMd}
          </MarkdownWithMath>
        </div>
      ) : (
        <p className="mt-12 text-sm text-muted-foreground">
          상세 본문이 비어 있습니다. 목록 페이지 상단의 스크랩 추가·편집에서 마크다운을 넣을 수 있습니다.
        </p>
      )}

      <p className="mt-12 text-xs text-muted-foreground">
        슬러그: <code className="font-mono text-foreground">{s.slug}</code>
      </p>
    </div>
  )
}
