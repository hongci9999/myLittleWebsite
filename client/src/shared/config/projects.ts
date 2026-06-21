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
 */
export const PROJECT_ITEMS: ProjectItem[] = [
  {
    id: 'cheese-storm',
    title: 'CHEESESTORM',
    summary:
      '치지직 스트리머들의 히어로즈 오브 더 스톰(HotS) 내전 전적 기록·티어리스트 서비스. 자동·큐레이션 티어, 경기 입력(OCR), 스트리머 프로필, 치지직 OAuth 권한 체계. 이벤트 기간 집중 운영에 맞춰 Firestore reads를 stats/current·서버 캐시로 최적화한 Next.js 앱.',
    meta: '개인 사이드 · Next.js · Firebase · 치지직 OAuth',
    repoUrl: 'https://github.com/hongci9999/CheeseStorm-website',
    demoUrl: 'https://cheese-storm-website.vercel.app',
    postUrl:
      'https://www.linkedin.com/posts/ingee-hong99_firebase-nextjs-rpwstwrzgtgkrht-share-7472634687417491456-oc-J/',
    screenshotSrc: '/projects/cheese-storm/home.png',
    screenshotAlt: 'CHEESESTORM 홈 — 티어리스트와 스트리머 순위',
    screenshots: [
      {
        src: '/projects/cheese-storm/home.png',
        alt: 'CHEESESTORM 홈 — 자동·큐레이션 티어리스트',
        caption: '홈',
      },
      {
        src: '/projects/cheese-storm/matches.png',
        alt: 'CHEESESTORM 경기 기록 타임라인',
        caption: '경기 기록',
      },
      {
        src: '/projects/cheese-storm/streamers.png',
        alt: 'CHEESESTORM 스트리머 목록·프로필',
        caption: '스트리머',
      },
    ],
    tags: ['Next.js', 'TypeScript', 'Firebase', 'Chzzk', 'HotS'],
    status: 'active',
  },
  {
    id: 'llm-wiki',
    title: 'LLM Wiki',
    summary:
      'Andrej Karpathy의 LLM Wiki 패턴을 Obsidian·Claude Code로 구현한 개인 지식 베이스. URL 클리핑 후 /ingest로 raw→wiki 자동 분류·크로스링크, Graphify로 지식 그래프 탐색(직접 탐색 대비 토큰 약 60% 절감 경험). RAG 매번 검색 대신 한 번 컴파일된 wiki를 누적하는 Second Brain 실험.',
    meta: '개인 사이드 · Obsidian Vault · Claude Code · Graphify',
    postUrl:
      'https://www.linkedin.com/posts/ingee-hong99_llmwiki-graphify-obsidian-share-7468332115928133632-h891/',
    screenshotSrc: '/projects/llm-wiki/obsidian.png',
    screenshotAlt: 'LLM Wiki Obsidian — wiki/projects/llm-wiki 노트와 그래프 뷰',
    screenshots: [
      {
        src: '/projects/llm-wiki/obsidian.png',
        alt: 'Obsidian에서 raw·wiki 3층 구조와 llm-wiki 프로젝트 노트',
        caption: 'Obsidian',
      },
      {
        src: '/projects/llm-wiki/graphify.png',
        alt: 'Graphify 지식 그래프 — Wiki Index 허브와 9개 커뮤니티',
        caption: 'Graphify',
      },
    ],
    tags: ['Obsidian', 'Claude Code', 'Graphify', 'Knowledge Management', 'AI'],
    status: 'active',
  },
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
  {
    id: 'hicc-docker-seminar',
    title: 'Docker 세미나',
    summary:
      'HICC 동아리 세미나에서 Docker에 대해 발표했습니다. 컨테이너가 무엇인지, 왜 쓰는지, 이미지·컨테이너를 다루는 기본 흐름을 동아리원들에게 소개한 슬라이드입니다.',
    meta: 'HICC 동아리 · 세미나',
    pdfUrl: '/projects/hicc-docker-seminar/docker-hicc.pdf',
    screenshotSrc: '',
    screenshotAlt: 'Docker 세미나 발표 자료',
    tags: ['Docker', 'HICC', '세미나'],
    status: 'archived',
  },
]
