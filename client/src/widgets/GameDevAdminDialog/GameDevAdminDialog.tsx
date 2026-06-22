import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'
import {
  createGameDevResource,
  fetchGameDevResourceBySlug,
  MEDIA_KIND_OPTIONS,
  CATEGORY_OPTIONS,
  updateGameDevResource,
  type GameDevResource,
  type MediaKind,
  type Category,
} from '@/shared/api/game-dev'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const GAME_DEV_CHANGED = 'game-dev-changed'

export function notifyGameDevChanged() {
  window.dispatchEvent(new Event(GAME_DEV_CHANGED))
}

export function subscribeGameDevChanged(fn: () => void) {
  window.addEventListener(GAME_DEV_CHANGED, fn)
  return () => window.removeEventListener(GAME_DEV_CHANGED, fn)
}

type ExtraRow = { label: string; url: string }

function emptyForm() {
  return {
    title: '',
    url: '',
    mediaKind: 'youtube' as MediaKind,
    category: 'graphics' as Category,
    summary: '',
    bodyMd: '',
    slug: '',
    tagsStr: '',
    extraLinks: [] as ExtraRow[],
  }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSlug: string | null
}

export function GameDevAdminDialog({ open, onOpenChange, initialSlug }: Props) {
  const { token, isLoading: authLoading } = useAuth()
  const [editing, setEditing] = useState<GameDevResource | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setEditing(null)
      return
    }
    if (!initialSlug) {
      setEditing(null)
      return
    }
    if (!token) return
    let cancelled = false
    ;(async () => {
      const s = await fetchGameDevResourceBySlug(initialSlug)
      if (!cancelled && s) setEditing(s)
    })()
    return () => {
      cancelled = true
    }
  }, [open, initialSlug, token])

  useEffect(() => {
    if (!open) {
      return
    }
    if (editing) {
      setForm({
        title: editing.title,
        url: editing.url,
        mediaKind: editing.mediaKind,
        category: editing.category,
        summary: editing.summary ?? '',
        bodyMd: editing.bodyMd ?? '',
        slug: editing.slug,
        tagsStr: editing.tags.join(', '),
        extraLinks:
          editing.extraLinks.length > 0
            ? editing.extraLinks.map((l) => ({ ...l }))
            : [{ label: '', url: '' }],
      })
    } else {
      setForm({
        ...emptyForm(),
        extraLinks: [{ label: '', url: '' }],
      })
    }
  }, [editing, open])

  const normalizedExtras = form.extraLinks.filter((r) => r.url.trim())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    try {
      const tags = form.tagsStr
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean)
      if (editing) {
        await updateGameDevResource(token, editing.id, {
          title: form.title.trim(),
          url: form.url.trim(),
          mediaKind: form.mediaKind,
          category: form.category,
          summary: form.summary.trim() || null,
          bodyMd: form.bodyMd.trim() || null,
          slug: form.slug.trim() || null,
          tags,
          extraLinks: normalizedExtras.map((r) => ({
            label: r.label.trim() || '링크',
            url: r.url.trim(),
          })),
        })
      } else {
        await createGameDevResource(token, {
          title: form.title.trim(),
          url: form.url.trim(),
          mediaKind: form.mediaKind,
          category: form.category,
          summary: form.summary.trim() || null,
          bodyMd: form.bodyMd.trim() || null,
          slug: form.slug.trim() || null,
          tags,
          extraLinks: normalizedExtras.map((r) => ({
            label: r.label.trim() || '링크',
            url: r.url.trim(),
          })),
        })
        setEditing(null)
      }
      notifyGameDevChanged()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '실패')
    } finally {
      setSaving(false)
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
          <DialogTitle>게임 개발 자료 추가·편집</DialogTitle>
          <p className="text-sm text-muted-foreground">
            URL·요약·마크다운을 저장합니다. 슬러그는 비우면 제목에서 자동 생성됩니다.
          </p>
          {!authLoading && token ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
              <Button type="submit" form="game-dev-admin-form" disabled={saving}>
                {saving ? '저장 중…' : editing ? '수정 저장' : '추가'}
              </Button>
              {editing ? (
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link
                    to={`/game-dev/${encodeURIComponent(editing.slug)}`}
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
                to={`/login?redirect=${encodeURIComponent('/game-dev')}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => onOpenChange(false)}
              >
                로그인
              </Link>
            </p>
          ) : (
            <>
              <form
                id="game-dev-admin-form"
                onSubmit={handleSubmit}
                className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground">제목 *</span>
                    <input
                      required
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground">원문 URL *</span>
                    <input
                      required
                      type="text"
                      inputMode="url"
                      value={form.url}
                      onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                      placeholder="https://…"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">종류 *</span>
                    <select
                      value={form.mediaKind}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          mediaKind: e.target.value as MediaKind,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      {MEDIA_KIND_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">분야 *</span>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      {CATEGORY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground">슬러그 (선택)</span>
                    <input
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
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
                    onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">
                    상세 페이지 본문 (Markdown) — 요약·메모
                  </span>
                  <textarea
                    value={form.bodyMd}
                    onChange={(e) => setForm((f) => ({ ...f, bodyMd: e.target.value }))}
                    rows={10}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm leading-relaxed"
                  />
                </label>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">추가 링크</span>
                    <Button type="button" variant="outline" size="sm" onClick={addExtraRow}>
                      행 추가
                    </Button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    원문 외 참고·관련 문서 URL (상세 페이지에 목록으로 표시)
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
                    태그 (쉼표로 여러 개 — 카드 표시 및 통합 검색에 포함)
                  </span>
                  <input
                    value={form.tagsStr}
                    onChange={(e) => setForm((f) => ({ ...f, tagsStr: e.target.value }))}
                    placeholder="예: ECS, Unity, Vulkan"
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
