import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  fetchBootcampDoc,
  fetchBootcampDocs,
  type BootcampDoc,
  type BootcampDocSummary,
} from '@/shared/api/bootcamp'
import { MarkdownWithMath } from '@/shared/ui/MarkdownWithMath'

function DocSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-8 w-2/3 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted/80" />
      <div className="mt-8 h-48 w-full rounded-xl bg-muted/60" />
      <div className="h-3 w-full rounded bg-muted/60" />
      <div className="h-3 w-5/6 rounded bg-muted/60" />
    </div>
  )
}

/**
 * 현대오토에버 부트캠프 기록 — `/bootcamp`(과정 소개 = slug 'index'), `/bootcamp/:slug`(프로젝트).
 * 본문은 DB bootcamp_docs, 이미지는 Supabase Storage. 프로젝트 문서 아래에 이전·다음 이동.
 */
export default function BootcampPage() {
  const { slug = 'index' } = useParams<{ slug: string }>()
  // slug별 결과 — 다른 slug 결과면 로딩 중으로 본다 (effect 안에서 초기화하지 않음)
  const [loaded, setLoaded] = useState<{ slug: string; doc: BootcampDoc | null; error?: string } | null>(null)
  const [list, setList] = useState<BootcampDocSummary[]>([])
  const current = loaded?.slug === slug ? loaded : null
  const doc = current ? current.doc : undefined
  const error = current?.error ?? null

  useEffect(() => {
    let cancelled = false
    fetchBootcampDoc(slug)
      .then((d) => !cancelled && setLoaded({ slug, doc: d }))
      .catch((e: Error) => !cancelled && setLoaded({ slug, doc: null, error: e.message }))
    window.scrollTo(0, 0)
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    fetchBootcampDocs()
      .then(setList)
      .catch(() => setList([]))
  }, [])

  const projects = list.filter((d) => d.slug !== 'index')
  const i = projects.findIndex((d) => d.slug === slug)
  const prev = i > 0 ? projects[i - 1] : null
  const next = i >= 0 && i < projects.length - 1 ? projects[i + 1] : null

  return (
    <div className="doc-reader mx-auto max-w-3xl px-6 py-16 sm:px-8">
      {slug !== 'index' ? (
        <Link
          to="/bootcamp"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-primary"
        >
          ← 현대오토에버 부트캠프 기록
        </Link>
      ) : null}

      {error ? (
        <p className="text-destructive">{error}</p>
      ) : doc === undefined ? (
        <DocSkeleton />
      ) : doc === null ? (
        <p className="text-muted-foreground">
          기록을 찾을 수 없습니다. <Link to="/bootcamp">목록으로</Link>
        </p>
      ) : (
        <article className="prose prose-neutral max-w-none dark:prose-invert doc-article [&_blockquote]:not-italic! [&_blockquote_p]:before:content-none [&_blockquote_p]:after:content-none prose-img:rounded-xl prose-img:border prose-img:border-border/60 prose-a:text-primary">
          <MarkdownWithMath>{doc.bodyMd}</MarkdownWithMath>
        </article>
      )}

      {doc && (prev || next) ? (
        <nav
          aria-label="다른 프로젝트 기록"
          className="mt-14 grid gap-3 border-t border-border/60 pt-6 sm:grid-cols-2"
        >
          {prev ? (
            <Link
              to={`/bootcamp/${prev.slug}`}
              className="rounded-xl border border-border/60 p-4 no-underline transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <span className="text-xs text-muted-foreground">← 이전 프로젝트</span>
              <span className="mt-1 block text-sm font-medium text-foreground">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={`/bootcamp/${next.slug}`}
              className="rounded-xl border border-border/60 p-4 text-right no-underline transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <span className="text-xs text-muted-foreground">다음 프로젝트 →</span>
              <span className="mt-1 block text-sm font-medium text-foreground">{next.title}</span>
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  )
}
