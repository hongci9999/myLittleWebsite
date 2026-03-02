# 파일 구조형 패턴 학습 - 목차

날짜: 2026-02-28

태그: [프론트, 아키텍처, 도구]

추상화와 재귀 구조를 적용한 파일 구조형 UI 패턴을 5개 파트로 나누어 학습한다.

---

## 파트별 학습 순서

| 파트 | 문서 | 주제 |
|------|------|------|
| **Part 1** | [0010-file-structure-pattern-overview](./0010-file-structure-pattern-overview.md) | 배경, 목표, 전체 아키텍처 |
| **Part 2** | [0011-file-structure-recursive-types](./0011-file-structure-recursive-types.md) | 재귀 타입 설계 (FileStructureNode, ResolveResult) |
| **Part 3** | [0012-file-structure-path-resolution](./0012-file-structure-path-resolution.md) | 경로 해석 로직 (resolveFromNodes 재귀) |
| **Part 4** | [0013-file-structure-ui-integration](./0013-file-structure-ui-integration.md) | UI 통합 (FileStructureBrowserPage, splat 라우트) |
| **Part 5** | [0014-file-structure-extending](./0014-file-structure-extending.md) | 확장 방법 (새 섹션, 깊은 중첩) |

---

## 참조 코드 경로

| 역할 | 경로 |
|------|------|
| 타입·해석·breadcrumb | `client/src/shared/config/file-structure.ts` |
| 학습자료 config | `client/src/shared/config/file-structure-sections/learning-info-engineer.ts` |
| 브라우저 페이지 | `client/src/pages/FileStructure/FileStructureBrowserPage.tsx` |
| 패턴 룰 | `.cursor/rules/file-structure-pattern.mdc` |
