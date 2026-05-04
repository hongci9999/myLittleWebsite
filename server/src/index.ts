import './env.js'
import express from 'express'
import learningRoutes from './routes/learning.js'
import authRoutes from './routes/auth.js'
import linksRoutes from './routes/links.js'
import aiScrapsRoutes from './routes/ai-scraps.js'
import columnScrapsRoutes from './routes/column-scraps.js'
import aiSmokeRoutes from './routes/ai-smoke.js'
import geekNewsRoutes from './routes/geeknews.js'
import tarotRoutes from './routes/tarot.js'
import { getAiProviderOptionsMeta } from './services/ai/index.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001
/** 로컬: `127.0.0.1`(기본). AWS·컨테이너 등 외부 접속 시 `LISTEN_HOST=0.0.0.0` */
const LISTEN_HOST = process.env.LISTEN_HOST ?? '127.0.0.1'

app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

/** Vite 프록시(`/api`)로만 접근하는 헬스 (브라우저에서 사이트↔API 확인용) */
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

/** 공개 설정 요약. `ai` → 헤더 전광판(AiStatusTicker) 표시 문자열의 출처 */
app.get('/api/meta', (_, res) => {
  res.json({ ai: getAiProviderOptionsMeta() })
})

app.use('/api/ai-smoke', aiSmokeRoutes)

app.use('/api/auth', authRoutes)
app.use('/api/links', linksRoutes)
app.use('/api/geeknews', geekNewsRoutes)
app.use('/api/ai-scraps', aiScrapsRoutes)
app.use('/api/column-scraps', columnScrapsRoutes)
app.use('/api/learning', learningRoutes)
app.use('/api/tarot', tarotRoutes)

app.listen(PORT, LISTEN_HOST, () => {
  console.log(`Server listening on http://${LISTEN_HOST}:${PORT}`)
})
