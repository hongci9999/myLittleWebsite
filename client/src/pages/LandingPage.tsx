import { Link } from 'react-router-dom'
import { useScrollReveal } from '@/shared/hooks/useScrollReveal'

const PHRASES = [
  '끊임없이 배워나가는',
  '끝없이 확장해나가는',
  '결국 인간을 위하는 개발자',
]

function RevealSection({
  phrase,
  delay = 0,
}: {
  phrase: string
  delay?: number
}) {
  const { ref, isVisible } = useScrollReveal(0.15)

  return (
    <section
      ref={ref}
      className="flex min-h-[85vh] items-center justify-center px-6 transition-all duration-700 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(32px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      <p className="max-w-3xl text-center text-3xl font-semibold leading-relaxed tracking-tight md:text-5xl md:leading-tight">
        {phrase}
      </p>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-svh bg-background text-foreground font-sans">
      {PHRASES.map((phrase, i) => (
        <RevealSection key={phrase} phrase={phrase} delay={i * 120} />
      ))}
      <section className="flex min-h-[85vh] items-center justify-center px-6">
        <Link
          to="/main"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-primary bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground no-underline transition-all hover:bg-primary/90 hover:shadow-lg"
        >
          시작하기
          <span aria-hidden>→</span>
        </Link>
      </section>
    </div>
  )
}
