import { useEffect, useState } from 'react'
import { fetchPublicMeta, type PublicMetaResponse } from '@/shared/api/meta'

/** 헤더: 서버가 쓰는 AI 모델 표시 (`/api/meta`) */
export function AiModelBadge() {
  const [ai, setAi] = useState<PublicMetaResponse['ai'] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchPublicMeta().then((m) => {
      if (!cancelled && m?.ai?.model) setAi(m.ai)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const face = ai ? ai.model : '…'
  const detail = ai
    ? `텍스트: ${ai.model} · 영상 직접 분석: ${ai.youtubeModel}${ai.keyConfigured ? '' : ' · API 키 없음'}`
    : 'AI 모델 정보 불러오는 중'

  return (
    <span
      title={detail}
      aria-label={`AI 모델 — ${detail}`}
      className="hidden h-7 max-w-[200px] shrink-0 items-center gap-1.5 rounded-md border border-border/60 bg-muted/35 px-2 text-[11px] font-medium leading-none text-muted-foreground shadow-[inset_0_1px_2px_oklch(0_0_0/0.06)] md:flex"
    >
      <span
        className={ai && !ai.keyConfigured ? 'text-destructive' : 'text-primary'}
        aria-hidden
      >
        ●
      </span>
      <span className="truncate font-mono">{face}</span>
    </span>
  )
}
