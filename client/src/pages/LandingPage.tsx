import { Link } from 'react-router-dom'
import { Infinity as InfinityIcon, Rocket, Brain } from 'lucide-react'
import AnimatedShaderBackground from '@/components/ui/animated-shader-background'

const values = [
  { icon: InfinityIcon, label: 'Reason-First' },
  { icon: Rocket, label: 'Always Extensible' },
  { icon: Brain, label: 'For Humans' },
] as const

export default function LandingPage() {
  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-black font-sans text-white">
      <AnimatedShaderBackground />

      {/* 셰이더 위 가독성을 위한 어둑한 비네트 오버레이 */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/40 via-transparent to-black/70" />

      <div className="relative z-10 flex min-h-svh flex-col items-center justify-center gap-10 px-6 py-16 text-center">
        <span className="animate-float rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-white/80 backdrop-blur-sm">
          myLittleWebsite
        </span>

        <h1 className="max-w-3xl text-3xl font-semibold leading-relaxed tracking-tight md:text-5xl md:leading-[1.3]">
          학습을 기록하고,
          <br className="hidden sm:block" /> 생각을 정리하고,
          <br className="hidden sm:block" /> 만든 것을 보여주는 공간
        </h1>

        <ul className="flex flex-wrap items-center justify-center gap-3">
          {values.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 backdrop-blur-sm"
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </li>
          ))}
        </ul>

        <Link
          to="/main"
          className="group inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-semibold text-white no-underline backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/20"
        >
          시작하기
          <span
            aria-hidden
            className="transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </div>
    </div>
  )
}
