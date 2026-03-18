import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'
import {
  fetchLinks,
  fetchDimensions,
  createLink,
  updateLink,
  deleteLink,
  type LinkWithValues,
  type DimensionWithValues,
  type ValueTree,
} from '@/shared/api/links'
import { Button } from '@/components/ui/button'

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

export default function LinksAdminPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [links, setLinks] = useState<LinkWithValues[]>([])
  const [dimensions, setDimensions] = useState<DimensionWithValues[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formUrl, setFormUrl] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formValueIds, setFormValueIds] = useState<Set<string>>(new Set())

  const allValues = dimensions.flatMap((d) => collectValueIds(d.values))
  const valueLabels = Object.fromEntries(allValues.map((v) => [v.id, v.label]))

  const loadData = () => {
    if (!token) return
    Promise.all([
      fetchLinks(),
      fetchDimensions(),
    ]).then(([l, d]) => {
      setLinks(l)
      setDimensions(d)
    })
  }

  useEffect(() => {
    if (token) loadData()
  }, [token])

  const resetForm = () => {
    setEditingId(null)
    setFormUrl('')
    setFormTitle('')
    setFormDescription('')
    setFormValueIds(new Set())
  }

  const openEditForm = (link: LinkWithValues) => {
    setEditingId(link.id)
    setFormUrl(link.url)
    setFormTitle(link.title)
    setFormDescription(link.description ?? '')
    setFormValueIds(new Set(link.valueIds))
  }

  const toggleFormValue = (id: string) => {
    setFormValueIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !formUrl.trim() || !formTitle.trim()) return
    if (editingId) {
      const updated = await updateLink(token, editingId, {
        url: formUrl.trim(),
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        valueIds: Array.from(formValueIds),
      })
      if (updated) {
        setLinks((prev) =>
          prev.map((l) => (l.id === editingId ? { ...l, ...updated } : l))
        )
        resetForm()
      }
    } else {
      const created = await createLink(token, {
        url: formUrl.trim(),
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        valueIds: Array.from(formValueIds),
      })
      if (created) {
        setLinks((prev) => [...prev, created])
        resetForm()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!token || !confirm('삭제할까요?')) return
    const ok = await deleteLink(token, id)
    if (ok) setLinks((prev) => prev.filter((l) => l.id !== id))
  }

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <div className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (!token) {
    return <Navigate to={`/login?redirect=${encodeURIComponent('/links/admin')}`} replace />
  }

  const inputBase =
    'mt-1.5 w-full rounded-xl border-0 bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20'

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* 추가/수정 폼 */}
      <div className="mb-10 rounded-2xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
        <h2 className="mb-6 text-lg font-semibold tracking-tight">
          {editingId ? '링크 수정' : '새 링크 추가'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              URL
            </label>
            <input
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              required
              placeholder="https://..."
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              제목
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              placeholder="링크 제목"
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              설명 (선택)
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={2}
              placeholder="간단한 설명"
              className={`${inputBase} resize-none`}
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
                      onClick={() => toggleFormValue(v.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        formValueIds.has(v.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/60 text-muted-foreground hover-bg hover:text-foreground'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          <div className="flex gap-2 pt-2">
            <Button type="submit" size="sm" className="rounded-full px-5">
              {editingId ? '저장' : '추가'}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={resetForm}
              >
                취소
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* 링크 목록 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <div
            key={link.id}
            className="flex flex-col rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover-bg-card"
          >
            <h3 className="font-semibold text-foreground">
              {link.title}
            </h3>
            {link.description && (
              <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                {link.description}
              </p>
            )}
            <p className="mt-2 truncate font-mono text-[11px] text-muted-foreground/80">
              {link.url}
            </p>
            {link.valueIds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {link.valueIds.map((vid) => (
                  <span
                    key={vid}
                    className="rounded-md bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {valueLabels[vid] ?? vid}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => openEditForm(link)}
              >
                수정
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleDelete(link.id)}
              >
                삭제
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
