/**
 * 사이트 도메인(내도메인.한국) 만료·연장 알림용 설정.
 * 만료일 변경 시 이 파일만 수정하면 된다.
 */
export const SITE_DOMAIN = {
  hostname: 'mylittlewebsite.p-e.kr',
  registrarName: '내도메인.한국',
  registrarUrl: 'https://www.nadomdomain.co.kr/',
  /** 달력 기준 등록일 (YYYY-MM-DD, KST 날짜로 해석) */
  registeredDate: '2026-05-16',
  /** 달력 기준 만료일 (YYYY-MM-DD, KST 날짜로 해석) */
  expiryDate: '2026-08-16',
  /** 만료 N일 전부터 연장 권장 */
  renewalReminderDays: 30,
} as const
