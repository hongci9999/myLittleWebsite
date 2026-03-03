import type { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY
const supabase = url && key ? createClient(url, key) : null

export type AuthenticatedRequest = Request & {
  user: { id: string }
  authToken: string
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!supabase) {
    res.status(503).json({ error: 'Auth not configured' })
    return
  }
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)
  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }
  ;(req as AuthenticatedRequest).user = { id: user.id }
  ;(req as AuthenticatedRequest).authToken = token
  next()
}
