import { useCallback, useEffect, useState } from 'react'
import { SITE_DOMAIN } from '@/shared/config/site-domain'
import {
  fetchSiteDomainSettings,
  renewSiteDomainSettings,
  type SiteDomainSettings,
} from '@/shared/api/site-domain'
import { useAuth } from '@/shared/context/AuthContext'
import {
  DEFAULT_SITE_DOMAIN_DATES,
  formatKoreanDate,
  getDomainExpiryFillStyle,
  getDomainExpiryInfo,
} from '@/shared/lib/domain-expiry'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const CalendarIcon = () => (
  <svg
    className="size-3.5 shrink-0 opacity-70"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

function toDatesInput(settings: SiteDomainSettings) {
  return {
    registeredDate: settings.registeredDate,
    expiryDate: settings.expiryDate,
    renewalReminderDays: settings.renewalReminderDays,
  }
}

export default function DomainExpiryNotice() {
  const { token } = useAuth()
  const [dates, setDates] = useState(DEFAULT_SITE_DOMAIN_DATES)
  const [renewing, setRenewing] = useState(false)
  const [renewError, setRenewError] = useState('')

  useEffect(() => {
    fetchSiteDomainSettings()
      .then((settings) => setDates(toDatesInput(settings)))
      .catch(() => {
        /* API/DB 없으면 config 기본값 유지 */
      })
  }, [])

  const info = getDomainExpiryInfo(dates)
  const fill = getDomainExpiryFillStyle(info.elapsedRatio)
  const registeredLabel = formatKoreanDate(info.registeredDate)
  const expiryLabel = formatKoreanDate(info.expiryDate)
  const renewalStartLabel = formatKoreanDate(info.renewalStartDate)
  const pastRenewalMarker = info.elapsedRatio * 100 >= info.renewalMarkerPercent

  const isHighlight =
    info.phase === 'renewal-window' ||
    info.phase === 'urgent' ||
    info.phase === 'expired'

  const message = (() => {
    switch (info.phase) {
      case 'expired':
        return `도메인 만료일이 지났습니다. ${SITE_DOMAIN.registrarName}에서 즉시 연장하세요.`
      case 'urgent':
        return `만료까지 ${info.daysUntilExpiry}일 남았습니다. 지금 연장하세요.`
      case 'renewal-window':
        return `연장 권장 기간입니다. 만료까지 ${info.daysUntilExpiry}일 남았습니다.`
      default:
        return `만료까지 ${info.daysUntilExpiry}일 · ${renewalStartLabel}부터 연장 권장.`
    }
  })()

  const daysLeftLabel =
    info.daysUntilExpiry < 0
      ? '만료됨'
      : `만료까지 ${info.daysUntilExpiry}일`

  const handleRenew = useCallback(async () => {
    if (!token) return
    setRenewError('')
    setRenewing(true)
    try {
      const settings = await renewSiteDomainSettings(token)
      setDates(toDatesInput(settings))
    } catch (err) {
      setRenewError(err instanceof Error ? err.message : '연장 반영 실패')
    } finally {
      setRenewing(false)
    }
  }, [token])

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label={`도메인 이용 기간 ${daysLeftLabel}, 만료 임박 ${fill.widthPercent}%`}
      className={cn(
        'relative mb-4 overflow-hidden rounded-lg border bg-muted/20 text-xs leading-relaxed sm:mb-5 sm:text-sm',
        fill.borderClass
      )}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-0 transition-[width] duration-500 ease-out"
        style={{
          width: `${fill.widthPercent}%`,
          background: fill.background,
        }}
        aria-hidden
      />
      {/* 만료 30일 전(연장 권장 시작) — 하단 쐐기 */}
      <div
        className={cn(
          'pointer-events-none absolute bottom-0.5 z-[1] h-0 w-0 -translate-x-1/2 border-x-[4px] border-x-transparent border-b-[5px]',
          pastRenewalMarker
            ? 'border-b-secondary'
            : 'border-b-foreground/35'
        )}
        style={{ left: `${info.renewalMarkerPercent}%` }}
        title={`연장 권장 ${renewalStartLabel}`}
        aria-hidden
      />
      <div className="relative z-[2] flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-2.5">
        <div className="flex min-w-0 items-start gap-2 sm:items-center">
          <CalendarIcon />
          <div className="min-w-0">
            <p className="font-medium text-foreground">
              도메인 만료 ·{' '}
              <span className="font-mono text-[0.9em]">{SITE_DOMAIN.hostname}</span>
              <span className="ml-1.5 font-normal text-muted-foreground">
                ({daysLeftLabel})
              </span>
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {SITE_DOMAIN.registrarName} · 등록 {registeredLabel} · 만료 {expiryLabel}
              <span className="hidden sm:inline">
                {' '}
                · 연장 권장 {renewalStartLabel}
              </span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1.5 pl-5 sm:items-end sm:pl-0">
          <p
            className={cn(
              'text-left sm:text-right',
              isHighlight ? 'font-medium text-secondary' : 'text-muted-foreground'
            )}
          >
            {message}{' '}
            <a
              href={SITE_DOMAIN.registrarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              {SITE_DOMAIN.registrarName} →
            </a>
          </p>
          {token && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={renewing}
                onClick={() => void handleRenew()}
              >
                {renewing ? '반영 중…' : '오늘 연장 반영'}
              </Button>
              {renewError && (
                <span className="text-[11px] text-destructive">{renewError}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
