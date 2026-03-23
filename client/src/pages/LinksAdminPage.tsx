import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'
import {
  fetchLinks,
  fetchDimensions,
  deleteLink,
  buildValueIdToMeta,
  type LinkWithValues,
  type DimensionWithValues,
} from '@/shared/api/links'
import { Button } from '@/components/ui/button'
import { AddLinkDialog } from '@/widgets/AddLinkDialog'
import LinksTagManager from '@/widgets/LinksTagManager'

type AdminSection = 'links' | 'tags'

export default function LinksAdminPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [links, setLinks] = useState<LinkWithValues[]>([])
  const [dimensions, setDimensions] = useState<DimensionWithValues[]>([])
  const [linkFormOpen, setLinkFormOpen] = useState(false)
  const [linkToEdit, setLinkToEdit] = useState<LinkWithValues | null>(null)
  const [adminSection, setAdminSection] = useState<AdminSection>('links')

  const valueIdToMeta = buildValueIdToMeta(dimensions)

  const loadData = () => {
    if (!token) return
    Promise.all([fetchLinks(), fetchDimensions()]).then(([l, d]) => {
      setLinks(l)
      setDimensions(d)
    })
  }

  useEffect(() => {
    if (token) loadData()
  }, [token])

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
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent('/links/admin')}`}
        replace
      />
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap gap-2 border-b border-border/40 pb-3">
        <button
          type="button"
          onClick={() => setAdminSection('links')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            adminSection === 'links'
              ? 'bg-secondary text-secondary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-secondary'
          }`}
        >
          링크 관리
        </button>
        <button
          type="button"
          onClick={() => setAdminSection('tags')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            adminSection === 'tags'
              ? 'bg-secondary text-secondary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-secondary'
          }`}
        >
          태그 관리
        </button>
      </div>

      {adminSection === 'tags' && token && (
        <div className="mb-10">
          <LinksTagManager
            token={token}
            dimensions={dimensions}
            setDimensions={setDimensions}
            onTagsChanged={loadData}
          />
        </div>
      )}

      {adminSection === 'links' && (
        <div className="mb-10">
          <Button
            size="sm"
            className="rounded-full px-5"
            onClick={() => {
              setLinkToEdit(null)
              setLinkFormOpen(true)
            }}
          >
            새 링크 추가
          </Button>
        </div>
      )}

      <AddLinkDialog
        open={linkFormOpen}
        onOpenChange={(open) => {
          setLinkFormOpen(open)
          if (!open) setLinkToEdit(null)
        }}
        token={token!}
        dimensions={dimensions}
        setDimensions={setDimensions}
        onLinkAdded={loadData}
        linkToEdit={linkToEdit}
      />

      {adminSection === 'links' && (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <div
            key={link.id}
            className="flex flex-col rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover-bg-card"
          >
            <h3 className="font-semibold text-foreground">{link.title}</h3>
            {link.valueIds.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {(() => {
                  const byDim = link.valueIds.reduce<
                    Record<string, string[]>
                  >((acc, vid) => {
                    const meta = valueIdToMeta[vid]
                    if (!meta) return acc
                    const list = acc[meta.dimensionLabel] ?? []
                    list.push(meta.label)
                    acc[meta.dimensionLabel] = list
                    return acc
                  }, {})
                  return Object.entries(byDim).map(
                    ([dimLabel, labels]) => (
                      <div
                        key={dimLabel}
                        className="flex flex-wrap items-center gap-1"
                      >
                        <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/80">
                          {dimLabel}:
                        </span>
                        {labels.map((l) => (
                          <span
                            key={`${dimLabel}-${l}`}
                            className="rounded-full bg-muted/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    )
                  )
                })()}
              </div>
            )}
            {link.description && (
              <div className="relative mt-2">
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {link.description}
                </p>
                <div className="mt-1 flex justify-end">
                  <span
                    className="group/more relative inline-block cursor-default text-[10px] text-muted-foreground/80 hover:text-muted-foreground"
                    title={link.description}
                  >
                    더보기
                    <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden max-h-40 w-64 -translate-x-1/2 overflow-auto rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs text-foreground shadow-lg group-hover/more:block">
                      {link.description}
                    </span>
                  </span>
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setLinkToEdit(link)
                  setLinkFormOpen(true)
                }}
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
            <p className="mt-3 truncate font-mono text-[9px] text-muted-foreground/60">
              {link.url}
            </p>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
