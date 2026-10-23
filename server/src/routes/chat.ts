import { createHash } from 'crypto'
import { Router } from 'express'
import { getAuthUserId } from '../middleware/auth.js'
import { supabase } from '../db/supabase.js'
import { chat, type ChatMessage } from '../services/chat.js'

const DAILY_LIMIT = 10

const router = Router()

/** POST /api/chat `{ messages: {role, text}[] }` → `{ text }`. 로그인 무제한, 비로그인 IP별 하루 10회 */
router.post('/', async (req, res) => {
  const raw = (req.body as { messages?: unknown }).messages
  const messages: ChatMessage[] = (Array.isArray(raw) ? raw : [])
    .filter((m): m is ChatMessage => (m?.role === 'user' || m?.role === 'model') && typeof m?.text === 'string')
    .slice(-20)
    .map((m) => ({ role: m.role, text: m.text.slice(0, 2000) }))
  if (messages.at(-1)?.role !== 'user') {
    res.status(400).json({ error: 'messages must end with a user message' })
    return
  }

  if (!(await getAuthUserId(req.headers.authorization))) {
    const ip = String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '').split(',')[0].trim()
    const ipHash = createHash('sha256').update(ip).digest('hex')
    const { data: ok, error } = (await supabase.client?.rpc('chat_hit', { p_ip_hash: ipHash, p_limit: DAILY_LIMIT })) ?? {}
    if (error || ok === undefined) {
      res.status(503).json({ error: '사용량 확인에 실패했어요.' })
      return
    }
    if (!ok) {
      res.status(429).json({ error: `오늘 질문 ${DAILY_LIMIT}회를 다 썼어요. 내일 다시 와 주세요.` })
      return
    }
  }

  try {
    res.json({ text: await chat(messages) })
  } catch (err) {
    console.error('[chat]', err)
    res.status(502).json({ error: '답변 생성에 실패했어요.' })
  }
})

export default router
