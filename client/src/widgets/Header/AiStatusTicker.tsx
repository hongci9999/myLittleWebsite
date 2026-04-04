import { useEffect, useState } from 'react'
import type { AiProviderPublicInfo } from '@/shared/api/meta'
import { fetchPublicMeta } from '@/shared/api/meta'

const SESSION_DISMISS_KEY = 'mlw-header-ai-status-dismissed'

function oneLine(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/**
 * 헤더에 현재 백엔드 AI 연결 정보 표시. 클릭 시 이 탭 세션에서만 숨김(sessionStorage).
 */
export function AiStatusTicker() {
  const [ai, setAi] = useState<AiProviderPublicInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === '1') setDismissed(true)
    } catch {
      /* private mode 등 */
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchPublicMeta().then((m) => {
      if (!cancelled && m?.ai) setAi(m.ai)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const dismiss = () => {
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  if (dismissed) return null

  if (!ai) {
    return (
      <span
        className="flex w-[168px] shrink-0 justify-center text-[10px] text-muted-foreground"
        aria-label="AI 연결 정보 불러오는 중"
      >
        AI · …
      </span>
    )
  }

  const label = oneLine(ai.label)

  return (
    <div className="flex w-[168px] shrink-0">
      <button
        type="button"
        onClick={dismiss}
        title="클릭하면 이 안내를 숨깁니다(이 브라우저 탭을 닫기 전까지)"
        aria-label={`현재 연결 AI: ${label}. 클릭하면 안내를 숨깁니다.`}
        className="relative flex h-7 w-[168px] cursor-pointer items-center overflow-hidden rounded-md border border-border/60 bg-muted/35 text-left shadow-[inset_0_1px_2px_oklch(0_0_0/0.06)] transition-colors hover:bg-muted/50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap px-2 text-left font-mono text-[11px] leading-none text-muted-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {label}
        </span>
      </button>
    </div>
  )
}
