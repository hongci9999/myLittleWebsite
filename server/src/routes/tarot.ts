import { Router } from 'express'
import { normalizeTarotCards, suggestTarotReading } from '../services/ai/index.js'

const router = Router()

router.post('/reading', async (req, res) => {
  try {
    const cards = normalizeTarotCards((req.body as { cards?: unknown })?.cards)
    if (!cards) {
      res.status(400).json({
        error: 'cards[3] with slot(past|present|advice), majorId, orientation(upright|reversed) is required',
      })
      return
    }
    const result = await suggestTarotReading(cards)
    res.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to read tarot'
    if (msg.includes('GEMINI_API_KEY') || msg.includes('GOOGLE_AI_API_KEY')) {
      res.status(503).json({
        error: '서버에 GEMINI_API_KEY(또는 GOOGLE_AI_API_KEY)가 필요합니다.',
      })
      return
    }
    res.status(500).json({ error: msg })
  }
})

export default router
