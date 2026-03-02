# 파일 구조형 패턴 학습 - Part 4: UI 통합과 브라우저 페이지

날짜: 2026-02-28

태그: [프론트, 아키텍처]

## 요약

하나의 `FileStructureBrowserPage`가 `ResolveResult` 타입에 따라 **노드 목록 / 문서 목록 / 문서 뷰어**를 모두 렌더링한다. splat 라우트로 경로 깊이에 상관없이 동작한다.

---

## 4.1 Splat 라우트

```tsx
// client/src/App.tsx
<Route path="learning/info-engineer/*" element={<LearningBrowserPage />} />
```

- `*`: 나머지 경로를 한 번에 캡처
- `/learning/info-engineer` → splat = `""`
- `/learning/info-engineer/01_소프트웨어설계` → splat = `"01_소프트웨어설계"`
- `/learning/info-engineer/01_소프트웨어설계/sdlc` → splat = `"01_소프트웨어설계/sdlc"`

깊이가 바뀌어도 **라우트는 하나**로 처리 가능하다.

---

## 4.2 FileStructureBrowserPage 구조

```tsx
// client/src/pages/FileStructure/FileStructureBrowserPage.tsx
export default function FileStructureBrowserPage({
  parentPath,
  sectionId,
}: Props) {
  const { '*': splat } = useParams<{ '*': string }>()
  const pathParts = splat ? splat.split('/') : []

  const result = resolveFileStructurePath(parentPath, sectionId, pathParts)
  // ...
}
```

1. `splat`으로 나머지 경로를 가져옴
2. `/`로 split → `pathParts`
3. `resolveFileStructurePath`로 `ResolveResult` 계산

---

## 4.3 Result 타입별 분기

### node-list

```tsx
if (result.type === 'node-list') {
  const currentPath = buildPath(parentPath, sectionId, result.pathSegments)
  return (
    <ul>
      {result.nodes.map((node) => (
        <li key={node.id}>
          <FileListItem
            to={`${currentPath}/${node.id}`}
            label={node.name}
            description={node.description}
          />
        </li>
      ))}
    </ul>
  )
}
```

- `currentPath`: 현재까지의 경로
- 각 노드 링크: `currentPath + "/" + node.id`

---

### doc-list

```tsx
if (result.type === 'doc-list') {
  const currentPath = buildPath(parentPath, sectionId, result.pathSegments)
  return (
    <ul>
      {result.docs.map((doc) => (
        <li key={doc.slug}>
          <FileListItem
            to={`${currentPath}/${doc.slug}`}
            label={doc.title}
          />
        </li>
      ))}
    </ul>
  )
}
```

- 문서 링크: `currentPath + "/" + doc.slug`

---

### doc (문서 뷰어)

```tsx
if (result.type === 'doc') {
  const backPath = buildPath(parentPath, sectionId, result.pathSegments)
  return (
    <DocViewer
      doc={result.doc}
      basePath={result.basePath}
      backPath={backPath}
      backLabel={parent?.parentLabel ?? '목록'}
    />
  )
}
```

- `backPath`: "목록으로" 버튼의 대상 경로
- `basePath` + `doc.filePath`: md fetch URL

---

## 4.4 DocViewer (문서 렌더링)

```tsx
function DocViewer({ doc, basePath, backPath, backLabel }: {...}) {
  const [content, setContent] = useState<string | null>(null)

  useEffect(() => {
    const url = `${basePath}/${doc.filePath}`
    fetch(url).then(res => res.text()).then(setContent)
  }, [doc, basePath])

  return (
    <article className="prose ...">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  )
}
```

- `basePath`: `/learnings/정처기`
- `doc.filePath`: `01_소프트웨어설계/sdlc.md`
- fetch URL: `/learnings/정처기/01_소프트웨어설계/sdlc.md`

---

## 4.5 Breadcrumb 연동

헤더의 `getFileStructureBreadcrumb(pathname)`이 같은 config를 사용해 경로를 해석한다.

- `pathname` → `pathParts` 분리
- `buildBreadcrumbFromPath`로 노드/문서를 순회하며 `BreadcrumbItem[]` 생성
- `myLittleWebsite / 학습자료 / 정보처리기사 / 소프트웨어 설계 / SDLC 문서` 형태로 표시
