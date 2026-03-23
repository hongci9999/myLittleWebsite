import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const TOC = [
  { href: '#agent-skills-w', label: 'Agent Skills' },
  { href: '#cursor-rules-w', label: 'Cursor Rules' },
  { href: '#mcp-w', label: 'MCP' },
  { href: '#impeccable-w', label: 'Impeccable' },
  { href: '#workspace-paths-w', label: '이 레포 경로' },
] as const

function TocNav({ className }: { className?: string }) {
  return (
    <nav className={cn('text-sm', className)} aria-label="개요 목차">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        목차
      </p>
      <ul className="space-y-1.5 border-l border-border/60 pl-3">
        {TOC.map(({ href, label }) => (
          <li key={href}>
            <a
              href={href}
              className="block py-0.5 text-muted-foreground transition-colors hover:text-primary"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Section({
  id,
  title,
  kicker,
  children,
}: {
  id: string
  title: string
  kicker?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      {kicker ? (
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">
          {kicker}
        </p>
      ) : null}
      <h3 className="mt-1.5 text-xl font-bold tracking-tight text-foreground md:text-2xl">
        {title}
      </h3>
      <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground md:text-base">
        {children}
      </div>
    </section>
  )
}

function PathRow({ path, note }: { path: string; note: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/40 py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4">
      <code className="shrink-0 font-mono text-xs text-foreground sm:text-sm">
        {path}
      </code>
      <p className="text-xs text-muted-foreground sm:text-sm">{note}</p>
    </div>
  )
}

/**
 * 메인 전용: 스킬·룰·MCP 등 AI 개발 도구 개념 요약.
 * 내부 참고 페이지(`/skills-intro` 등) 링크는 같은 맥락에서만 추가.
 */
export default function AiDevToolsOverviewWidget() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4 shadow-sm sm:p-5">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Reference · 메인 위젯
        </p>
        <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          AI 개발 도구 개요
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
          에이전트 <strong className="font-medium text-foreground">스킬</strong>
          , 편집기 <strong className="font-medium text-foreground">룰</strong>,{' '}
          <strong className="font-medium text-foreground">MCP</strong>가 각각
          무엇인지 짧게 정리한 참고 블록입니다. 위계·여백만 맞춘 미니
          레이아웃입니다.
        </p>
      </header>

      <div className="mt-4 md:hidden">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          바로 이동
        </p>
        <div className="flex flex-wrap gap-2">
          {TOC.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground no-underline transition-colors hover:border-primary/40"
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-5 md:mt-6 md:grid md:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] md:gap-6 lg:gap-8">
        <div className="hidden md:block">
          <div className="sticky top-28">
            <TocNav />
          </div>
        </div>

        <div className="min-w-0 space-y-8 md:space-y-10">
          <Section
            id="agent-skills-w"
            title="Agent Skills"
            kicker="Portable instructions"
          >
            <p>
              <strong className="text-foreground">Agent Skills</strong>는
              에이전트에게 특정 작업 방식을 가르치는 패키지입니다. 보통{' '}
              <code className="font-mono text-xs">SKILL.md</code>와 선택적{' '}
              <code className="font-mono text-xs">references/</code> 등이
              붙습니다.
            </p>
            <p>
              Cursor는{' '}
              <code className="rounded bg-muted px-1 font-mono text-xs">
                .agents/skills/
              </code>{' '}
              등에서 이를 읽습니다.
            </p>
            <ul className="list-inside list-disc space-y-1 marker:text-primary/60">
              <li>
                <a
                  href="https://agentskills.io/"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  agentskills.io
                </a>
              </li>
              <li>
                <a
                  href="https://cursor.com/docs/context/skills"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Agent Skills (Cursor)
                </a>
              </li>
            </ul>
          </Section>

          <Section
            id="cursor-rules-w"
            title="Cursor Rules"
            kicker="Always-on & scoped"
          >
            <p>
              <strong className="text-foreground">Rules</strong>는{' '}
              <code className="rounded bg-muted px-1 font-mono text-xs">
                .cursor/rules/
              </code>
              의 <code className="font-mono text-xs">.mdc</code>로, 항상
              적용되거나 glob으로 파일에만 걸립니다.
            </p>
            <div className="rounded-lg border-l-4 border-primary/30 bg-muted/20 py-3 pl-4 pr-3">
              <p className="text-sm text-foreground">
                이 레포에는 foundation·docs·git·stack 등 규칙이 있습니다.
              </p>
            </div>
          </Section>

          <Section
            id="mcp-w"
            title="MCP (Model Context Protocol)"
            kicker="Tools & resources"
          >
            <p>
              <strong className="text-foreground">MCP</strong>는 모델이 호출하는{' '}
              <strong className="text-foreground">도구</strong>와 읽는{' '}
              <strong className="text-foreground">리소스</strong>를 표준으로
              노출하는 프로토콜입니다.
            </p>
            <p>
              <a
                href="https://modelcontextprotocol.io/"
                className="font-medium text-primary underline-offset-4 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                modelcontextprotocol.io
              </a>
            </p>
          </Section>

          <Section id="impeccable-w" title="Impeccable" kicker="Design fluency">
            <p>
              <a
                href="https://impeccable.style/"
                className="font-medium text-primary underline-offset-4 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Impeccable
              </a>
              는 디자인 관련 Agent Skills 묶음입니다. 타이포·레이아웃 등을 스킬
              단위로 나눕니다.
            </p>
            <p>
              <Link
                to="/skills-intro"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Impeccable·스킬 소개 (이 사이트)
              </Link>
              — 이 레포에 쓰는 스킬 요약·프롬프트 예시·데모 페이지입니다.
            </p>
          </Section>

          <Section
            id="workspace-paths-w"
            title="이 워크스페이스 경로"
            kicker="Quick reference"
          >
            <div className="rounded-xl border border-border/60 bg-background/50 px-3 py-0.5">
              <PathRow path=".agents/skills/" note="Agent Skills" />
              <PathRow path=".cursor/rules/" note="Cursor Rules" />
              <PathRow path=".cursor/" note="Cursor 프로젝트 설정 루트" />
              <PathRow path="docs/" note="기록·결정·계획" />
            </div>
            <p className="text-xs text-muted-foreground">
              MCP 연결 설정은 Cursor UI·사용자 설정 쪽에 둘 때가 많습니다.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}
