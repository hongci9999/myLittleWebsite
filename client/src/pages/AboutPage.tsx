import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        이 사이트에 대해
      </h1>
      <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
        <p>
          자료 정리, 포트폴리오, 기술 학습을 위한 개인 웹사이트입니다.
        </p>
        <p>
          끊임없이 배워나가는, 끝없이 확장해나가는, 결국 인간을 위하는 개발자.
        </p>
        <p>
          포트폴리오, 학습자료, 칼럼, 프로젝트 등 다양한 콘텐츠를 담아갈
          예정입니다.
        </p>
      </div>
      <div className="mt-10 border-t border-border pt-8">
        <h2 className="text-lg font-semibold text-foreground">
          디자인 플레이그라운드
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          폰트, 색상 테마, 컴포넌트 스타일을 실시간으로 비교하고 결정할 수
          있는 도구입니다.
        </p>
        <Link
          to="/design-playground"
          className="mt-3 inline-flex items-center gap-1 text-primary no-underline hover:underline"
        >
          디자인 플레이그라운드 열기
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  )
}
