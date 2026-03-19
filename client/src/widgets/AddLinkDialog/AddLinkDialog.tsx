import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  createLink,
  suggestLinkMeta,
  fetchDimensions,
  type DimensionWithValues,
  type ValueTree,
} from '@/shared/api/links'

function collectValueIds(nodes: ValueTree[]): { id: string; label: string }[] {
  const result: { id: string; label: string }[] = []
  const walk = (items: ValueTree[]) => {
    for (const v of items) {
      result.push({ id: v.id, label: v.label })
      if (v.children?.length) walk(v.children)
    }
  }
  walk(nodes)
  return result
}

const inputBase =
  'w-full rounded-xl border-0 bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20'

interface AddLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
  dimensions: DimensionWithValues[]
  setDimensions: (d: DimensionWithValues[]) => void
  onLinkAdded: () => void
}

export default function AddLinkDialog({
  open,
  onOpenChange,
  token,
  dimensions,
  setDimensions,
  onLinkAdded,
}: AddLinkDialogProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [valueIds, setValueIds] = useState<Set<string>>(new Set())
  const [aiLoading, setAiLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const resetForm = () => {
    setUrl('')
    setTitle('')
    setDescription('')
    setValueIds(new Set())
    setAiError(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm()
    onOpenChange(next)
  }

  const handleAiFill = async () => {
    if (!url.trim() || !title.trim()) return
    setAiLoading(true)
    setAiError(null)
    try {
      const result = await suggestLinkMeta(token, url.trim(), title.trim())
      if (result) {
        setDescription(result.description)
        setValueIds(new Set(result.valueIds))
        await fetchDimensions().then(setDimensions)
      } else {
        setAiError('Ollama를 실행 중인지 확인하세요.')
      }
    } catch {
      setAiError('AI 추천을 불러오지 못했습니다.')
    } finally {
      setAiLoading(false)
    }
  }

  const toggleValue = (id: string) => {
    setValueIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !url.trim() || !title.trim()) return
    setSubmitLoading(true)
    try {
      const created = await createLink(token, {
        url: url.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        valueIds: Array.from(valueIds),
      })
      if (created) {
        onLinkAdded()
        handleOpenChange(false)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>링크 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://..."
              className={`${inputBase} mt-1.5`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="링크 제목"
              className={`${inputBase} mt-1.5`}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full"
              onClick={handleAiFill}
              disabled={aiLoading || !url.trim() || !title.trim()}
            >
              {aiLoading ? 'AI 분석 중...' : 'AI로 채우기'}
            </Button>
            {aiError && (
              <span className="text-xs text-destructive">{aiError}</span>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              설명 (선택)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="간단한 설명"
              className={`${inputBase} mt-1.5 resize-none`}
            />
          </div>
          {dimensions.map((dim) => {
            const values = collectValueIds(dim.values)
            if (values.length === 0) return null
            return (
              <div key={dim.id}>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {dim.label}
                </label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {values.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleValue(v.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        valueIds.has(v.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => handleOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-full px-5"
              disabled={submitLoading}
            >
              {submitLoading ? '저장 중...' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
