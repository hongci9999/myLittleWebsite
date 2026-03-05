import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-6 py-16 text-foreground font-sans">
      <p className="max-w-2xl text-center text-2xl font-semibold leading-relaxed tracking-tight md:text-4xl">
        끊임없이 배워나가는, 끝없이 확장해나가는, 결국 인간을 위하는 개발자
      </p>
      <Link
        to="/main"
        className="inline-flex items-center gap-2 rounded-xl border-2 border-primary bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground no-underline transition-colors hover:bg-primary/90"
      >
        시작하기
        <span aria-hidden>→</span>
      </Link>
    </div>
  )
}
