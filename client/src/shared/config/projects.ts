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

/**
 * `/project` 목록 — 화면 **위→아래 = 포트폴리오 등록 최신순**.
 * HICC가 맨 처음 등록한 프로젝트이므로 배열 맨 아래.
 * 스크린샷: `client/public/projects/`
 */
export const PROJECT_ITEMS: ProjectItem[] = [
  {
    id: 'chzzk-subscribe-gradation',
    title: '치지직 구독채널 그라데이션',
    summary:
      '치지직(chzzk.naver.com)에서 내가 구독 중인 채널 이름에 그라데이션을 표시하는 Chrome 확장. 설치·브라우저 시작 시 Chzzk 구독 API로 목록을 가져와 로컬 저장 후, 팔로잉·라이브 카드 등 채널명이 보이는 곳에 일괄 적용한다.',
    meta: '개인 사이드 · Chrome Extension (Manifest V3)',
    repoUrl: 'https://github.com/hongci9999/chzzk-subscribe-gradation',
    screenshotSrc: '/projects/chzzk-subscribe-gradation/live.png',
    screenshotAlt:
      '치지직 팔로잉 채널·라이브 카드에서 구독 채널명 그라데이션 적용',
    tags: ['Chrome Extension', 'JavaScript', 'CSS', 'Chzzk'],
    status: 'archived',
  },
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
  {
    id: 'hicc-expo-project',
    title: 'HICC 동아리 박람회',
    summary:
      '홍익대 중앙 프로그래밍 동아리 HICC 박람회용 웹 앱. 강의 종료 위치·선호 음식을 고르면 홍대 맛집을 추천하고, 네이버 지도로 식당을 확인한 뒤 등록하면 같은 식당을 고른 식사 메이트와 매칭된다.',
    meta: 'HICC 동아리 · 박람회 데모 · React + Vite',
    repoUrl: 'https://github.com/hongci9999/hicc-expo-project',
    screenshotSrc: '/projects/hicc-expo/home.png',
    screenshotAlt: 'HICC 박람회 앱 — 홍대 맛집 추천·식사 메이트 소개',
    screenshots: [
      {
        src: '/projects/hicc-expo/home.png',
        alt: '홍대 맛집 추천과 식사 메이트 안내 화면',
        caption: '시작',
      },
      {
        src: '/projects/hicc-expo/map.png',
        alt: '추천 식당 네이버 지도 및 등록 화면',
        caption: '지도',
      },
      {
        src: '/projects/hicc-expo/match.png',
        alt: '같은 식당을 고른 메이트 매칭 결과',
        caption: '매칭',
      },
    ],
    tags: ['React', 'Vite', 'JavaScript'],
    status: 'archived',
  },
]
