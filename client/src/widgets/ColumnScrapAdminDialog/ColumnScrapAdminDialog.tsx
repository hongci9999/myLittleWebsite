import { useEffect, useRef, useState } from 'react'
import {
  isObsidianYoutubeClip,
  looksLikeYoutubeClipDraft,
  prefillFromObsidianYoutubeClip,
} from '@/shared/lib/obsidian-youtube-clip'
import { Link } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'
import {
  createColumnScrap,
  fetchColumnScrapBySlug,
  COLUMN_SOURCE_OPTIONS,
  suggestColumnScrapAiFill,
  updateColumnScrap,
  type ColumnScrap,
  type ColumnScrapExtraLink,
  type ColumnSourceKind,
} from '@/shared/api/column-scraps'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const COLUMN_SCRAPS_CHANGED = 'column-scraps-changed'

export function notifyColumnScrapsChanged() {
  window.dispatchEvent(new Event(COLUMN_SCRAPS_CHANGED))
}

export function subscribeColumnScrapsChanged(fn: () => void) {
  window.addEventListener(COLUMN_SCRAPS_CHANGED, fn)
  return () => window.removeEventListener(COLUMN_SCRAPS_CHANGED, fn)
}

type ExtraRow = ColumnScrapExtraLink

function emptyForm() {
  return {
    title: '',
    url: '',
    sourceKind: 'article' as ColumnSourceKind,
    summary: '',
    bodyMd: '',
    coverImageUrl: '',
    slug: '',
    tagsStr: '',
    extraLinks: [{ label: '', url: '' }] as ExtraRow[],
  }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSlug: string | null
}

