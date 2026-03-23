import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

type SkillItem = {
  name: string
  /** SKILL.md description (English, upstream) */
  description: string
  /** 한 줄 요약 */
  summaryKo: string
}

type SkillGroup = {
  id: string
  titleKo: string
  items: SkillItem[]
}

const SKILL_GROUPS: SkillGroup[] = [
  {
    id: 'foundation',
    titleKo: '기반·설정',
    items: [
      {
        name: 'frontend-design',
        description:
          'Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications. Generates creative, polished code that avoids generic AI aesthetics.',
        summaryKo:
          '페이지·컴포넌트 전반을 고품질로 만들 때. 획일적인 AI 느낌을 피하는 미학.',
      },
      {
        name: 'teach-impeccable',
        description:
          'One-time setup that gathers design context for your project and saves it to your AI config file. Run once to establish persistent design guidelines.',
        summaryKo:
          '최초 1회: 팀·프로젝트 디자인 맥락을 묻고 `.impeccable.md` 등에 저장.',
      },
    ],
  },
  {
    id: 'visual',
    titleKo: '타이포·레이아웃·색',
    items: [
      {
        name: 'typeset',
        description:
          'Improve typography by fixing font choices, hierarchy, sizing, weight consistency, and readability. Makes text feel intentional and polished.',
        summaryKo: '글꼴·위계·크기·굵기·가독성을 다듬어 타이포를 의도적으로.',
      },
      {
        name: 'arrange',
        description:
          'Improve layout, spacing, and visual rhythm. Fixes monotonous grids, inconsistent spacing, and weak visual hierarchy to create intentional compositions.',
        summaryKo:
          '간격·그리드 단조로움·약한 위계를 고쳐 레이아웃 리듬을 만듦.',
      },
      {
        name: 'colorize',
        description:
          'Add strategic color to features that are too monochromatic or lack visual interest. Makes interfaces more engaging and expressive.',
        summaryKo: '너무 무채색인 화면에 전략적으로 색을 더함.',
      },
      {
        name: 'bolder',
        description:
          'Amplify safe or boring designs to make them more visually interesting and stimulating. Increases impact while maintaining usability.',
        summaryKo:
          '무난한 UI를 더 자극적으로—가용성은 유지한 채 임팩트 상승.',
      },
      {
        name: 'quieter',
        description:
          'Tone down overly bold or visually aggressive designs. Reduces intensity while maintaining design quality and impact.',
        summaryKo: '과한 대비·공격성을 줄이되 품질은 유지.',
      },
      {
        name: 'distill',
        description:
          'Strip designs to their essence by removing unnecessary complexity. Great design is simple, powerful, and clean.',
        summaryKo: '불필요한 복잡도를 걷어내 본질만 남김.',
      },
    ],
  },
  {
    id: 'motion',
    titleKo: '모션·특수 연출',
    items: [
      {
        name: 'animate',
        description:
          'Review a feature and enhance it with purposeful animations, micro-interactions, and motion effects that improve usability and delight.',
        summaryKo:
          '의미 있는 애니메이션·마이크로 인터랙션으로 사용성과 즐거움 보강.',
      },
      {
        name: 'overdrive',
        description:
          'Push interfaces past conventional limits with technically ambitious implementations. Whether that\'s a shader, a 60fps virtual table, spring physics on a dialog, or scroll-driven reveals — make users ask "how did they do that?"',
        summaryKo:
          '셰이더·스프링·스크롤 연출 등 기술적으로 과감한 구현(실험적).',
      },
      {
        name: 'delight',
        description:
          'Add moments of joy, personality, and unexpected touches that make interfaces memorable and enjoyable to use. Elevates functional to delightful.',
        summaryKo: '기능적 UI에 재미·개성·기억에 남는 디테일을 더함.',
      },
    ],
  },
  {
    id: 'quality',
    titleKo: '품질·접근·리뷰',
    items: [
      {
        name: 'polish',
        description:
          'Final quality pass before shipping. Fixes alignment, spacing, consistency, and detail issues that separate good from great.',
        summaryKo: '출시 직전 정렬·간격·일관성·디테일 마무리.',
      },
      {
        name: 'audit',
        description:
          'Perform comprehensive audit of interface quality across accessibility, performance, theming, and responsive design. Generates detailed report of issues with severity ratings and recommendations.',
        summaryKo:
          '접근성·성능·테마·반응형을 종합 점검하고 심각도·권장안 리포트.',
      },
      {
        name: 'critique',
        description:
          'Evaluate design effectiveness from a UX perspective. Assesses visual hierarchy, information architecture, emotional resonance, and overall design quality with actionable feedback.',
        summaryKo:
          'UX 관점에서 위계·정보 구조·감성적 설득력 등을 평가·피드백.',
      },
      {
        name: 'harden',
        description:
          'Improve interface resilience through better error handling, i18n support, text overflow handling, and edge case management. Makes interfaces robust and production-ready.',
        summaryKo:
          '에러 처리·i18n·텍스트 넘침·엣지 케이스로 견고함을 높임.',
      },
    ],
  },
  {
    id: 'system',
    titleKo: '시스템·성능·적응',
    items: [
      {
        name: 'extract',
        description:
          'Extract and consolidate reusable components, design tokens, and patterns into your design system. Identifies opportunities for systematic reuse and enriches your component library.',
        summaryKo:
          '컴포넌트·토큰·패턴을 뽑아 디자인 시스템·라이브러리로 정리.',
      },
      {
        name: 'normalize',
        description:
          'Normalize design to match your design system and ensure consistency',
        summaryKo: '디자인 시스템에 맞춰 스타일·패턴을 일관되게 맞춤.',
      },
      {
        name: 'optimize',
        description:
          'Improve interface performance across loading speed, rendering, animations, images, and bundle size. Makes experiences faster and smoother.',
        summaryKo:
          '로딩·렌더·애니·이미지·번들 등 퍼포먼스 개선.',
      },
      {
        name: 'adapt',
        description:
          'Adapt designs to work across different screen sizes, devices, contexts, or platforms. Ensures consistent experience across varied environments.',
        summaryKo:
          '화면 크기·기기·맥락·플랫폼에 맞게 레이아웃·패턴을 적응.',
      },
    ],
  },
  {
    id: 'ux-writing',
    titleKo: '카피·온보딩',
    items: [
      {
        name: 'clarify',
        description:
          'Improve unclear UX copy, error messages, microcopy, labels, and instructions. Makes interfaces easier to understand and use.',
        summaryKo: '라벨·에러 문구·설명을 명확하게 다듬음.',
      },
      {
        name: 'onboard',
        description:
          'Design or improve onboarding flows, empty states, and first-time user experiences. Helps users get started successfully and understand value quickly.',
        summaryKo:
          '온보딩·빈 상태·첫 방문 경험을 설계·개선.',
      },
    ],
  },
]

