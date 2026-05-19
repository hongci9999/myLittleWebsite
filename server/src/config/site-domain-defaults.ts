/** DB 미설정·행 없음 시 API 폴백 (client shared/config/site-domain.ts 와 동기화) */
export const SITE_DOMAIN_DEFAULTS = {
  registeredDate: '2026-05-16',
  expiryDate: '2026-08-16',
  renewalReminderDays: 30,
} as const
