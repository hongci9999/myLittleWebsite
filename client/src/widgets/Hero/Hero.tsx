import { Link } from 'react-router-dom'
import { MAIN_WIDGETS } from '@/shared/config/main-widgets'

export default function Hero() {
  const introWidget = MAIN_WIDGETS.find((w) => w.id === 'intro')

  return (
    <section className="relative w-full shrink-0 overflow-hidden pl-6 pr-[234px] py-10 md:py-[27px]">
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
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <code className="font-mono text-primary">{'<developer />'}</code>
          <span className="text-muted-foreground/60">|</span>
          <code className="font-mono">const motto =</code>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          myLittleWebsite
        </h1>
        {introWidget && (
          <p className="mt-2 text-muted-foreground md:text-base">
            {introWidget.description}
          </p>
        )}
        <div className="mt-4 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 font-mono text-sm">
          <span className="text-muted-foreground">$ </span>
          <span className="text-foreground">
            끊임없이 배워나가는, 끝없이 확장해나가는, 결국 인간을 위하는 개발자
          </span>
          <span className="animate-pulse">_</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            to="/about"
            className="text-sm text-primary no-underline hover:underline"
          >
            이 사이트에 대해 →
          </Link>
        </div>
      </div>
    </section>
  )
}
