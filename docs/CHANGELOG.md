# Changelog

[Keep a Changelog](https://keepachangelog.com/) 형식.

## [Unreleased]

### Added
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
- (아직 없음)

### Fixed
- (아직 없음)
