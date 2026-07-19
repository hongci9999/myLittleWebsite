/** DB 미설정·행 없음 시 API 폴백 (client shared/config/site-domain.ts 와 동기화) */
export const SITE_DOMAIN_DEFAULTS = {
  // 등록일=만료 1년 전으로 두어 등록~만료 기간을 365일로 유지 → 연장 반영 시 +1년.
  registeredDate: '2026-08-16',
  expiryDate: '2027-08-16',
  renewalReminderDays: 30,
} as const
