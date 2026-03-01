# 프로젝트 기록 (docs)

프로젝트에 대한 체계적 기록. `.cursor/rules/docs-record.mdc` 규칙을 따른다.

| 경로                           | 용도                            |
| ------------------------------ | ------------------------------- |
| [CHANGELOG.md](./CHANGELOG.md) | 버전별 변경 내역                |
| [decisions/](./decisions/)     | 의사결정 기록 (ADR)             |
| [learnings/](./learnings/)     | 학습 내용 (개념·동작 방식 정리) |
| [error-fixes/](./error-fixes/) | 에러 픽스 기록 (오류·원인·수정) |
| [journal/](./journal/)        | 개발·학습 로그                  |

### 의사결정 목록

- [0001 기술 스택](./decisions/0001-tech-stack.md)
- [0002 프로젝트 기초 구조](./decisions/0002-project-foundation.md)
- [0003 Superpowers 적용](./decisions/0003-superpowers.md)
- [0004 FSD 적용 전략](./decisions/0004-fsd-application-strategy.md)
- [0005 디자인 시스템 shadcn/ui](./decisions/0005-design-system-shadcn.md)
- [0006 디자인 플레이그라운드](./decisions/0006-design-playground.md)

### 학습 내용

| 번호                                                      | 제목                  | 태그                           |
| --------------------------------------------------------- | --------------------- | ------------------------------ |
| [0001](./learnings/0001-npm-workspaces.md)                | npm workspaces        | 도구, 개발방법론               |
| [0002](./learnings/0002-superpowers.md)                   | Superpowers           | ai, 에이전트, 스킬, 개발방법론 |
| [0003](./learnings/0003-website-structure-terminology.md) | 웹사이트 구조·UX 용어 | 프론트, ux                     |
| [0004](./learnings/0004-feature-sliced-design.md)         | Feature-Sliced Design | 프론트, 개발방법론, 아키텍처   |
| [0005](./learnings/0005-shadcn-ui-setup.md)               | shadcn/ui 적용 내역   | 프론트, 도구                   |
| [0006](./learnings/0006-shadcn-ui-and-radix.md)           | shadcn/ui와 Radix UI | 프론트, 도구, ux               |
| [0007](./learnings/0007-design-playground.md)             | 디자인 플레이그라운드 | 프론트, ux, 도구               |
| [0008](./learnings/0008-next-js-overview.md)             | Next.js 개요 및 Vite 대비 | 프론트, 아키텍처, 도구         |
| [0009](./learnings/0009-tailwindcss-typography.md)      | @tailwindcss/typography (Tailwind v4) | 프론트, 도구         |
| [0010](./learnings/0010-file-structure-pattern-index.md) | 파일 구조형 패턴 학습 (목차) | 프론트, 아키텍처, 도구         |
| [0011](./learnings/0011-file-structure-recursive-types.md) | 파일 구조형 패턴 Part 2: 재귀 타입 | 프론트, 아키텍처         |
| [0012](./learnings/0012-file-structure-path-resolution.md) | 파일 구조형 패턴 Part 3: 경로 해석 | 프론트, 아키텍처         |
| [0013](./learnings/0013-file-structure-ui-integration.md) | 파일 구조형 패턴 Part 4: UI 통합 | 프론트, 아키텍처         |
| [0014](./learnings/0014-file-structure-extending.md) | 파일 구조형 패턴 Part 5: 확장 방법 | 프론트, 아키텍처         |
| [0015](./learnings/0015-backend-database-basics.md) | 백엔드·데이터베이스 기초 (초보자용) | 백엔드, 데이터베이스     |
| [0016](./learnings/0016-learning-folder-config-generation.md) | 학습 폴더 config 자동 생성 | 프론트, 백엔드, 도구, 아키텍처 |

### 에러 픽스

| 번호 | 제목 |
|------|------|
| [0001](./error-fixes/0001-learning-folder-session.md) | 학습 폴더·config 관련 오류 모음 |

**태그 목록** (DB·필터링용): `ai`, `에이전트`, `mcp`, `스킬`, `프론트`, `백엔드`, `알고리즘`, `개발방법론`, `아키텍처`, `도구`, `ux`, `데이터베이스` — 필요 시 확장
