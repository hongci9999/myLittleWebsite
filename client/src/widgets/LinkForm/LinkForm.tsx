import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  suggestLinkMeta,
  fetchDimensions,
  collectValueIds,
  createTag,
  type DimensionWithValues,
} from '@/shared/api/links'

type AiStep = 'idle' | 'sending' | 'analyzing' | 'done' | 'error'

const inputBase =
  'w-full rounded-lg border-0 bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20'


export interface LinkFormValues {
  url: string
  title: string
  description: string
  valueIds: Set<string>
  isFeatured?: boolean
  faviconUrl?: string
}

interface LinkFormProps {
  token: string
  dimensions: DimensionWithValues[]
  setDimensions: (d: DimensionWithValues[]) => void
  initialValues?: Partial<LinkFormValues>
  onSubmit: (data: {
    url: string
    title: string
    description?: string
    valueIds: string[]
    isFeatured?: boolean
    faviconUrl?: string | null
  }) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
  compact?: boolean
}

export default function LinkForm({
  token,
  dimensions,
  setDimensions,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = '추가',
  compact = false,
}: LinkFormProps) {
  const [url, setUrl] = useState(initialValues?.url ?? '')
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [valueIds, setValueIds] = useState<Set<string>>(
    initialValues?.valueIds ?? new Set()
  )
  const [isFeatured, setIsFeatured] = useState(
    initialValues?.isFeatured ?? false
  )
  const [faviconUrl, setFaviconUrl] = useState(
    initialValues?.faviconUrl ?? ''
  )
  const [aiLoading, setAiLoading] = useState(false)
  const [aiStep, setAiStep] = useState<AiStep>('idle')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [newTagByDim, setNewTagByDim] = useState<Record<string, string>>({})
  const [tagAddLoading, setTagAddLoading] = useState(false)
  const [lastAiResult, setLastAiResult] = useState<{
    title: string
    description: string
    rawResponse?: string
  } | null>(null)
  const [aiResultDialogOpen, setAiResultDialogOpen] = useState(false)

  useEffect(() => {
    if (initialValues) {
      setUrl(initialValues.url ?? '')
      setTitle(initialValues.title ?? '')
      setDescription(initialValues.description ?? '')
      setValueIds(initialValues.valueIds ?? new Set())
      setIsFeatured(initialValues.isFeatured ?? false)
      setFaviconUrl(initialValues.faviconUrl ?? '')
    }
  }, [initialValues])

  const handleAiFill = async () => {
    if (!url.trim()) return
    setAiLoading(true)
    setAiError(null)
    setLastAiResult(null)
    setAiStep('sending')
    try {
      await new Promise((r) => setTimeout(r, 200))
      setAiStep('analyzing')
      const result = await suggestLinkMeta(token, url.trim(), title.trim())
      if (result) {
        setTitle(result.title)
        setDescription(result.description)
        if (result.faviconUrl) setFaviconUrl(result.faviconUrl)
        setLastAiResult({
          title: result.title,
          description: result.description,
          rawResponse: result.rawResponse,
        })
        setAiStep('done')
      } else {
        setAiStep('error')
        setAiError('Ollama를 실행 중인지 확인하세요.')
      }
    } catch {
      setAiStep('error')
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

  const handleAddTag = async (dimensionSlug: 'purpose' | 'medium') => {
    const label = newTagByDim[dimensionSlug]?.trim()
    if (!label || tagAddLoading) return
    setTagAddLoading(true)
    try {
      const result = await createTag(token, label, dimensionSlug)
      if (result) {
        setValueIds((prev) => new Set([...prev, result.id]))
        await fetchDimensions().then(setDimensions)
        setNewTagByDim((p) => ({ ...p, [dimensionSlug]: '' }))
      }
    } finally {
      setTagAddLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || !title.trim()) return
    setSubmitLoading(true)
    try {
      await onSubmit({
        url: url.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        valueIds: Array.from(valueIds),
        isFeatured,
        faviconUrl: faviconUrl.trim() || undefined,
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  const steps: { key: AiStep; label: string }[] = [
    { key: 'sending', label: 'URL 전송' },
    { key: 'analyzing', label: 'AI 분석' },
    { key: 'done', label: '완료' },
  ]

  const gap = compact ? 'gap-2' : 'gap-3'
  const labelClass = compact ? 'mb-0.5' : 'mb-1'

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col ${gap}`}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1 basis-48">
          <label className={`block text-[10px] font-medium uppercase tracking-wider text-muted-foreground ${labelClass}`}>
            URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://..."
            className={inputBase}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0 rounded-full"
          onClick={handleAiFill}
          disabled={aiLoading || !url.trim()}
        >
          {aiLoading ? '분석 중...' : 'AI로 채우기'}
        </Button>
      </div>

      {aiLoading && (
        <div className="flex items-center gap-2">
          {steps.map((s, i) => {
            const currentIdx = steps.findIndex((x) => x.key === aiStep)
            const isDone = currentIdx > i
            const isActive = aiStep === s.key
            return (
            <div key={s.key} className="flex items-center gap-1.5">
              <span
                className={`inline-flex size-5 items-center justify-center rounded-full text-[10px] font-medium ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isDone
                      ? 'bg-primary/30 text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground'
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-xs ${
                  aiStep === s.key ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <span className="mx-0.5 text-muted-foreground/50">→</span>
              )}
            </div>
            )
          })}
        </div>
      )}
      {aiStep === 'done' && !aiLoading && lastAiResult && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            AI 분석 완료
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 rounded-full px-2 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => setAiResultDialogOpen(true)}
          >
            AI 분석 결과 보기
          </Button>
        </div>
      )}
      <Dialog open={aiResultDialogOpen} onOpenChange={setAiResultDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col gap-3 p-5">
          <DialogHeader className="pb-1 shrink-0">
            <DialogTitle className="text-base">AI 분석 결과 (원시 응답)</DialogTitle>
          </DialogHeader>
          <pre className="min-h-0 overflow-auto rounded-lg border border-border/60 bg-muted/30 p-4 text-xs font-mono whitespace-pre-wrap break-words">
            {lastAiResult?.rawResponse ?? '(원시 응답 없음)'}
          </pre>
        </DialogContent>
      </Dialog>
      {aiError && <span className="text-xs text-destructive">{aiError}</span>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr,2fr]">
        <div>
          <label className={`block text-[10px] font-medium uppercase tracking-wider text-muted-foreground ${labelClass}`}>
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="사이트 제목"
            className={inputBase}
          />
        </div>
        <div>
          <label className={`block text-[10px] font-medium uppercase tracking-wider text-muted-foreground ${labelClass}`}>
            설명 (선택)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="간단한 설명"
            className={inputBase}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="link-form-is-featured"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="size-4 rounded border-border accent-primary"
        />
        <label
          htmlFor="link-form-is-featured"
          className="text-sm font-medium text-foreground cursor-pointer"
        >
          메인 추천 링크로 표시
        </label>
      </div>
      {dimensions.map((dim) => {
        const values = collectValueIds(dim.values)
        const canAdd = dim.slug === 'purpose' || dim.slug === 'medium'
        const inputVal = newTagByDim[dim.slug] ?? ''
        return (
          <div key={dim.id}>
            <label className={`block text-[10px] font-medium uppercase tracking-wider text-muted-foreground ${labelClass}`}>
              {dim.label}
            </label>
            <div className="flex flex-wrap items-center gap-1">
              {values.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => toggleValue(v.id)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                    valueIds.has(v.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {v.label}
                </button>
              ))}
              {canAdd && (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) =>
                      setNewTagByDim((p) => ({ ...p, [dim.slug]: e.target.value }))
                    }
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      (e.preventDefault(), handleAddTag(dim.slug as 'purpose' | 'medium'))
                    }
                    placeholder={`새 ${dim.label}`}
                    className={`min-w-[5rem] rounded-full px-2.5 py-1 text-[11px] ${inputBase}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full px-2 text-[11px]"
                    onClick={() => handleAddTag(dim.slug as 'purpose' | 'medium')}
                    disabled={!inputVal.trim() || tagAddLoading}
                  >
                    {tagAddLoading ? '추가 중' : '추가'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      })}

      <div className={`flex gap-2 ${compact ? 'pt-0' : 'pt-1'}`}>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={onCancel}
          >
            취소
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          className="rounded-full px-5"
          disabled={submitLoading}
        >
          {submitLoading ? '저장 중...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
