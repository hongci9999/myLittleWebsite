import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  INFO_ENGINEER_CATEGORIES,
  BASE_PATH,
} from '@/shared/config/learningInfoEngineer'
import { Button } from '@/components/ui/button'

export default function LearningDocPage() {
  const { categoryId, docSlug } = useParams<{
    categoryId: string
    docSlug: string
  }>()
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const category = INFO_ENGINEER_CATEGORIES.find((c) => c.id === categoryId)
  const doc = category?.docs.find((d) => d.slug === docSlug)

  useEffect(() => {
    if (!doc) {
      setError('문서를 찾을 수 없습니다.')
      return
    }
    const url = `${BASE_PATH}/${doc.filePath}`
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then(setContent)
      .catch((err) => setError(err.message))
  }, [doc])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-destructive">{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/learning">목록으로</Link>
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
          <Link to="/learning">← 학습자료</Link>
        </Button>
        {category && (
          <span className="text-sm text-muted-foreground">{category.name}</span>
        )}
      </div>

      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  )
}
