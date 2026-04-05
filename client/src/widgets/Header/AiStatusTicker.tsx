import { useEffect, useRef, useState } from 'react'
import type { AiProviderPublicInfo, PublicMetaResponse } from '@/shared/api/meta'
import { fetchPublicMeta } from '@/shared/api/meta'
import {
  getAiProviderPreference,
  setAiProviderPreference,
  type AiProviderPreference,
} from '@/shared/lib/ai-provider-preference'
import { cn } from '@/lib/utils'

/**
 * 헤더 「전광판」(닫힌 상태): **로컬 AI** / **API** 짧은 표시만.
 * 모델·호스트 조합(`label`)은 드롭다운 항목·툴팁·스크린리더용으로만 사용 (`/api/meta`).
 */

function oneLine(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

function isOptionsMeta(
  ai: PublicMetaResponse['ai'] | undefined
): ai is { local: AiProviderPublicInfo; api: AiProviderPublicInfo } {
  if (!ai || typeof ai !== 'object') return false
  const l = (ai as { local?: unknown }).local
  const a = (ai as { api?: unknown }).api
  return (
    l !== null &&
    typeof l === 'object' &&
    'label' in l &&
    a !== null &&
    typeof a === 'object' &&
    'label' in a
  )
}

/** 헤더 전광판: 닫힌 상태는 로컬 AI·API만 표시, 클릭 시 상세·전환 */
export function AiStatusTicker() {
  const [meta, setMeta] = useState<PublicMetaResponse | null>(null)
  const [preference, setPreference] = useState<AiProviderPreference>(() =>
    typeof window !== 'undefined' ? getAiProviderPreference() : 'local'
  )
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    fetchPublicMeta().then((m) => {
      if (!cancelled && m?.ai) setMeta(m)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const select = (p: AiProviderPreference) => {
    setAiProviderPreference(p)
    setPreference(p)
    setOpen(false)
  }

  const options = meta?.ai
  if (!isOptionsMeta(options)) {
    return (
      <span
        className="flex w-[200px] shrink-0 justify-center text-[10px] text-muted-foreground"
        aria-label="AI 연결 정보 불러오는 중"
      >
        AI · …
      </span>
    )
  }

  const active = preference === 'api' ? options.api : options.local
  const detailLabel = oneLine(active.label)
  const tickerFace = preference === 'local' ? '로컬 AI' : 'API'

  return (
    <div ref={rootRef} className="relative w-[120px] shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`AI 제공자 선택, 현재 ${tickerFace}, ${detailLabel}`}
        title={`${tickerFace} — ${detailLabel}. 클릭하여 전환`}
        className="relative flex h-7 w-full cursor-pointer items-center overflow-hidden rounded-md border border-border/60 bg-muted/35 text-left shadow-[inset_0_1px_2px_oklch(0_0_0/0.06)] transition-colors hover:bg-muted/50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0 flex-1 truncate px-2 text-left text-[11px] font-medium leading-none text-muted-foreground">
          {tickerFace}
        </span>
        <span className="shrink-0 pr-1.5 text-[10px] text-muted-foreground">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="AI 제공자"
          className="absolute right-0 top-full z-[80] mt-1 w-full min-w-[min(100%,280px)] rounded-lg border border-border/60 bg-background py-1 shadow-md"
        >
          <li role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={preference === 'local'}
              onClick={() => select('local')}
              className={cn(
                'flex w-full flex-col gap-0.5 px-3 py-2 text-left text-xs transition-colors hover:bg-muted/60',
                preference === 'local' && 'bg-primary/10'
              )}
            >
              <span className="font-medium text-foreground">로컬 AI</span>
              <span className="break-all font-mono text-[10px] text-muted-foreground">
                {oneLine(options.local.label)}
              </span>
            </button>
          </li>
          <li role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={preference === 'api'}
              onClick={() => select('api')}
              className={cn(
                'flex w-full flex-col gap-0.5 px-3 py-2 text-left text-xs transition-colors hover:bg-muted/60',
                preference === 'api' && 'bg-primary/10'
              )}
            >
              <span className="font-medium text-foreground">API (Gemini)</span>
              <span className="break-all font-mono text-[10px] text-muted-foreground">
                {oneLine(options.api.label)}
              </span>
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
