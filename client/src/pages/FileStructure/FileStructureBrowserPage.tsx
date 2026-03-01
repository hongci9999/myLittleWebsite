import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileListItem } from '@/shared/ui/FileListItem'
import {
  resolveFileStructurePath,
  buildPath,
  getFileStructureParent,
} from '@/shared/config/file-structure'
import { Button } from '@/components/ui/button'

interface Props {
  parentPath: string
  sectionId: string
}

export default function FileStructureBrowserPage({
  parentPath,
  sectionId,
}: Props) {
  const { '*': splat } = useParams<{ '*': string }>()
  const pathParts = splat ? splat.split('/') : []

  const result = resolveFileStructurePath(parentPath, sectionId, pathParts)
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
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link to={backPath}>← {backLabel}</Link>
        </Button>
      </div>

      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  )
}
