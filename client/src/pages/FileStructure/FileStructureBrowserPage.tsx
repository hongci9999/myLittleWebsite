import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MarkdownWithMath } from '@/shared/ui/MarkdownWithMath'
import { FileListItem } from '@/shared/ui/FileListItem'
import {
  resolveFileStructurePath,
  resolveFileStructurePathFromSection,
  buildPath,
  getFileStructureParent,
  type FileStructureSection,
} from '@/shared/config/file-structure'
import { Button } from '@/components/ui/button'

interface Props {
  parentPath: string
  sectionId: string
  /** API에서 로드한 섹션. 있으면 config 대신 사용 */
  sectionOverride?: FileStructureSection | null
}

export default function FileStructureBrowserPage({
  parentPath,
  sectionId,
  sectionOverride,
}: Props) {
  const { '*': splat } = useParams<{ '*': string }>()
  const pathParts = splat ? splat.split('/') : []

  const result = sectionOverride
    ? resolveFileStructurePathFromSection(sectionOverride, pathParts)
    : resolveFileStructurePath(parentPath, sectionId, pathParts)

  const parent = getFileStructureParent(parentPath)

  if (!result) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-muted-foreground">항목을 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (result.type === 'node-list') {
    const currentPath = buildPath(parentPath, sectionId, result.pathSegments)
    if (result.nodes.length === 0) {
      return (
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="text-muted-foreground">준비 중입니다.</p>
        </div>
      )
    }
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <ul className="flex flex-col gap-2">
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
      </div>
    )
  }

  if (result.type === 'doc-list') {
    const currentPath = buildPath(parentPath, sectionId, result.pathSegments)
    if (result.docs.length === 0) {
      return (
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="text-muted-foreground">준비 중입니다.</p>
        </div>
      )
    }
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <ul className="flex flex-col gap-2">
          {result.docs.map((doc) => (
            <li key={doc.slug}>
              <FileListItem
                to={`${currentPath}/${doc.slug}`}
                label={doc.title}
              />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // result.type === 'doc'
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

function DocViewer({
  doc,
  basePath,
  backPath,
  backLabel,
}: {
  doc: { slug: string; title: string; filePath: string }
  basePath: string
  backPath: string
  backLabel: string
}) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const url = `${basePath}/${doc.filePath}`
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then(setContent)
      .catch((err) => setError(err.message))
  }, [doc, basePath])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-destructive">{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={backPath}>목록으로</Link>
        </Button>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="doc-reader mx-auto max-w-4xl px-6 py-12 sm:px-8 sm:py-16">
      <div className="mb-8 flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground -ml-2">
          <Link to={backPath}>← {backLabel}</Link>
        </Button>
      </div>

      <header className="mb-10">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {doc.title}
        </h1>
      </header>

      <article className="doc-article text-foreground">
        <MarkdownWithMath>{content}</MarkdownWithMath>
      </article>
    </div>
  )
}
