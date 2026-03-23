import { Link } from 'react-router-dom'
import { MAIN_WIDGETS } from '@/shared/config/main-widgets'

export default function Hero() {
  const introWidget = MAIN_WIDGETS.find((w) => w.id === 'intro')

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
          <span className="text-muted-foreground/60">|</span>
          <code className="font-mono">const motto =</code>
        </div>
        <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
          myLittleWebsite
        </h1>
        {introWidget && (
          <p className="mt-1 text-sm leading-snug text-muted-foreground sm:text-base">
            {introWidget.description}
          </p>
        )}
        <div className="mt-2 rounded-md border border-border/60 bg-muted/30 px-3 py-1.5 font-mono text-xs leading-relaxed sm:py-2 sm:text-sm">
          <span className="text-muted-foreground">$ </span>
          <span className="text-foreground">
            끊임없이 배워나가는, 끝없이 확장해나가는, 결국 인간을 위하는 개발자
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
        </div>
      </div>
    </section>
  )
}
