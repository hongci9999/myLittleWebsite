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

export const supabase = {
  get client() {
    return getSupabase()
  },
}
