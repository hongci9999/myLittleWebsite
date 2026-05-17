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
  repoUrl: string
  demoUrl?: string
  screenshotSrc: string
  screenshotAlt: string
  /** 있으면 카드 상단에 갤러리로 표시 (없으면 screenshotSrc 단일 이미지) */
  screenshots?: ProjectScreenshot[]
  tags: string[]
  status: ProjectStatus
}

/** `/project` 목록 — 항목 추가 시 스크린샷은 `client/public/projects/` 에 둔다 */
export const PROJECT_ITEMS: ProjectItem[] = [
  {
    id: 'my-little-website',
    title: 'myLittleWebsite',
    summary:
      '자료 정리·포트폴리오·기술 학습을 위한 개인 웹사이트. React + Express + Supabase, AWS(S3·CloudFront·Elastic Beanstalk)로 프로덕션 배포.',
    repoUrl: 'https://github.com/hongci9999/myLittleWebsite',
    demoUrl: 'https://d4a3hmxzy83r1.cloudfront.net/main',
    screenshotSrc: '/projects/my-little-website.png',
    screenshotAlt: 'myLittleWebsite 메인 페이지 스크린샷',
    tags: ['React', 'TypeScript', 'Express', 'Supabase', 'AWS'],
    status: 'active',
  },
  {
    id: 'hum-my',
    title: 'hum-my',
    summary:
      '흥얼거림·짧은 멜로디를 입력하면 AI가 장르·분위기에 맞는 반주를 생성하는 졸업 프로젝트. 외부 AI API·자체 Melody-to-Accompaniment 모델, 장르 변환, 커뮤니티 공유를 React 프론트와 Django·Celery·Redis 백엔드로 구현했다.',
    meta: '팀 프로젝트 · 2025 졸업작 · 프론트엔드 참여',
    repoUrl: 'https://github.com/2025-final-musicloop/frontend',
    screenshotSrc: '/projects/hum-my/home.png',
    screenshotAlt: 'hum-my 랜딩 페이지 — AI 반주 생성',
    screenshots: [
      {
        src: '/projects/hum-my/home.png',
        alt: 'hum-my 랜딩 — AI 반주 생성 소개',
        caption: '랜딩',
      },
      {
        src: '/projects/hum-my/upload.png',
        alt: 'hum-my 음성 파일 업로드 화면',
        caption: '업로드',
      },
      {
        src: '/projects/hum-my/complete.png',
        alt: 'hum-my 음악 제작 완료 및 다운로드 화면',
        caption: '완료',
      },
    ],
    tags: ['React', 'TypeScript', 'Python', 'Django', 'AI', 'Vite'],
    status: 'archived',
  },
]
