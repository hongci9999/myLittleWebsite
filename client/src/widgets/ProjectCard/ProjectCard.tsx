import type { ProjectItem } from '@/shared/config/projects'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<ProjectItem['status'], string> = {
  active: '진행 중',
  paused: '보류',
  archived: '종료',
}

function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.062 2.062 0 012.063-2.063 2.062 2.062 0 012.063 2.065 2.062 2.062 0 01-2.063 2.063zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function isLinkedInUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').includes('linkedin.com')
  } catch {
    return false
  }
}

type Props = {
  project: ProjectItem
}

function ProjectScreenshots({ project }: Props) {
  const shots =
    project.screenshots && project.screenshots.length > 0
      ? project.screenshots
      : [{ src: project.screenshotSrc, alt: project.screenshotAlt }]

  if (shots.length === 1) {
    return (
      <div className="border-b border-border/50 bg-muted/20">
        <img
          src={shots[0].src}
          alt={shots[0].alt}
          className="aspect-[16/10] w-full object-cover object-top"
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 border-b border-border/50 bg-muted/20 sm:grid-cols-3">
      {shots.map((shot) => (
        <figure
          key={shot.src}
          className="relative min-w-0 border-border/40 sm:border-r sm:last:border-r-0"
        >
          <img
            src={shot.src}
            alt={shot.alt}
            className="aspect-[4/3] w-full object-cover object-top sm:aspect-[3/4]"
            loading="lazy"
          />
          {shot.caption ? (
            <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 text-center text-xs font-medium text-white">
              {shot.caption}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  )
}

export default function ProjectCard({ project }: Props) {
  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm',
        'transition-all hover:border-primary/35 hover:shadow-md'
      )}
    >
      <ProjectScreenshots project={project} />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary/90">
            {STATUS_LABEL[project.status]}
          </span>
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-full border border-border/60 bg-muted/35 px-2.5 py-0.5 text-xs font-medium text-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {project.title}
        </h2>
        {project.meta ? (
          <p className="mt-1 text-xs text-muted-foreground">{project.meta}</p>
        ) : null}
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {project.summary}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {project.repoUrl ? (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-medium text-foreground no-underline transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <GithubIcon />
              GitHub
              <ExternalLinkIcon />
            </a>
          ) : null}
          {project.postUrl ? (
            <a
              href={project.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-medium text-foreground no-underline transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {isLinkedInUrl(project.postUrl) ? <LinkedInIcon /> : null}
              구축 후기
              <ExternalLinkIcon />
            </a>
          ) : null}
          {project.demoUrl ? (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-medium text-foreground no-underline transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              라이브 데모
              <ExternalLinkIcon />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}
