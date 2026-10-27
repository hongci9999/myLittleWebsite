/**
 * 원문 수집 + 조각 색인 (ADR 0033) — Vercel cron(`/api/cron/sources`)과 같은 syncSources를 로컬에서 돌린다.
 * 로컬에선 유튜브 자막을 받을 수 있어서, cron이 자막 대신 저장한 Gemini 영상 요약(digest)을 진짜 자막으로 바꾼다.
 * 평소엔 cron이 매일 처리하므로 꼭 돌릴 필요는 없다 — 링크 대량 등록 직후나 자막 품질을 올리고 싶을 때.
 *
 *   npm run backfill-sources -w server
 *
 * 로그인: server/.env 의 BULK_EMAIL / BULK_PASSWORD
 */
import '../src/env.js'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseWithAuth } from '../src/db/supabase.js'
import { syncSources } from '../src/services/knowledge/sync.js'

async function login(): Promise<string> {
  const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
  const { data, error } = await client.auth.signInWithPassword({
    email: process.env.BULK_EMAIL!,
    password: process.env.BULK_PASSWORD!,
  })
  if (error || !data.session) throw new Error('로그인 실패: ' + (error?.message ?? 'no session'))
  return data.session.access_token
}

;(async () => {
  const t0 = Date.now()
  const result = await syncSources(getSupabaseWithAuth(await login())!, { allowAiDigest: false })
  console.log(`완료 ${Math.round((Date.now() - t0) / 1000)}초`, result)
})().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
