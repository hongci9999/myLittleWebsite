import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  fetchDimensions,
  createTag,
  updateTag,
  deleteTag,
  type DimensionWithValues,
  type ValueTree,
} from '@/shared/api/links'

const inputClass =
  'min-w-0 flex-1 rounded-lg border-0 bg-muted/40 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20'

type TagRowProps = {
  token: string
  node: ValueTree
  depth: number
  dimensionSlug: 'purpose' | 'medium'
  allowChildren: boolean
  onDataChanged: () => void
}

function TagRow({
  token,
  node,
  depth,
  dimensionSlug,
  allowChildren,
  onDataChanged,
}: TagRowProps) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(node.label)
  const [childOpen, setChildOpen] = useState(false)
  const [childLabel, setChildLabel] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setLabel(node.label)
  }, [node.id, node.label])

  const saveEdit = async () => {
    const next = label.trim()
    if (!next || next === node.label) {
      setEditing(false)
      setLabel(node.label)
      return
    }
    setBusy(true)
    const ok = await updateTag(token, node.id, next)
    setBusy(false)
    if (ok) onDataChanged()
    else setLabel(node.label)
    setEditing(false)
  }

  const remove = async () => {
    if (
      !confirm(
        '이 태그를 삭제할까요?\n링크에 붙은 태그는 제거되고, 하위 태그가 있으면 함께 삭제됩니다.'
      )
    )
      return
    setBusy(true)
    const ok = await deleteTag(token, node.id)
    setBusy(false)
    if (ok) onDataChanged()
  }

  const addChild = async () => {
    const t = childLabel.trim()
    if (!t) return
    setBusy(true)
    const created = await createTag(token, t, 'purpose', node.id)
    setBusy(false)
    if (created) {
      setChildLabel('')
      setChildOpen(false)
      onDataChanged()
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        className="flex flex-wrap items-center gap-2 rounded-lg border border-border/40 bg-card/50 py-2 pl-2 pr-2"
        style={{ marginLeft: depth * 12 }}
      >
        {editing ? (
          <>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={inputClass}
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void saveEdit()
                if (e.key === 'Escape') {
                  setLabel(node.label)
                  setEditing(false)
                }
              }}
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              disabled={busy}
              onClick={() => void saveEdit()}
            >
              저장
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-2 text-xs"
              disabled={busy}
              onClick={() => {
                setLabel(node.label)
                setEditing(false)
              }}
            >
              취소
            </Button>
          </>
        ) : (
          <>
            <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
              {node.label}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              disabled={busy}
              onClick={() => setEditing(true)}
            >
              이름 수정
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={busy}
              onClick={() => void remove()}
            >
              삭제
            </Button>
            {allowChildren && dimensionSlug === 'purpose' && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                disabled={busy}
                onClick={() => setChildOpen((v) => !v)}
              >
                {childOpen ? '하위 추가 닫기' : '하위 태그 추가'}
              </Button>
            )}
          </>
        )}
      </div>
      {childOpen && allowChildren && dimensionSlug === 'purpose' && (
        <div
          className="flex flex-wrap items-center gap-2 py-1"
          style={{ marginLeft: (depth + 1) * 12 }}
        >
          <input
            type="text"
            value={childLabel}
            onChange={(e) => setChildLabel(e.target.value)}
            placeholder="하위 태그 이름"
            className={inputClass}
            disabled={busy}
            onKeyDown={(e) => e.key === 'Enter' && void addChild()}
          />
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-full px-3 text-xs"
            disabled={busy || !childLabel.trim()}
            onClick={() => void addChild()}
          >
            추가
          </Button>
        </div>
      )}
      {node.children?.map((ch) => (
        <TagRow
          key={ch.id}
          token={token}
          node={ch}
          depth={depth + 1}
          dimensionSlug={dimensionSlug}
          allowChildren={allowChildren}
          onDataChanged={onDataChanged}
        />
      ))}
    </div>
  )
}

type LinksTagManagerProps = {
  token: string
  dimensions: DimensionWithValues[]
  setDimensions: (d: DimensionWithValues[]) => void
  onTagsChanged: () => void
}

export default function LinksTagManager({
  token,
  dimensions,
  setDimensions,
  onTagsChanged,
}: LinksTagManagerProps) {
  const [rootLabelBySlug, setRootLabelBySlug] = useState<
    Record<string, string>
  >({})
  const [adding, setAdding] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const d = await fetchDimensions()
    setDimensions(d)
    onTagsChanged()
  }, [setDimensions, onTagsChanged])

  const managed = dimensions.filter(
    (d) => d.slug === 'purpose' || d.slug === 'medium'
  )

  const addRoot = async (slug: 'purpose' | 'medium') => {
    const label = rootLabelBySlug[slug]?.trim()
    if (!label) return
    setAdding(slug)
    const created = await createTag(token, label, slug)
    setAdding(null)
    if (created) {
      setRootLabelBySlug((p) => ({ ...p, [slug]: '' }))
      await reload()
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-muted-foreground">
        목적·종류 태그를 추가·이름 수정·삭제할 수 있습니다. 삭제 시 해당 태그가
        붙어 있던 링크에서는 태그만 제거되며, 목적의 상위 태그를 삭제하면 하위
        태그도 함께 삭제됩니다.
      </p>
      {managed.map((dim) => {
        const slug = dim.slug as 'purpose' | 'medium'
        return (
          <section
            key={dim.id}
            className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm"
          >
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {dim.label}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({slug})
              </span>
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              {(dim.values ?? []).map((v) => (
                <TagRow
                  key={v.id}
                  token={token}
                  node={v}
                  depth={0}
                  dimensionSlug={slug}
                  allowChildren={dim.allowHierarchy}
                  onDataChanged={() => void reload()}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-border/40 pt-4">
              <div className="min-w-[12rem] flex-1">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  상위 태그 추가
                </label>
                <input
                  type="text"
                  value={rootLabelBySlug[slug] ?? ''}
                  onChange={(e) =>
                    setRootLabelBySlug((p) => ({
                      ...p,
                      [slug]: e.target.value,
                    }))
                  }
                  placeholder={`새 ${dim.label} 태그`}
                  className={`w-full ${inputClass}`}
                  disabled={adding === slug}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && void addRoot(slug)
                  }
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="rounded-full px-4"
                disabled={adding === slug || !(rootLabelBySlug[slug]?.trim())}
                onClick={() => void addRoot(slug)}
              >
                {adding === slug ? '추가 중…' : '추가'}
              </Button>
            </div>
          </section>
        )
      })}
    </div>
  )
}
