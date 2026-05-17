import { PROJECT_ITEMS } from '@/shared/config/projects'
import { ProjectCard } from '@/widgets/ProjectCard'

export default function ProjectPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">프로젝트</h1>
        <p className="mt-4 text-muted-foreground">
          사이드 프로젝트와 실험을 기록합니다. 저장소와 스크린샷으로 빠르게 살펴볼 수 있습니다.
        </p>
      </header>

      {PROJECT_ITEMS.length === 0 ? (
        <p className="mt-10 text-muted-foreground">등록된 프로젝트가 없습니다.</p>
      ) : (
        <ul className="mt-10 space-y-12">
          {PROJECT_ITEMS.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
