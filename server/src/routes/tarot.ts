import { Router } from 'express'
import {
  normalizeTarotCards,
  parseAiRequestPreference,
  suggestTarotReading,
} from '../services/ai/index.js'

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
    const pref = parseAiRequestPreference(req.headers, req.body)
    const result = await suggestTarotReading(cards, pref)
    res.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to read tarot'
    if (msg.includes('GEMINI_API_KEY') || msg.includes('GOOGLE_AI_API_KEY')) {
      res.status(503).json({
        error: 'API 모드에는 서버에 GEMINI_API_KEY(또는 GOOGLE_AI_API_KEY)가 필요합니다.',
      })
      return
    }
    if (msg.includes('Ollama') || msg.includes('fetch')) {
      res.status(503).json({
        error: '로컬 모드 사용 시 Ollama 실행 상태를 확인하세요.',
      })
      return
    }
    res.status(500).json({ error: msg })
  }
})

export default router
