import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY

let _client: SupabaseClient | null = null

function getSupabase(): SupabaseClient | null {
  if (_client) return _client
  if (!url || !key) {
    console.warn(
      '[db] SUPABASE_URL 또는 SUPABASE_ANON_KEY가 설정되지 않았습니다. server/.env를 확인하세요.'
    )
    return null
  }
  _client = createClient(url, key)
  return _client
}

/** 인증된 사용자 JWT로 Supabase 클라이언트 (RLS write용) */
export function getSupabaseWithAuth(token: string): SupabaseClient | null {
  if (!url || !key) return null
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

/** service_role — RLS 무시. 로그인 없이 도는 cron 전용, 클라이언트로 절대 내보내지 않는다 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  return url && service ? createClient(url, service) : null
}

export const supabase = {
  get client() {
    return getSupabase()
  },
}
