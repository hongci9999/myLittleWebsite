# About 페이지 자기서술 개선

- **날짜**: 2026-05-25
- **상태**: 채택 (2026-05-25 구현)
- **근거**: `/about` 평가에서 도출한 아쉬운 점 전부 반영

---

## 배경

`client/public/about.md`는 foundation의 자기서술 요건을 대체로 충족하나, (1) **왜**가 약함, (2) **실제 사이트와 불일치**, (3) **foundation 3원칙 미명시**, (4) **대상·시나리오 추상적**, (5) **페이지 UX(목차·갱신일·로딩)** 부족이 있었다.

---

## 목표

| # | 아쉬운 점 | 대응 |
|---|-----------|------|
| 1 | reason-first 약함 | 「왜 이렇게 만들었는지」 절 + ADR/기록 경로 안내 |
| 2 | 정확성 | 라우트·콘텐츠·Mermaid·테마(midnight) 동기화 |
| 3 | foundation 3원칙 | 「이 사이트의 원칙」 절에 3가지 명시 |
| 4 | 대상 추상적 | 방문자 시나리오(어디로 가면 되는지) 추가 |
| 5 | 페이지 UX | 상단 요약·갱신일, 목차(TOC), heading id, 로딩 스켈레톤 |

---

## 범위

### 1. `client/public/about.md` (본문)

- 상단: 한 줄 요약 + **마지막 갱신** (2026-05-25)
- **이 사이트의 원칙**: reason-first, self-documentation, always extensible
- **누가 읽으면 좋은지**: 나중의 나 + 방문자 시나리오(경로 링크)
- **담는 것**: ai-dev-tools, skills-intro 등 누락 섹션 추가
- **왜 이렇게 만들었는지**: 스택·client/server·FSD·테마 — 요약 + `docs/decisions/` 참조
- **기술 스택**: Vite 명시
- **프로젝트 구조**: client FSD 레이어 요약
- **주요 화면**: App 라우트 표 (공개·관리·도구 구분)
- **아키텍처**: ASCII + Mermaid, 「추후 렌더」 문구 삭제
- **운영·기록**: journal, error-fixes, plans 포함
- **바로가기**: 공개 경로 전체
- **부록**: 디자인 플레이그라운드 (성격 분리 유지)

### 2. `client/src/pages/AboutPage.tsx` (UX)

- `##` 제목에서 TOC 추출, 좌측(또는 상단) sticky 목차
- `MarkdownWithMath`에 heading `id` 부여 (TOC 앵커)
- 로딩: prose 영역 스켈레톤
- `doc-reader` 클래스 적용 (학습 문서와 읽기 톤 통일)

### 3. 공통 유틸

- `shared/lib/markdown-headings.ts`: slugify, `extractMarkdownH2Toc`

### 4. 문서 동기화 (정확성)

- `docs/decisions/0008-color-themes.md`: dark-slate → **midnight**
- `docs/decisions/0009-design-rules.md`: 다크 테마 id 동기화

### 5. 기록

- `docs/journal/2026-05.md` 항목
- `docs/CHANGELOG.md` [Unreleased] 또는 날짜 섹션

---

## 비범위

- `docs/decisions/` 전체를 웹에서 브라우징하는 전용 페이지 (별도 기능)
- about.md를 CMS/DB로 이전

---

## 검증

- [x] `npm run build` (client)
- [x] `/about`에서 목차 클릭 시 해당 절로 스크롤 (heading id)
- [x] Mermaid 다이어그램 렌더 (`MarkdownWithMath`)
- [x] 테마 midnight·라우트 표와 App.tsx 일치
