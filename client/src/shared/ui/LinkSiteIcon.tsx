import { useState } from 'react'
import { cn } from '@/lib/utils'

/** 저장된 파비콘 URL 표시. 로드 실패 시 숨김 */
export function LinkSiteIcon({
  faviconUrl,
  className,
}: {
  faviconUrl: string | null | undefined
  className?: string
}) {
  const [hide, setHide] = useState(false)
  if (!faviconUrl?.trim() || hide) return null
  return (
    <img
      src={faviconUrl.trim()}
      alt=""
      width={20}
      height={20}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={cn('size-5 shrink-0 rounded object-contain', className)}
      onError={() => setHide(true)}
    />
  )
}
