# Changelog

[Keep a Changelog](https://keepachangelog.com/) 형식.

## [Unreleased]

### Added

- **학습자료 페이지 - 정보처리기사 프로토타입** (Phase 1 MVP)
  - 파일 구조형 3단계 네비게이션: `/learning` → `/learning/info-engineer` → `/learning/info-engineer/:categoryId` → 문서 뷰어
  - `FileListItem` 공통 컴포넌트: 가로 전체 직사각형, 세로 배치, 제목·부가설명
  - `LearningPage`: 1단계(정보처리기사)
  - `LearningCategoryListPage`: 2단계(소프트웨어 설계, 소프트웨어 개발 등 6개 과목)
  - `LearningDocListPage`: 3단계(과목별 문서 목록)
  - `LearningDocPage`: 문서 뷰어 (react-markdown + remark-gfm)
  - `learningInfoEngineer.ts` 인덱스 config (Phase 2에서 DB/JSON 대체 예정)
  - 샘플 md: `client/public/learnings/정처기/01_소프트웨어설계/` (sdlc.md, uml.md)
- **헤더 breadcrumb** - 파일 경로 형태 (`myLittleWebsite / 학습자료 / 정보처리기사 / ...`)
  - `useBreadcrumb` 훅, 경로별 클릭 가능 링크
- **@tailwindcss/typography** - prose 클래스로 마크다운 본문 스타일링

### Changed

- **헤더** - 로고+라벨 → breadcrumb 형태로 전환, text-xl font-semibold 유지
- **FileListItem** - 왼쪽 패딩(pl-12), 높이(py-6), 폰트(text-lg), 부가설명 제목 하단 배치
- **학습자료 페이지** - 카드 그리드 → 파일 구조형 풀폭 리스트로 전환

- **디자인 플레이그라운드** (`/design-playground`) - 폰트·색상·컴포넌트 스타일 실시간 비교·결정 도구
  - 폰트: 본문 7종, 코드 8종
  - 색상 테마: 복수 선택 가능, 20+ 테마 (light, dark, warm, cool, forest, navy 등)
  - 모서리·그림자·트랜지션
  - 컴포넌트 미리보기: Button, Card, 선택지(단일/다중/토글), 메뉴, 코드블록, 입력칸, 타이포그래피(굵기·줄간격·제목/본문 크기), 탭, 배지, 토글, 페이지네이션, 프로그레스, 토스트, 드롭다운
  - 선택 결과 마크다운 복사 (AI 전달용)
- **About 페이지** - 사이트 소개, 디자인 플레이그라운드 링크 추가

- **랜딩 페이지** - 스크롤 기반 표어 애니메이션 ("끊임없이 배워나가는..."), 홈 버튼으로 메인 이동
- **메인 허브** - About/Portfolio/Blog 카드 그리드, config 기반 확장 가능
- **플레이스홀더 페이지** - About, Portfolio, Blog (준비 중)
- **ESLint + Prettier** - .prettierrc, .prettierignore, eslint-config-prettier, 루트 format/format:check 스크립트
- **react-refresh 규칙 전역 비활성화** - shadcn 컴포넌트(컴포넌트+variants export) 패턴 허용
- **Superpowers 프로젝트 전용 설치** - .cursor/skills/superpowers 클론, superpowers-bootstrap.mdc 룰 (이 프로젝트에서만 적용)
- learnings 0002 보강: 수동 설치 CLI (PowerShell 경로 수정, 프로젝트 전용 방법 C), Bootstrap 역할·출처
- **docs/learnings/** - 학습 내용 정리용 (개념·동작 방식)
- docs-record 룰에 learnings 규칙 추가
- learnings 0001: npm workspaces 동작 방식, 0002: Superpowers 에이전트 워크플로우
- **client/** - Vite + React + TypeScript 프론트엔드 (components, pages, hooks, utils)
- **server/** - Express + TypeScript 백엔드 (routes, controllers, services, db)
- 루트 package.json - npm workspaces, concurrently로 client/server 동시 실행
- .gitignore - node_modules, dist, env, 로그 등
- 프로젝트 핵심 원칙 룰 (foundation.mdc) - 이유 기반, 자기서술, 확장성
- Git 작업 규칙 (git.mdc) - Conventional Commits, 브랜치 전략, Windows 한글 인코딩
- 기술 스택·폴더 구조 룰 (stack-structure.mdc) - React, Node, Supabase
- 프로젝트 기록 룰 (docs-record.mdc) - CHANGELOG, ADR, journal
- docs/ 폴더 및 초기 구조 (CHANGELOG, decisions, journal)
- 의사결정 기록: 0001 기술 스택, 0002 프로젝트 기초 구조, 0003 Superpowers 적용

### Changed

- **Hero 섹션 패딩** - md 뷰포트에서 상·하 패딩 56px → 27px (`md:py-14` → `md:py-[27px]`)
- **테마 전환 애니메이션** - oklch 색상이 자연스럽게 이어지도록 `index.css`에 transition 적용 (background-color, color, border-color, box-shadow, fill, stroke, 0.4s ease)

### Fixed

- (아직 없음)
