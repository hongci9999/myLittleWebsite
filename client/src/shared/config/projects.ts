import projectsData from './projects.json'

export type ProjectStatus = 'active' | 'paused' | 'archived'

export type ProjectScreenshot = {
  src: string
  alt: string
  caption?: string
}

export type ProjectItem = {
  id: string
  title: string
  summary: string
  /** 카드 본문 아래에 표시할 역할·기간 등 (선택) */
  meta?: string
  repoUrl?: string
  demoUrl?: string
  /** LinkedIn 등 구축 후기·소개 글 (선택) */
  postUrl?: string
  /** 발표·세미나 PDF (선택) */
  pdfUrl?: string
  /** 이 사이트 안 기록 페이지 (예: /bootcamp/cps-simulation) — 「기록 보기」 버튼 */
  docPath?: string
  screenshotSrc: string
  screenshotAlt: string
  /** 있으면 카드 상단에 갤러리로 표시 (없으면 screenshotSrc 단일 이미지) */
  screenshots?: ProjectScreenshot[]
  tags: string[]
  status: ProjectStatus
}

/**
 * `/project` 목록 — 화면 **위→아래 = 포트폴리오 등록 최신순**.
 * HICC 박람회·Docker 세미나가 맨 아래(초기 등록).
 * 스크린샷: `client/public/projects/`
 * 데이터는 `projects.json` — 서버 MCP(`get_portfolio`)도 같은 파일을 읽는다.
 */
export const PROJECT_ITEMS = projectsData as ProjectItem[]
