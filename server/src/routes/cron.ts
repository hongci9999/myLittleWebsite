import { Router } from 'express'
import { getSupabaseAdmin } from '../db/supabase.js'
import { syncSources } from '../services/knowledge/sync.js'

const router = Router()

/**
 * GET /api/cron/sources — Vercel cron(하루 1회)이 호출. 빠진 원문 수집 + 조각 색인 (ADR 0033).
 * Vercel이 `Authorization: Bearer $CRON_SECRET`을 붙여 보낸다 — 외부 호출로 Gemini 비용을 쓰지 않게 막는다.
 */
router.get('/sources', async (req, res) => {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  const db = getSupabaseAdmin()
  if (!db) {
    res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' })
    return
  }
  try {
    // 함수 한도 300초 — 240초 지나면 남은 건 다음 날로
    const result = await syncSources(db, { allowAiDigest: true, deadline: Date.now() + 240_000 })
    console.log('[cron] sources', JSON.stringify(result))
    res.json(result)
  } catch (err) {
    console.error('[cron] sources', err)
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

export default router
