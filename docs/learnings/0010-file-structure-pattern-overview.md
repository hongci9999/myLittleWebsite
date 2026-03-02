# 파일 구조형 패턴 학습 - Part 1: 배경과 목표

날짜: 2026-02-28

태그: [프론트, 아키텍처, 도구]

## 요약

학습자료 페이지의 계층적 드릴다운 UI를 **추상화**하고 **재귀 구조**로 확장한 패턴. 이 학습 자료는 실제 구현 코드를 예시로 Part 1~5에 걸쳐 상세히 다룬다.

---

## Part 1: 왜 추상화·재귀가 필요한가

### 1.1 문제 상황

처음 학습자료 페이지는 **정보처리기사**만 지원했고, 구조가 고정되어 있었다:

```
/learning → 정보처리기사
/learning/info-engineer → 6개 과목 (소프트웨어 설계 등)
/learning/info-engineer/01_소프트웨어설계 → SDLC, UML 문서
/learning/info-engineer/01_소프트웨어설계/sdlc → 문서 뷰어
```

- **포트폴리오**, **프로젝트** 등 다른 콘텐츠도 같은 UI 패턴이 필요
- **5단계 이상** (예: 1부 > 1장 > 1절 > 문서)으로 깊어질 수 있음
- 페이지·라우트·config를 매번 복사하면 **중복과 유지보수 부담** 증가

### 1.2 추상화의 목표

| 목표 | 의미 |
|------|------|
| **재사용** | 학습자료, 포트폴리오, 프로젝트 등 여러 섹션에 동일 패턴 적용 |
| **단일 진입점** | config만 추가하면 새 섹션 확장 |
| **일관성** | breadcrumb, 리스트, 뷰어가 모두 같은 로직 사용 |

### 1.3 재귀 구조의 목표

| 목표 | 의미 |
|------|------|
| **깊이 무제한** | 4단계 고정 → children으로 중첩 가능 |
| **유연한 구조** | 폴더/파일처럼 계층을 자유롭게 구성 |
| **경로 기반 해석** | URL 세그먼트를 순회하며 현재 위치 결정 |

### 1.4 전체 아키텍처 개요

```
[Config: learning-info-engineer.ts]
    ↓ registerFileStructureParent()
[REGISTRY] ← file-structure.ts
    ↓ resolveFileStructurePath(pathParts)
[ResolveResult] → node-list | doc-list | doc
    ↓
[FileStructureBrowserPage] → 노드 목록 | 문서 목록 | 문서 뷰어
```

---

## 다음 파트

- **Part 2**: 재귀 타입 설계 (`FileStructureNode`, `ResolveResult`)
- **Part 3**: 경로 해석 로직 (`resolveFromNodes` 재귀)
- **Part 4**: UI 통합 (`FileStructureBrowserPage`, splat 라우트)
- **Part 5**: 확장 방법 (새 섹션, 더 깊은 중첩)
