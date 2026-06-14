import { PROJECT_ITEMS, PROJECT_PRESENTATIONS } from '@/shared/config/projects'
import { ProjectCard } from '@/widgets/ProjectCard'
import { ProjectPresentationCard } from '@/widgets/ProjectPresentationCard'

export default function ProjectPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">프로젝트</h1>
        <p className="mt-4 text-muted-foreground">
          사이드 프로젝트와 실험을 기록합니다. 저장소와 스크린샷으로 빠르게 살펴볼 수 있습니다.
        </p>
      </header>

      {PROJECT_ITEMS.length === 0 ? (
        <p className="mt-10 text-muted-foreground">등록된 프로젝트가 없습니다.</p>
      ) : (
        <ul className="mt-10 grid list-none gap-8 p-0 sm:grid-cols-2 sm:gap-10">
          {PROJECT_ITEMS.map((project) => (
            <li key={project.id} className="min-w-0">
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}

      {PROJECT_PRESENTATIONS.length > 0 ? (
        <section className="mt-16 border-t border-border/60 pt-12 sm:mt-20 sm:pt-14">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">발표 · 세미나</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            동아리·세미나에서 진행한 발표 자료입니다. 항목을 누르면 PDF 슬라이드를 볼 수 있습니다.
          </p>
          <ul className="mt-8 grid list-none gap-6 p-0">
            {PROJECT_PRESENTATIONS.map((presentation) => (
              <li key={presentation.id} className="min-w-0">
                <ProjectPresentationCard presentation={presentation} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
