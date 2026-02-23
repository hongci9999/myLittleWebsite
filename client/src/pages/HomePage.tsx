import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-3xl font-bold tracking-tight">myLittleWebsite</h1>
      <p className="text-muted-foreground text-center max-w-md">
        자료 정리, 포트폴리오, 기술 학습을 위한 개인 웹사이트
      </p>
      <p className="text-sm text-muted-foreground/80">
        shadcn/ui 적용됨
      </p>
      <div className="flex gap-2 mt-2">
        <Button>시작하기</Button>
        <Button variant="outline">자세히 보기</Button>
      </div>
    </div>
  )
}
