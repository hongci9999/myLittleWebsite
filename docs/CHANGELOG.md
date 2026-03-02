# Changelog

[Keep a Changelog](https://keepachangelog.com/) 형식.

## [Unreleased]

### Added

- **유용한 링크 페이지 + 사이트 전체 관리자 인증 설계**
  - 설계 문서: `docs/plans/2026-03-03-links-admin-design.md`
  - 구현 계획: `docs/plans/2026-03-03-links-admin-implementation-plan.md`
  - 스키마 SQL: `docs/plans/2026-03-03-links-schema.sql`
  - 기능: 목적·종류 등 축(dimension) + 계층형 값으로 분류, Supabase Auth, Remember Me
  - (구현 전)
- **학습 폴더 DB API** (Phase 2·3)
  - 서버: Supabase 연동 (`db/supabase.ts`, `db/queries/learning.ts`), `GET /api/learning/sections`, `/sections/:sectionId`
  - 클라이언트: `fetchLearningSection()` API 호출, API 실패 시 config 폴백
  - env 선행 로드 (`server/src/env.ts`), dotenv
- **에러 픽스 기록** - `docs/error-fixes/` 폴더, 오류·원인·수정 방법 정리
  - 0001: 학습 폴더·config 관련 (EADDRINUSE, env 로드, API 폴백, config 자동생성, 99_노트 children)
- **학습 폴더 config 자동 생성** - `scripts/build-learning-config.mjs`, `npm run build:learning-config`
  - `public/learnings/정처기` 폴더 스캔 → `learning-info-engineer.ts` 자동 생성 (95개 md 반영)
- **learnings 0016** - 학습 폴더 config 자동 생성 개념·동작 방식
- **파일 구조형 패턴 재귀화** - 깊이 제한 없이 확장 가능
  - `FileStructureNode`: children(재귀) 또는 docs
  - `FileStructureBrowserPage`: splat 라우트로 node-list/doc-list/doc 통합
  - `resolveFileStructurePath()`: 경로 기반 재귀 해석
  - 라우트: `learning/info-engineer/*` (splat)
- **학습자료 페이지 - 정보처리기사 프로토타입** (Phase 1 MVP)
  - 파일 구조형 3단계 네비게이션: `/learning` → `/learning/info-engineer` → `/learning/info-engineer/:categoryId` → 문서 뷰어
  - `FileListItem` 공통 컴포넌트: 가로 전체 직사각형, 세로 배치, 제목·부가설명
  - Learning* 페이지는 FileStructure* 래퍼로 전환
  - 샘플 md: `client/public/learnings/정처기/01_소프트웨어설계/` (sdlc.md, uml.md)
- **헤더 breadcrumb** - 파일 경로 형태 (`myLittleWebsite / 학습자료 / 정보처리기사 / ...`)
  - `useBreadcrumb` 훅, 경로별 클릭 가능 링크
- **@tailwindcss/typography** - prose 클래스로 마크다운 본문 스타일링

### Changed

- **학습 문서 뷰어(DocViewer)** - 읽기용 디자인 개선
  - 최적 읽기 폭 65ch, 줄간격 1.75, 본문 0.9375rem
  - 제목(h1~h4) 계층·여백·구분선, 인용문·코드블록·테이블 스타일
  - 문서 제목 상단 배치, "← 목록" 버튼 스타일 조정
- **바로가기(RightSidebar)** - 플로팅 패널로 전환
  - 고정 사이드바 → 오른쪽 세로 중앙 플로팅 (fixed right-0 top-1/2)
  - 메인 영역 `lg:pr-40`로 플로팅 영역 침범 방지
  - 버튼·아이콘 크기 축소 (w-40, compact 스타일)
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
- **파일 구조형 패턴 학습 자료** (learnings 0010~0014)
  - Part 1: 배경·목표·아키텍처 개요
  - Part 2: 재귀 타입 (FileStructureNode, ResolveResult)
  - Part 3: 경로 해석 (resolveFromNodes 재귀)
  - Part 4: UI 통합 (FileStructureBrowserPage, splat 라우트)
  - Part 5: 확장 방법 (새 섹션, 깊은 중첩)
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

- **학습 콘텐츠 미표시** - API가 빈 nodes 반환 시 config 폴백 (`LearningBrowserPage` hasNodes 체크)
- **md 문서 일부만 표시** - config 하드코딩(sdlc, uml 2개) → 폴더 스캔 스크립트로 전체 자동 생성
- **99_노트 하위 누락** - `scanDir` 반환값(객체)을 배열처럼 사용하던 버그 수정
