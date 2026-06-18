import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="relative w-full shrink-0 overflow-hidden px-4 py-2 sm:px-6 sm:py-3 lg:pr-40 2xl:pr-[14.625rem]">
      {/* 그리드 패턴 배경 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                           linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative mx-auto max-w-2xl text-left">
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
          <code className="font-mono text-primary">{'<developer />'}</code>
        </div>
        <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
          myLittleWebsite
        </h1>
        <div className="mt-2 rounded-md border border-border/60 bg-muted/30 px-3 py-1.5 font-mono text-xs leading-relaxed sm:py-2 sm:text-sm">
          <span className="text-muted-foreground">$ </span>
          <span className="text-foreground">
            자료 정리, 포트폴리오, 기술 학습을 위한 개인 웹사이트입니다
          </span>
          <span className="animate-pulse">_</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Link
            to="/about"
            className="text-sm text-primary no-underline hover:underline"
          >
            이 사이트에 대해 →
          </Link>
          <Link
            to="/patch-notes"
            className="text-sm text-primary no-underline hover:underline"
          >
            패치노트 →
          </Link>
          <span className="text-muted-foreground/40" aria-hidden>
            |
          </span>
          <div className="flex items-center gap-1">
            <a
              href="https://github.com/hongci9999"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover-bg hover:text-foreground transition-colors"
              aria-label="GitHub 프로필 (새 탭)"
              title="GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 .5C5.73.5.5 5.73.5 12.04c0 5.1 3.29 9.42 7.86 10.95.58.11.79-.25.79-.56v-2.02c-3.2.7-3.88-1.37-3.88-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.78 2.7 1.27 3.36.97.1-.75.4-1.27.73-1.56-2.56-.29-5.25-1.29-5.25-5.74 0-1.27.45-2.3 1.2-3.12-.12-.3-.52-1.49.11-3.1 0 0 .98-.32 3.2 1.19a11 11 0 0 1 5.83 0c2.22-1.51 3.2-1.19 3.2-1.19.63 1.61.23 2.8.11 3.1.75.82 1.2 1.85 1.2 3.12 0 4.46-2.7 5.44-5.27 5.73.41.36.78 1.07.78 2.16v3.2c0 .31.21.68.8.56A11.55 11.55 0 0 0 23.5 12.04C23.5 5.73 18.27.5 12 .5z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/feed/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover-bg hover:text-foreground transition-colors"
              aria-label="LinkedIn 프로필 (새 탭)"
              title="LinkedIn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
