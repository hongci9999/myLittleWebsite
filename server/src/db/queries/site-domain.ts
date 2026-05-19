import { SITE_DOMAIN_DEFAULTS } from '../../config/site-domain-defaults.js'
import { supabase, getSupabaseWithAuth } from '../supabase.js'

export type SiteDomainSettingsRow = {
  registered_date: string
  expiry_date: string
  updated_at: string
}

export type SiteDomainSettingsDto = {
  registeredDate: string
  expiryDate: string
  renewalReminderDays: number
  source: 'database' | 'config'
  updatedAt?: string
}

function toDto(
  row: SiteDomainSettingsRow,
  source: 'database' | 'config'
): SiteDomainSettingsDto {
  return {
    registeredDate: row.registered_date,
    expiryDate: row.expiry_date,
    renewalReminderDays: SITE_DOMAIN_DEFAULTS.renewalReminderDays,
    source,
    updatedAt: row.updated_at,
  }
}

function defaultDto(): SiteDomainSettingsDto {
  return {
    registeredDate: SITE_DOMAIN_DEFAULTS.registeredDate,
    expiryDate: SITE_DOMAIN_DEFAULTS.expiryDate,
    renewalReminderDays: SITE_DOMAIN_DEFAULTS.renewalReminderDays,
    source: 'config',
  }
}

export async function getSiteDomainSettings(): Promise<SiteDomainSettingsDto> {
  const client = supabase.client
  if (!client) return defaultDto()

  const { data, error } = await client
    .from('site_domain_settings')
    .select('registered_date, expiry_date, updated_at')
    .eq('id', 1)
    .maybeSingle()

  if (error) throw error
  if (!data) return defaultDto()
  return toDto(data as SiteDomainSettingsRow, 'database')
}

function parseIsoDate(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}

function formatIsoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function addCalendarDays(iso: string, days: number): string {
  const { y, m, d } = parseIsoDate(iso)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return formatIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

function diffCalendarDays(later: string, earlier: string): number {
  const a = parseIsoDate(later)
  const b = parseIsoDate(earlier)
  const msPerDay = 24 * 60 * 60 * 1000
  const t1 = new Date(a.y, a.m - 1, a.d).getTime()
  const t2 = new Date(b.y, b.m - 1, b.d).getTime()
  return Math.round((t1 - t2) / msPerDay)
}

function todayIsoDate(): string {
  const now = new Date()
  return formatIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

/** 오늘을 등록일로, 기존 등록~만료 기간만큼 만료일 연장 */
export async function renewSiteDomainSettings(
  token: string
): Promise<SiteDomainSettingsDto> {
  const client = getSupabaseWithAuth(token)
  if (!client) throw new Error('Supabase not configured')

  const current = await getSiteDomainSettings()
  const periodDays = Math.max(
    1,
    diffCalendarDays(current.expiryDate, current.registeredDate)
  )
  const registeredDate = todayIsoDate()
  const expiryDate = addCalendarDays(registeredDate, periodDays)

  const { data, error } = await client
    .from('site_domain_settings')
    .upsert(
      {
        id: 1,
        registered_date: registeredDate,
        expiry_date: expiryDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select('registered_date, expiry_date, updated_at')
    .single()

  if (error) throw error
  return toDto(data as SiteDomainSettingsRow, 'database')
}