const PROMPT_EXAMPLES: { title: string; body: string }[] = [
  {
    title: 'typeset — 학습 문서 페이지 타이포',
    body: '`typeset` 스킬 기준으로 `LearningBrowserPage` 본문 영역 타이포를 다듬어줘. 제목/부제/본문 위계, 줄간, 모바일에서의 크기만 조정하고 로직은 건드리지 마.',
  },
  {
    title: 'arrange — 카드 리스트 간격',
    body: '`arrange` 스킬로 링크 목록 그리드의 간격과 시각적 리듬을 정리해줘. 카드를 또 감싸지 말고, Tailwind와 기존 테마 변수만 사용해.',
  },
  {
    title: 'audit — 접근성 스캔',
    body: '`audit` 스킬로 헤더와 메인 내비를 접근성·포커스 순서·색 대비 관점에서 점검하고, 심각도 높은 것부터 권장 수정안을 목록으로 줘.',
  },
  {
    title: 'polish — 출시 전 패스',
    body: '`polish` 스킬로 방금 만든 폼 다이얼로그에 정렬, 호버/포커스 상태, 작은 간격 불일치를 잡아줘. MVP 수준이 아니라 이 사이트 톤에 맞게.',
  },
  {
    title: 'frontend-design — 새 위젯 초안',
    body: '`frontend-design` 스킬과 사이트 `docs/decisions/0009-design-rules.md`를 반영해서 즐겨찾기 링크용 작은 위젯 초안을 만들어줘. shadcn Button은 유지.',
  },
]

function CopyPromptButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setDone(true)
      window.setTimeout(() => setDone(false), 2000)
    } catch {
      setDone(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0 text-xs"
      onClick={copy}
    >
      {done ? '복사됨' : '프롬프트 복사'}
    </Button>
  )
}

function TypographyBeforeAfter() {
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <figure className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <figcaption className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Before — 단조로운 위계
        </figcaption>
        <div className="space-y-2 font-sans text-sm text-foreground">
          <p className="text-sm font-normal">페이지 제목입니다</p>
          <p className="text-sm font-normal">부제 역시 같은 크기</p>
          <p className="text-sm leading-normal text-muted-foreground">
            본문도 모두 비슷한 크기와 줄간으로 읽기 피로가 생길 수 있습니다.
          </p>
        </div>
      </figure>
      <figure className="rounded-xl border border-primary/25 bg-card/50 p-4 shadow-sm">
        <figcaption className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
          After — typeset 적용 시 지향점(예시)
        </figcaption>
        <div className="space-y-3 font-sans text-foreground">
          <h3 className="text-lg font-bold tracking-tight md:text-xl">
            페이지 제목입니다
          </h3>
          <p className="text-sm font-medium text-muted-foreground">
            부제는 한 단계 낮춰 보조 정보로
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            본문은 조금 더 크게, 줄간을 넉넉히 두어 장문도 읽기 쉽게.
          </p>
        </div>
      </figure>
    </div>
  )
}

function ArrangeBeforeAfter() {
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <figure className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <figcaption className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Before — 균일한 간격
        </figcaption>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 rounded-md border border-border/50 bg-background"
            />
          ))}
        </div>
      </figure>
      <figure className="rounded-xl border border-primary/25 bg-card/50 p-4 shadow-sm">
        <figcaption className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
          After — arrange 적용 시 지향점(예시)
        </figcaption>
        <div className="flex flex-col gap-2">
          <div className="h-12 rounded-md border border-border/50 bg-background" />
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="h-8 rounded-md border border-border/40 bg-muted/30" />
            <div className="h-8 rounded-md border border-border/40 bg-muted/30" />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          덩어리 안은 촘촘히, 덩어리 사이는 넓게—리듬을 달리함.
        </p>
      </figure>
    </div>
  )
}

