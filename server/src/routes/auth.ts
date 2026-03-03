import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY
const supabase = url && key ? createClient(url, key) : null

/** POST /api/auth/login - 이메일/비밀번호로 로그인, JWT 반환 */
router.post('/login', async (req, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Auth not configured' })
    return
  }
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' })
    return
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) {
    res.status(401).json({ error: error.message })
    return
  }
  if (!data.session) {
    res.status(401).json({ error: 'Login failed' })
    return
  }
  res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  })
})

/** POST /api/auth/refresh - refresh_token으로 access_token 갱신 */
router.post('/refresh', async (req, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Auth not configured' })
    return
  }
  const { refresh_token } = req.body as { refresh_token?: string }
  if (!refresh_token) {
    res.status(400).json({ error: 'refresh_token is required' })
    return
  }
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token,
  })
  if (error) {
    res.status(401).json({ error: error.message })
    return
  }
  if (!data.session) {
    res.status(401).json({ error: 'Refresh failed' })
    return
  }
  res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  })
})

/** GET /api/auth/me - 세션 검증. Authorization: Bearer <jwt> 필요 */
router.get('/me', requireAuth, (req, res) => {
  const { user } = req as AuthenticatedRequest
  res.json({ user: { id: user.id } })
})

export default router