export function ColumnScrapAdminDialog({
  open,
  onOpenChange,
  initialSlug,
}: Props) {
  const { token, isLoading: authLoading } = useAuth()
  const [editing, setEditing] = useState<ColumnScrap | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [aiFillLoading, setAiFillLoading] = useState(false)
  const [youtubeClipText, setYoutubeClipText] = useState<string | null>(null)
  const [youtubeClipSource, setYoutubeClipSource] = useState<string | null>(null)
  const [clipPasteDraft, setClipPasteDraft] = useState('')
  const clipFileInputRef = useRef<HTMLInputElement>(null)
  const clipTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) {
      setEditing(null)
      setYoutubeClipText(null)
      setYoutubeClipSource(null)
      setClipPasteDraft('')
      return
    }
    if (!initialSlug) {
      setEditing(null)
      return
    }
    if (!token) return
    let cancelled = false
    ;(async () => {
      const s = await fetchColumnScrapBySlug(initialSlug)
      if (!cancelled && s) setEditing(s)
    })()
    return () => {
      cancelled = true
    }
  }, [open, initialSlug, token])

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        title: editing.title,
        url: editing.url,
        sourceKind: editing.sourceKind,
        summary: editing.summary ?? '',
        bodyMd: editing.bodyMd ?? '',
        coverImageUrl: editing.coverImageUrl ?? '',
        slug: editing.slug,
        tagsStr: editing.tags.join(', '),
        extraLinks:
          editing.extraLinks.length > 0
            ? editing.extraLinks.map((l) => ({ ...l }))
            : [{ label: '', url: '' }],
      })
    } else {
      setForm(emptyForm())
    }
  }, [editing, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    let urlToSave = form.url.trim()
    if (!urlToSave) {
      const clip = resolveYoutubeClipForAi()
      urlToSave = clip ? (prefillFromObsidianYoutubeClip(clip)?.url ?? '') : ''
      if (urlToSave) setForm((f) => ({ ...f, url: urlToSave }))
    }
    if (!urlToSave) {
      window.alert('원문 URL을 입력하거나 클립에서 URL을 추출할 수 있어야 합니다.')
      return
    }
    setSaving(true)
    try {
      const tags = form.tagsStr
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean)
      const normalizedExtras = form.extraLinks
        .filter((r) => r.url.trim())
        .map((r) => ({
          label: r.label.trim() || '링크',
          url: r.url.trim(),
        }))
      if (editing) {
        await updateColumnScrap(token, editing.id, {
          title: form.title.trim(),
          url: urlToSave,
          sourceKind: form.sourceKind,
          summary: form.summary.trim() || null,
          bodyMd: form.bodyMd.trim() || null,
          coverImageUrl: form.coverImageUrl.trim() || null,
          slug: form.slug.trim() || null,
          tags,
          extraLinks: normalizedExtras,
        })
      } else {
        await createColumnScrap(token, {
          title: form.title.trim(),
          url: urlToSave,
          sourceKind: form.sourceKind,
          summary: form.summary.trim() || null,
          bodyMd: form.bodyMd.trim() || null,
          coverImageUrl: form.coverImageUrl.trim() || null,
          slug: form.slug.trim() || null,
          tags,
          extraLinks: normalizedExtras,
        })
        setEditing(null)
      }
      notifyColumnScrapsChanged()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '실패')
    } finally {
      setSaving(false)
    }
  }

  function applyObsidianClip(text: string, sourceLabel: string) {
    const trimmed = text.trim()
    if (!trimmed) {
      window.alert('붙여넣을 클립 내용이 비어 있습니다.')
      return
    }
    if (!isObsidianYoutubeClip(trimmed)) {
      window.alert(
        'Obsidian YouTube 클립 형식이 아닙니다. frontmatter(`---`)·clipper JSON·트랜스크립트 섹션을 확인해 주세요.'
      )
      return
    }
    setYoutubeClipText(trimmed)
    setYoutubeClipSource(sourceLabel)
    setClipPasteDraft(trimmed)
    const prefill = prefillFromObsidianYoutubeClip(trimmed)
    if (prefill) {
      setForm((f) => ({
        ...f,
        url: prefill.url,
        title: f.title.trim() ? f.title : prefill.title,
        sourceKind: 'youtube',
        coverImageUrl: f.coverImageUrl.trim()
          ? f.coverImageUrl
          : (prefill.coverImageUrl ?? ''),
      }))
    }
  }

  function handleApplyClipPaste() {
    applyObsidianClip(clipPasteDraft, '붙여넣기')
  }

  function handleClipFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      setClipPasteDraft(text)
      applyObsidianClip(text, file.name)
    }
    reader.readAsText(file, 'UTF-8')
  }

  function clearObsidianClip() {
    setYoutubeClipText(null)
    setYoutubeClipSource(null)
    setClipPasteDraft('')
  }

  /** textarea DOM 우선 — 붙여넣 직후 클릭해도 state 미반영 문제 방지 */
  function getClipTextForAi(): string {
    const fromDom = clipTextareaRef.current?.value.trim() ?? ''
    if (fromDom) return fromDom
    if (youtubeClipText?.trim()) return youtubeClipText.trim()
    return clipPasteDraft.trim()
  }

  function resolveYoutubeClipForAi(): string | undefined {
    const text = getClipTextForAi()
    if (!text) return undefined
    if (looksLikeYoutubeClipDraft(text)) return text
    if (text.length >= 50) return text
    return undefined
  }

  function syncClipPasteDraft(text: string) {
    setClipPasteDraft(text)
    const trimmed = text.trim()
    if (!trimmed) {
      setYoutubeClipText(null)
      setYoutubeClipSource(null)
      return
    }
    if (!looksLikeYoutubeClipDraft(trimmed)) return
    setYoutubeClipText(trimmed)
    const prefill = prefillFromObsidianYoutubeClip(trimmed)
    if (prefill) {
      setForm((f) => ({
        ...f,
        url: f.url.trim() ? f.url : prefill.url,
        title: f.title.trim() ? f.title : prefill.title,
        sourceKind: 'youtube',
        coverImageUrl: f.coverImageUrl.trim()
          ? f.coverImageUrl
          : (prefill.coverImageUrl ?? ''),
      }))
    }
  }

  async function handleAiFill() {
    const clipForAi = resolveYoutubeClipForAi()
    const urlForAi = clipForAi ? '' : form.url.trim()
    if (!token) return
    if (!urlForAi && !clipForAi) {
      window.alert(
        '원문 URL을 입력하거나 Obsidian YouTube 클립을 붙여넣어 주세요.'
      )
      return
    }
    if (clipForAi) {
      setYoutubeClipText(clipForAi)
      if (!youtubeClipSource) setYoutubeClipSource('붙여넣기')
    }
    setAiFillLoading(true)
    try {
      const r = await suggestColumnScrapAiFill(token, urlForAi, {
        youtubeClip: clipForAi,
      })
      const clipPrefill = clipForAi
        ? prefillFromObsidianYoutubeClip(clipForAi)
        : null
      if (clipForAi && !youtubeClipText) {
        setYoutubeClipText(clipForAi)
        setYoutubeClipSource('붙여넣기')
      }
      setForm((f) => ({
        ...f,
        url: f.url.trim() || clipPrefill?.url || f.url,
        title: r.title || f.title,
        summary: r.summary || f.summary,
        bodyMd: r.bodyMd || f.bodyMd,
        sourceKind: r.sourceKind,
        coverImageUrl: r.coverImageUrl ?? f.coverImageUrl,
        tagsStr: r.tags.length ? r.tags.join(', ') : f.tagsStr,
      }))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'AI 채우기 실패')
    } finally {
      setAiFillLoading(false)
    }
  }

  function addExtraRow() {
    setForm((f) => ({
      ...f,
      extraLinks: [...f.extraLinks, { label: '', url: '' }],
    }))
  }

  function removeExtraRow(i: number) {
    setForm((f) => ({
      ...f,
      extraLinks: f.extraLinks.filter((_, j) => j !== i),
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,900px)] max-w-3xl w-[min(100vw-1.5rem,42rem)] gap-0 overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 border-b border-border/60 bg-card px-5 py-4 text-left">
          <DialogTitle>칼럼 스크랩 추가·편집</DialogTitle>

          {!authLoading && token ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
              <Button
                type="submit"
                form="column-scrap-admin-form"
                disabled={saving}
              >
                {saving ? '저장 중…' : editing ? '수정 저장' : '추가'}
              </Button>
              {editing ? (
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link
                    to={`/column/${encodeURIComponent(editing.slug)}`}
                    onClick={() => onOpenChange(false)}
                  >
                    상세 보기
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          {authLoading ? (
            <p className="text-sm text-muted-foreground">인증 확인 중…</p>
          ) : !token ? (
            <p className="text-sm text-muted-foreground">
              기록하려면 로그인하세요.{' '}
              <Link
                to={`/login?redirect=${encodeURIComponent('/column')}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => onOpenChange(false)}
              >
                로그인
              </Link>
            </p>
          ) : (
            <>
              <form
                id="column-scrap-admin-form"
                onSubmit={handleSubmit}
                className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      제목 *
                    </span>
                    <input
                      required
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                      <span>원문 URL *</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={
                          (!form.url.trim() && !resolveYoutubeClipForAi()) ||
                          aiFillLoading ||
                          saving
                        }
                        onClick={() => void handleAiFill()}
                      >
                        {aiFillLoading ? 'AI 분석 중…' : 'AI 채우기'}
                      </Button>
                    </span>
                    <input
                      required={!resolveYoutubeClipForAi()}
                      type="text"
                      inputMode="url"
                      value={form.url}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, url: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
                      placeholder="https://…"
                    />
                  </label>
                  <div className="block sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      YouTube 클립 붙여넣기 (선택)
                    </span>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Obsidian Web Clipper raw/youtube 노트 전문을 붙여넣으세요.
                      「AI 채우기」는 URL 없이 **자막(스크립트)만** 서버에 보내
                      분석합니다. 저장용 URL·제목은 「클립 적용」으로 채울 수
                      있습니다.
                    </p>
                    <textarea
                      ref={clipTextareaRef}
                      value={clipPasteDraft}
                      onChange={(e) => syncClipPasteDraft(e.target.value)}
                      rows={8}
                      spellCheck={false}
                      placeholder={`---\nsource: "https://www.youtube.com/watch?v=…"\ntitle: "영상 제목"\ncreator:\n  - "[[채널명]]"\npublished: 2026-06-04\ntags:\n  - "raw/youtube"\n---\n…## 트랜스크립트…`}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs leading-relaxed"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        ref={clipFileInputRef}
                        type="file"
                        accept=".md,.txt,text/markdown,text/plain"
                        className="hidden"
                        onChange={handleClipFileChange}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={
                          !clipPasteDraft.trim() || aiFillLoading || saving
                        }
                        onClick={handleApplyClipPaste}
                      >
                        클립 적용
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={aiFillLoading || saving}
                        onClick={() => clipFileInputRef.current?.click()}
                      >
                        파일에서 가져오기
                      </Button>
                      {youtubeClipText ? (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                          onClick={clearObsidianClip}
                        >
                          클립 해제
                        </button>
                      ) : null}
                    </div>
                    {youtubeClipText ? (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        <span className="rounded-md border border-primary/30 bg-primary/5 px-2 py-0.5 text-primary">
                          클립 적용됨
                          {youtubeClipSource ? ` · ${youtubeClipSource}` : ''}
                        </span>
                        <span className="ml-2">
                          AI 채우기 시 위 클립의 자막·메타를 사용합니다.
                        </span>
                      </p>
                    ) : null}
                  </div>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">
                      형식 *
                    </span>
                    <select
                      value={form.sourceKind}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          sourceKind: e.target.value as ColumnSourceKind,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      {COLUMN_SOURCE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">
                      슬러그 (선택)
                    </span>
                    <input
                      value={form.slug}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, slug: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">
                    카드 한 줄 요약 (목록에 표시)
                  </span>
                  <textarea
                    value={form.summary}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, summary: e.target.value }))
                    }
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">
                    표지 이미지 URL (선택, 카드 상단)
                  </span>
                  <input
                    value={form.coverImageUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, coverImageUrl: e.target.value }))
                    }
                    type="text"
                    inputMode="url"
                    placeholder="https://…"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">
                    상세 페이지 본문 (Markdown) — 요약·메모
                  </span>
                  <textarea
                    value={form.bodyMd}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bodyMd: e.target.value }))
                    }
                    rows={10}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm leading-relaxed"
                  />
                </label>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      추가 링크
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addExtraRow}
                    >
                      행 추가
                    </Button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    원문 외 참고·후속 글 URL (상세 페이지에 목록으로 표시)
                  </p>
                  <div className="mt-2 space-y-2">
                    {form.extraLinks.map((row, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-2 sm:flex-row sm:items-center"
                      >
                        <input
                          value={row.label}
                          onChange={(e) => {
                            const next = [...form.extraLinks]
                            next[i] = { ...next[i], label: e.target.value }
                            setForm((f) => ({ ...f, extraLinks: next }))
                          }}
                          placeholder="라벨"
                          className="rounded border border-border bg-background px-2 py-1.5 text-sm sm:w-32"
                        />
                        <input
                          value={row.url}
                          onChange={(e) => {
                            const next = [...form.extraLinks]
                            next[i] = { ...next[i], url: e.target.value }
                            setForm((f) => ({ ...f, extraLinks: next }))
                          }}
                          placeholder="https://"
                          className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1.5 font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExtraRow(i)}
                          disabled={form.extraLinks.length <= 1}
                        >
                          삭제
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">
                    태그 (쉼표로 여러 개 — 카드에 표시)
                  </span>
                  <input
                    value={form.tagsStr}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tagsStr: e.target.value }))
                    }
                    placeholder="예: 프론트, 리액트, 아키텍처"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