export default function ImpeccableSkillsIntroPage() {
  const totalSkills = SKILL_GROUPS.reduce((n, g) => n + g.items.length, 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-24">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        임시 페이지 · 삭제 예정
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        Impeccable 스킬 소개
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        이 사이트 레포에 설치된{' '}
        <strong className="font-semibold text-foreground">Agent Skills</strong>(
        {totalSkills}개)의 역할 요약, 공식 설명, Cursor용 프롬프트 예시, 정적
        Before/After 예시를 모았습니다.
      </p>

      <div className="mt-12 border-l-2 border-primary/50 bg-muted/30 py-4 pl-5 pr-4">
        <h2 className="text-sm font-semibold text-foreground">
          Impeccable이란?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Anthropic의{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
            frontend-design
          </code>{' '}
          스킬을 확장한 디자인 지침 모음입니다. 타이포·레이아웃·색·모션 등을
          &ldquo;디자인 언어&rdquo;로 요청할 수 있게 나눈 패키지입니다.
        </p>
        <a
          href="https://impeccable.style/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          impeccable.style →
        </a>
      </div>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          이 프로젝트에 설치된 위치
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
            .agents/skills/
          </code>
          각 폴더의{' '}
          <code className="font-mono text-xs text-foreground">SKILL.md</code>
          가 원문입니다. 아래 설명의 영문은 해당 파일의{' '}
          <code className="font-mono text-xs">description</code>과 동일합니다.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          스킬별 기능
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          그룹별로 접어 두었습니다. 이름은 Agent 채팅에서{' '}
          <kbd className="rounded border border-border bg-background px-1 font-mono text-xs">
            /
          </kbd>{' '}
          검색·
          <kbd className="rounded border border-border bg-background px-1 font-mono text-xs">
            @
          </kbd>
          첨부에 그대로 쓰입니다.
        </p>

        <div className="mt-8 space-y-4">
          {SKILL_GROUPS.map((group) => (
            <details
              key={group.id}
              className="group rounded-2xl border border-border/60 bg-card/30 open:bg-card/50 open:shadow-sm"
              open={group.id === 'foundation'}
            >
              <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  <span>{group.titleKo}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {group.items.length}개
                  </span>
                </span>
              </summary>
              <ul className="space-y-0 border-t border-border/50 px-2 pb-3 pt-1">
                {group.items.map((skill) => (
                  <li
                    key={skill.name}
                    className="border-b border-border/30 py-4 last:border-b-0 sm:px-2"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
                      <code className="shrink-0 font-mono text-sm font-semibold text-primary">
                        {skill.name}
                      </code>
                      <p className="text-sm font-medium text-foreground">
                        {skill.summaryKo}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {skill.description}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          요청 예시 (프롬프트)
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          이 레포(React, Tailwind, shadcn)에 맞춘 예시입니다. Agent 채팅에 붙여
          쓰고 스킬 이름을 명시하면 적용이 안정적입니다.
        </p>
        <ul className="mt-6 space-y-4">
          {PROMPT_EXAMPLES.map((ex) => (
            <li
              key={ex.title}
              className="rounded-2xl border border-border/60 bg-muted/20 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {ex.title}
                </h3>
                <CopyPromptButton text={ex.body} />
              </div>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-background/80 p-3 font-mono text-xs leading-relaxed text-foreground">
                {ex.body}
              </pre>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          시각 예시 (정적)
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          AI가 아니라 이 페이지에 그린 데모입니다.{' '}
          <strong className="text-foreground">typeset</strong>·
          <strong className="text-foreground">arrange</strong> 스킬이 지향하는
          방향을 직관적으로 보여 줍니다.
        </p>
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-foreground">
            타이포 위계 (typeset)
          </h3>
          <TypographyBeforeAfter />
        </div>
        <div className="mt-12">
          <h3 className="text-sm font-semibold text-foreground">
            간격·그룹 리듬 (arrange)
          </h3>
          <ArrangeBeforeAfter />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Cursor에서 쓰는 법 (요약)
        </h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-muted-foreground marker:text-primary/70">
          <li>
            설정 <strong className="text-foreground">Rules</strong>에 스킬이
            보이면 로드된 상태입니다.
          </li>
          <li>
            <strong className="text-foreground">Agent 채팅</strong>에서{' '}
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs text-foreground">
              /
            </kbd>{' '}
            또는{' '}
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs text-foreground">
              @.agents/skills/…/SKILL.md
            </kbd>
          </li>
          <li>
            중요한 UI 작업은 위 프롬프트처럼{' '}
            <strong className="text-foreground">스킬 이름을 문장에 넣기</strong>.
          </li>
        </ul>
      </section>

      <section className="mt-14 rounded-2xl border border-border/60 bg-card/40 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          이 페이지를 만든 방식
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          각 스킬의{' '}
          <code className="font-mono text-xs">description</code>은 설치된{' '}
          <code className="font-mono text-xs">SKILL.md</code>와 동일하고, 한국어
          줄은 이 사이트 독자용 요약입니다. 예시 UI는{' '}
          <span className="text-foreground">frontend-design</span> 스킬이 피하라는
          획일적 카드 반복 대신, 비교 목적의 최소 데모만 사용했습니다.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button asChild variant="default">
          <Link to="/about">사이트 소개</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/main">메인으로</Link>
        </Button>
      </div>
    </div>
  )
}
