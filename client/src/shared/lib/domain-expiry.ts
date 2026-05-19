import { SITE_DOMAIN } from '@/shared/config/site-domain'

export type SiteDomainDatesInput = {
  registeredDate: string
  expiryDate: string
  renewalReminderDays?: number
}

export const DEFAULT_SITE_DOMAIN_DATES: SiteDomainDatesInput = {
  registeredDate: SITE_DOMAIN.registeredDate,
  expiryDate: SITE_DOMAIN.expiryDate,
  renewalReminderDays: SITE_DOMAIN.renewalReminderDays,
}

export type DomainExpiryPhase = 'normal' | 'renewal-window' | 'urgent' | 'expired'

export type DomainExpiryInfo = {
  phase: DomainExpiryPhase
  daysUntilExpiry: number
  daysUntilRenewalWindow: number
  daysElapsed: number
  totalPeriodDays: number
  /** 등록~만료 구간에서 남은 비율 (1=막 등록, 0=만료일) */
  remainingRatio: number
  /** 등록~만료 구간에서 경과 비율 (0=막 등록, 1=만료·만료 후) — 바 채움에 사용 */
  elapsedRatio: number
  registeredDate: Date
  expiryDate: Date
  renewalStartDate: Date
  /** 바 위 30일 전(연장 권장 시작) 표시 위치 (0~100) */
  renewalMarkerPercent: number
}

export type DomainExpiryFillStyle = {
  widthPercent: number
  background: string
  borderClass: string
}

/** YYYY-MM-DD를 로컬 자정 Date로 파싱 */
function parseLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function diffCalendarDays(later: Date, earlier: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round(
    (startOfLocalDay(later).getTime() - startOfLocalDay(earlier).getTime()) / msPerDay
  )
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function getRenewalMarkerPercent(
  totalPeriodDays: number,
  renewalReminderDays: number
): number {
  return Math.round(
    clamp01((totalPeriodDays - renewalReminderDays) / totalPeriodDays) * 100
  )
}

export function getDomainExpiryInfo(
  dates: SiteDomainDatesInput = DEFAULT_SITE_DOMAIN_DATES,
  now = new Date()
): DomainExpiryInfo {
  const renewalReminderDays =
    dates.renewalReminderDays ?? SITE_DOMAIN.renewalReminderDays
  const today = startOfLocalDay(now)
  const registeredDate = parseLocalDate(dates.registeredDate)
  const expiryDate = parseLocalDate(dates.expiryDate)
  const renewalStartDate = new Date(expiryDate)
  renewalStartDate.setDate(
    renewalStartDate.getDate() - renewalReminderDays
  )

  const totalPeriodDays = Math.max(1, diffCalendarDays(expiryDate, registeredDate))
  const daysUntilExpiry = diffCalendarDays(expiryDate, today)
  const daysUntilRenewalWindow = diffCalendarDays(renewalStartDate, today)
  const daysElapsed = diffCalendarDays(today, registeredDate)
  const remainingRatio =
    daysUntilExpiry <= 0
      ? 0
      : clamp01(daysUntilExpiry / totalPeriodDays)
  const elapsedRatio =
    daysUntilExpiry < 0 ? 1 : clamp01(1 - remainingRatio)

  let phase: DomainExpiryPhase
  if (daysUntilExpiry < 0) {
    phase = 'expired'
  } else if (daysUntilExpiry <= 7) {
    phase = 'urgent'
  } else if (daysUntilRenewalWindow <= 0) {
    phase = 'renewal-window'
  } else {
    phase = 'normal'
  }

  return {
    phase,
    daysUntilExpiry,
    daysUntilRenewalWindow,
    daysElapsed,
    totalPeriodDays,
    remainingRatio,
    elapsedRatio,
    registeredDate,
    expiryDate,
    renewalStartDate,
    renewalMarkerPercent: getRenewalMarkerPercent(
      totalPeriodDays,
      renewalReminderDays
    ),
  }
}

/** 만료 임박도(경과 비율)에 따른 배경 채움(그라데이션) 스타일 */
export function getDomainExpiryFillStyle(
  elapsedRatio: number
): DomainExpiryFillStyle {
  const urgency = clamp01(elapsedRatio)
  const widthPercent = Math.round(urgency * 100)

  const startMix = Math.round(10 + urgency * 22)
  const endMix = Math.round(14 + urgency * 28)

  const startColor =
    urgency < 0.65
      ? `color-mix(in oklch, var(--primary) ${startMix}%, transparent)`
      : urgency < 0.9
        ? `color-mix(in oklch, var(--secondary) ${startMix + 4}%, transparent)`
        : `color-mix(in oklch, var(--destructive) ${startMix + 6}%, transparent)`

  const endColor =
    urgency < 0.5
      ? `color-mix(in oklch, var(--primary) ${endMix}%, transparent)`
      : urgency < 0.85
        ? `color-mix(in oklch, var(--secondary) ${endMix}%, transparent)`
        : `color-mix(in oklch, var(--destructive) ${endMix + 4}%, transparent)`

  const background = `linear-gradient(90deg, ${startColor}, ${endColor})`

  const borderClass =
    urgency >= 0.85
      ? 'border-destructive/40'
      : urgency >= 0.7
        ? 'border-secondary/50'
        : 'border-border/60'

  return { widthPercent, background, borderClass }
}

export function formatKoreanDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}
