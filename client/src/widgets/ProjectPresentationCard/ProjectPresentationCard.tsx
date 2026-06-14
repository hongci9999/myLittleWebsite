import type { ProjectPresentation } from '@/shared/config/projects'
import { cn } from '@/lib/utils'

type Props = {
  presentation: ProjectPresentation
}

function PdfIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M10 13H8" />
      <path d="M16 13h-2" />
      <path d="M10 17H8" />
      <path d="M13 17h3" />
    </svg>
  )
}

export default function ProjectPresentationCard({ presentation }: Props) {
  return (
    <a
      href={presentation.pdfUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group block rounded-2xl border border-border/60 bg-card p-6 shadow-sm no-underline',
        'transition-all hover:border-primary/35 hover:shadow-md focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
    >
      <div className="flex flex-wrap items-start gap-4 sm:gap-6">
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-xl',
            'border border-border/60 bg-muted/35 text-primary',
            'transition-colors group-hover:border-primary/30 group-hover:bg-primary/10'
          )}
        >
          <PdfIcon />
        </div>
        <div className="min-w-0 flex-1">
          {presentation.tags && presentation.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {presentation.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full border border-border/60 bg-muted/35 px-2.5 py-0.5 text-xs font-medium text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {presentation.title}
          </h2>
          {presentation.meta ? (
            <p className="mt-1 text-xs text-muted-foreground">{presentation.meta}</p>
          ) : null}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {presentation.summary}
          </p>
          <p className="mt-4 text-sm font-medium text-primary">발표자료 보기 →</p>
        </div>
      </div>
    </a>
  )
}
