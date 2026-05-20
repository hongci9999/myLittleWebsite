import './env.js'
import express from 'express'
import cors from 'cors'
import learningRoutes from './routes/learning.js'
import authRoutes from './routes/auth.js'
import linksRoutes from './routes/links.js'
import aiScrapsRoutes from './routes/ai-scraps.js'
import columnScrapsRoutes from './routes/column-scraps.js'
import aiSmokeRoutes from './routes/ai-smoke.js'
import geekNewsRoutes from './routes/geeknews.js'
import tarotRoutes from './routes/tarot.js'
import siteDomainRoutes from './routes/site-domain.js'
import {
  createGeminiTextProvider,
  getAiProviderOptionsMeta,
} from './services/ai/index.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001
/** 로컬: `127.0.0.1`(기본). AWS·컨테이너 등 외부 접속 시 `LISTEN_HOST=0.0.0.0` */
const LISTEN_HOST = process.env.LISTEN_HOST ?? '127.0.0.1'

function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

const allowedOrigins = parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS)

app.use(express.json())
app.use(
  cors({
    origin(origin, cb) {
      // 서버-서버/헬스체크/같은 출처 요청(Origin 없음)은 그대로 허용
      if (!origin) return cb(null, true)
      if (allowedOrigins.length === 0) return cb(null, true)
      if (allowedOrigins.includes(origin)) return cb(null, true)
      return cb(new Error(`CORS blocked origin: ${origin}`))
    },
    allowedHeaders: ['Content-Type', 'Authorization', 'X-AI-Provider'],
  })
)

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

/** Vite 프록시(`/api`)로만 접근하는 헬스 (브라우저에서 사이트↔API 확인용) */
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

/** 공개 설정 요약. `ai` → 헤더 전광판(AiStatusTicker) 표시 문자열의 출처 */
app.get('/api/meta', (_, res) => {
  const gemini = createGeminiTextProvider()
  res.json({
    ai: getAiProviderOptionsMeta(),
    features: {
      columnScrapGeminiYoutube:
        typeof gemini.completeWithYoutubeUrl === 'function',
    },
  })
})

app.use('/api/ai-smoke', aiSmokeRoutes)

app.use('/api/auth', authRoutes)
app.use('/api/links', linksRoutes)
app.use('/api/geeknews', geekNewsRoutes)
app.use('/api/ai-scraps', aiScrapsRoutes)
app.use('/api/column-scraps', columnScrapsRoutes)
app.use('/api/learning', learningRoutes)
app.use('/api/tarot', tarotRoutes)
app.use('/api/site-domain', siteDomainRoutes)

app.listen(PORT, LISTEN_HOST, () => {
  console.log(`Server listening on http://${LISTEN_HOST}:${PORT}`)
})
