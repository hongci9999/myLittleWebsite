import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold">About</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">이 사이트에 대해</h2>
        <p className="text-muted-foreground leading-relaxed">
          자료 정리, 포트폴리오, 기술 학습을 위한 개인 웹사이트입니다.
          끊임없이 배워나가는, 끝없이 확장해나가는, 결국 인간을 위하는 개발자를 지향합니다.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">디자인 플레이그라운드</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          이 사이트의 폰트, 색상 테마, 컴포넌트 스타일을 실시간으로 비교하고 결정할 수 있는 도구입니다.
          선택한 결과를 복사해 AI에게 전달하면 디자인 시스템에 반영할 수 있습니다.
        </p>
        <Link
          to="/design-playground"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          디자인 플레이그라운드 열기
        </Link>
      </section>
    </div>
  )
}
