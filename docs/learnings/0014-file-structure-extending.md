# 파일 구조형 패턴 학습 - Part 5: 확장 방법

날짜: 2026-02-28

태그: [프론트, 아키텍처]

## 요약

새 섹션 추가와 **더 깊은 중첩**을 config만으로 처리하는 방법. 코드 수정은 최소화한다.

---

## 5.1 새 섹션 추가 (예: 포트폴리오)

### 1단계: config 작성

```ts
// client/src/shared/config/file-structure-sections/portfolio-projects.ts
import { registerFileStructureParent, type FileStructureSection } from '../file-structure'

const projectsSection: FileStructureSection = {
  sectionId: 'projects',
  sectionLabel: '프로젝트',
  basePath: '/portfolio',
  nodes: [
    {
      id: 'web',
      name: '웹 프로젝트',
      description: 'React, Next.js 등',
      docs: [
        { slug: 'little-website', title: 'myLittleWebsite', filePath: 'web/little-website.md' },
      ],
    },
  ],
}

registerFileStructureParent({
  parentPath: '/portfolio',
  parentLabel: '포트폴리오',
  sections: [projectsSection],
})
```

### 2단계: index에 import

```ts
// client/src/shared/config/file-structure-sections/index.ts
import './learning-info-engineer'
import './portfolio-projects'   // 추가
```

### 3단계: 라우트와 래퍼 페이지

```tsx
// App.tsx
<Route path="portfolio/projects/*" element={<PortfolioBrowserPage />} />

// PortfolioBrowserPage.tsx
export default function PortfolioBrowserPage() {
  return (
    <FileStructureBrowserPage parentPath="/portfolio" sectionId="projects" />
  )
}
```

---

## 5.2 더 깊은 중첩 (children 사용)

### 예시: 1부 > 1장 > 문서

```ts
nodes: [
  {
    id: 'part1',
    name: '1부 기초',
    children: [
      {
        id: 'ch1',
        name: '1장 개요',
        docs: [
          { slug: 'intro', title: '서론', filePath: 'part1/ch1/intro.md' },
        ],
      },
    ],
  },
]
```

**경로**
- `/learning/info-engineer` → part1, ... (1단계 노드)
- `/learning/info-engineer/part1` → ch1 (2단계 노드)
- `/learning/info-engineer/part1/ch1` → intro (문서 목록)
- `/learning/info-engineer/part1/ch1/intro` → 문서 뷰어

`resolveFromNodes`가 `children`을 따라 재귀 호출하므로, **추가 코드 없이** 동작한다.

---

## 5.3 children과 docs 동시 사용

```ts
{
  id: 'mixed',
  name: '혼합 예시',
  children: [
    { id: 'sub1', name: '하위', docs: [...] },
  ],
  docs: [
    { slug: 'overview', title: '개요', filePath: '...' },
  ],
}
```

- `children`이 있으면 `children` 우선 처리 (현재 구현)
- `docs`만 있는 노드가 리프 컨테이너
- 필요하면 "children 우선, 없으면 docs" 같은 규칙을 `resolveFromNodes`에 명시하면 됨

---

## 5.4 체크리스트

| 작업 | 파일 | 내용 |
|------|------|------|
| config | `file-structure-sections/<이름>.ts` | `FileStructureSection` 정의, `registerFileStructureParent` 호출 |
| 등록 | `file-structure-sections/index.ts` | import 추가 |
| 라우트 | `App.tsx` | `parentPath/sectionId/*` 추가 |
| 래퍼 | `pages/<Parent>BrowserPage.tsx` | `FileStructureBrowserPage`에 `parentPath`, `sectionId` 전달 |
| 콘텐츠 | `client/public/<basePath>/` | md 파일 배치 |

---

## 5.5 참고: 룰 파일

`.cursor/rules/file-structure-pattern.mdc`에 패턴 요약이 있다. 새 섹션 추가 시 이 룰을 참고하면 된다.
