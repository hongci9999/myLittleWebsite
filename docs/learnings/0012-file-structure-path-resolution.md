# 파일 구조형 패턴 학습 - Part 3: 경로 해석 로직

날짜: 2026-02-28

## 요약

URL 경로(`pathParts`)를 받아 트리를 **재귀적으로 순회**하며, 현재 위치가 노드 목록인지 문서 목록인지 단일 문서인지 결정한다.

---

## 3.1 입력과 출력

**입력**
- `pathParts`: `["01_소프트웨어설계", "sdlc"]` (sectionId 제외)
- `nodes`: 현재 탐색 중인 노드 배열
- `basePath`: md fetch용 (section에서 전달)

**출력**
- `ResolveResult`: `node-list` | `doc-list` | `doc` | `null`

---

## 3.2 resolveFromNodes (재귀 핵심)

```ts
// client/src/shared/config/file-structure.ts
function resolveFromNodes(
  nodes: FileStructureNode[],
  pathParts: string[],
  basePath: string,
  pathSegments: string[]
): ResolveResult | null {
  // [1] 경로가 비었으면 → 현재 노드들을 반환
  if (pathParts.length === 0) {
    return { type: 'node-list', nodes, pathSegments }
  }

  const [first, ...rest] = pathParts   // [2] 첫 세그먼트 분리
  const node = nodes.find((n) => n.id === first)
  if (!node) return null

  const newPathSegments = [...pathSegments, first]

  // [3] 노드에 children이 있으면
  if (node.children && node.children.length > 0) {
    if (rest.length === 0) {
      return { type: 'node-list', nodes: node.children, pathSegments: newPathSegments }
    }
    return resolveFromNodes(node.children, rest, basePath, newPathSegments)  // ← 재귀
  }

  // [4] 노드에 docs가 있으면
  if (node.docs && node.docs.length > 0) {
    if (rest.length === 0) {
      return { type: 'doc-list', docs: node.docs, pathSegments: newPathSegments, node }
    }
    if (rest.length === 1) {
      const doc = node.docs.find((d) => d.slug === rest[0])
      if (doc) return { type: 'doc', doc, basePath, pathSegments: newPathSegments }
    }
    return null
  }

  return null
}
```

---

## 3.3 재귀 흐름 예시

**경로**: `["01_소프트웨어설계", "sdlc"]`

```
1. resolveFromNodes(section.nodes, ["01_소프트웨어설계", "sdlc"], basePath, [])
   - first = "01_소프트웨어설계", rest = ["sdlc"]
   - node = 01_소프트웨어설계 (docs 있음)
   - rest.length === 1 → doc 찾기
   - doc = sdlc 발견
   → { type: 'doc', doc, basePath, pathSegments: ["01_소프트웨어설계"] }
```

**경로**: `["01_소프트웨어설계"]` (문서 목록)

```
1. resolveFromNodes(section.nodes, ["01_소프트웨어설계"], basePath, [])
   - first = "01_소프트웨어설계", rest = []
   - node = 01_소프트웨어설계 (docs 있음)
   - rest.length === 0
   → { type: 'doc-list', docs: [...], pathSegments: ["01_소프트웨어설계"], node }
```

**경로**: `["part1", "chapter1"]` (children 중첩 예시)

```
1. resolveFromNodes(section.nodes, ["part1", "chapter1"], basePath, [])
   - first = "part1", rest = ["chapter1"]
   - node = part1 (children 있음)
   - rest.length > 0
   → resolveFromNodes(node.children, ["chapter1"], basePath, ["part1"])  // 재귀

2. resolveFromNodes(part1.children, ["chapter1"], basePath, ["part1"])
   - first = "chapter1", rest = []
   - node = chapter1
   - chapter1에 children 있으면 → node-list
   - docs 있으면 → doc-list
```

---

## 3.4 resolveFileStructurePath (진입점)

```ts
export function resolveFileStructurePath(
  parentPath: string,
  sectionId: string,
  pathParts: string[]
): ResolveResult | null {
  const section = getFileStructureSection(parentPath, sectionId)
  if (!section) return null

  if (pathParts.length === 0) {
    return { type: 'node-list', nodes: section.nodes, pathSegments: [] }
  }

  return resolveFromNodes(section.nodes, pathParts, section.basePath, [])
}
```

- `pathParts`가 비어 있으면 → 섹션의 최상위 노드 목록
- 그렇지 않으면 → `resolveFromNodes`로 재귀 해석

---

## 3.5 buildPath (경로 조합)

```ts
export function buildPath(
  parentPath: string,
  sectionId: string,
  pathSegments: string[]
): string {
  const base = `${parentPath}/${sectionId}`
  if (pathSegments.length === 0) return base
  return `${base}/${pathSegments.join('/')}`
}
```

- `pathSegments`를 URL 경로로 합침
- 예: `buildPath("/learning", "info-engineer", ["01_소프트웨어설계"])`  
  → `"/learning/info-engineer/01_소프트웨어설계"`
