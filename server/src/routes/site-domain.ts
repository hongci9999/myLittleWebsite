import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import {
  getSiteDomainSettings,
  renewSiteDomainSettings,
} from '../db/queries/site-domain.js'

const router = Router()

/** GET /api/site-domain — 등록·만료일 (공개) */
router.get('/', async (_, res) => {
  try {
    const settings = await getSiteDomainSettings()
    res.json(settings)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch site domain settings'
    if (msg === 'Supabase not configured') {
      res.status(503).json({
        error: 'Database not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env',
      })
      return
    }
    console.error('[site-domain] get error:', err)
    res.status(500).json({ error: 'Failed to fetch site domain settings' })
  }
})

/** POST /api/site-domain/renew — 오늘 연장 반영 (관리자) */
router.post('/renew', requireAuth, async (req, res) => {
  const { authToken } = req as AuthenticatedRequest
  if (!authToken) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const settings = await renewSiteDomainSettings(authToken)
    res.json(settings)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to renew site domain'
    if (msg === 'Supabase not configured') {
      res.status(503).json({
        error: 'Database not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env',
      })
      return
    }
    console.error('[site-domain] renew error:', err)
    res.status(500).json({ error: 'Failed to renew site domain' })
  }
})

export default router
