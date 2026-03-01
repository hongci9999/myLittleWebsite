# 파일 구조형 패턴 학습 - Part 2: 재귀 타입 설계

날짜: 2026-02-28

## 요약

`FileStructureNode`가 자기 자신을 참조하는 **재귀 타입**으로, 깊이 제한 없이 트리 구조를 표현한다.

---

## 2.1 타입 계층

### FileStructureDoc (리프)

```ts
// client/src/shared/config/file-structure.ts
export interface FileStructureDoc {
  slug: string
  title: string
  /** public 기준 상대 경로 (fetch URL) */
  filePath: string
}
```

- **역할**: 실제 콘텐츠(마크다운)를 가리키는 리프 노드
- **slug**: URL에 사용 (예: `sdlc`)
- **filePath**: fetch 경로 (예: `01_소프트웨어설계/sdlc.md`)

---

### FileStructureNode (재귀)

```ts
/** 재귀 노드: children 또는 docs 중 하나 이상 */
export interface FileStructureNode {
  id: string
  name: string
  description?: string
  children?: FileStructureNode[]   // ← 자기 자신을 참조
  docs?: FileStructureDoc[]
}
```

**재귀의 핵심**: `children`이 `FileStructureNode[]`이므로, 노드 안에 또 노드가 들어갈 수 있다.

```
Node A
  └── children: [Node B, Node C]
        Node B
          └── children: [Node D]   ← 무한히 깊어질 수 있음
        Node C
          └── docs: [doc1, doc2]   ← 리프
```

---

### Section과 Parent

```ts
export interface FileStructureSection {
  sectionId: string
  sectionLabel: string
  basePath: string
  nodes: FileStructureNode[]   // 최상위 노드들
}

export interface FileStructureParent {
  parentPath: string
  parentLabel: string
  sections: FileStructureSection[]
}
```

- **Parent**: `/learning` 같은 상위 경로
- **Section**: `info-engineer` 같은 섹션
- **nodes**: 해당 섹션의 루트 노드들

---

## 2.2 실제 config 예시

```ts
// client/src/shared/config/file-structure-sections/learning-info-engineer.ts
const infoEngineerSection: FileStructureSection = {
  sectionId: 'info-engineer',
  sectionLabel: '정보처리기사',
  basePath: '/learnings/정처기',
  nodes: [
    {
      id: '01_소프트웨어설계',
      name: '소프트웨어 설계',
      description: 'SDLC, UML, 요구공학 등',
      docs: [   // children 없음 → docs만 → 리프 컨테이너
        { slug: 'sdlc', title: '...', filePath: '01_소프트웨어설계/sdlc.md' },
        { slug: 'uml', title: 'UML', filePath: '01_소프트웨어설계/uml.md' },
      ],
    },
    // ...
  ],
}
```

**현재 구조**: `nodes`는 모두 `docs`만 가진 노드 (1단계).  
**확장 예시**: `children`을 넣으면 2단계 이상 가능.

---

## 2.3 ResolveResult (해석 결과)

```ts
export type ResolveResult =
  | { type: 'node-list'; nodes: FileStructureNode[]; pathSegments: string[] }
  | { type: 'doc-list'; docs: FileStructureDoc[]; pathSegments: string[]; node: FileStructureNode }
  | { type: 'doc'; doc: FileStructureDoc; basePath: string; pathSegments: string[] }
```

| type | 의미 | UI |
|------|------|-----|
| `node-list` | 하위 노드 목록 표시 | 노드 리스트 |
| `doc-list` | 문서 목록 표시 | 문서 리스트 |
| `doc` | 단일 문서 표시 | 마크다운 뷰어 |

`pathSegments`는 "지금까지 거쳐 온 경로"로, 링크 생성과 breadcrumb에 사용된다.

---

## 2.4 재귀 타입이 주는 이점

1. **타입 안전성**: `children`에 잘못된 타입을 넣을 수 없음
2. **IDE 지원**: 중첩 구조에서도 자동완성·타입 체크
3. **구조 명시**: "노드는 children 또는 docs를 가진다"가 타입으로 드러남
