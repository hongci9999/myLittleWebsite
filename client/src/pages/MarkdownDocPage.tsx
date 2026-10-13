import { useEffect, useState } from 'react'
import { MarkdownWithMath } from '@/shared/ui/MarkdownWithMath'

function PatchNotesSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted/80" />
      <div className="mt-10 h-10 w-full rounded-xl bg-muted/60" />
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-full bg-muted/70" />
        <div className="h-3 flex-1 rounded bg-muted/50" />
      </div>
      <div className="space-y-2 pl-4">
        <div className="h-3 w-full rounded bg-muted/60" />
        <div className="h-3 w-5/6 rounded bg-muted/60" />
      </div>
    </div>
  )
}

export default function PatchNotesPage() {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/changelog.md')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then(setContent)
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="doc-reader patch-notes-page mx-auto max-w-3xl px-6 py-16 sm:px-8">
      {!content ? (
        <PatchNotesSkeleton />
      ) : (
        <article className="prose prose-neutral dark:prose-invert max-w-none doc-article">
          <MarkdownWithMath changelogHeadings>{content}</MarkdownWithMath>
        </article>
      )}
    </div>
  )
}
