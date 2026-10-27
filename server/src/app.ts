import './env.js'
import express from 'express'
import cors from 'cors'
import learningRoutes from './routes/learning.js'
import authRoutes from './routes/auth.js'
import linksRoutes from './routes/links.js'
import aiScrapsRoutes from './routes/ai-scraps.js'
import gameDevResourcesRoutes from './routes/game-dev-resources.js'
import columnScrapsRoutes from './routes/column-scraps.js'
import aiSmokeRoutes from './routes/ai-smoke.js'
import geekNewsRoutes from './routes/geeknews.js'
import d2HelloWorldRoutes from './routes/d2-helloworld.js'
import techInterviewRoutes from './routes/tech-interview.js'
import tarotRoutes from './routes/tarot.js'
import siteDomainRoutes from './routes/site-domain.js'
import mcpRoutes from './routes/mcp.js'
import quickSaveRoutes from './routes/quick-save.js'
import chatRoutes from './routes/chat.js'
import bootcampRoutes from './routes/bootcamp.js'
import cronRoutes from './routes/cron.js'
import {
  resolveGeminiTextModel,
  resolveGeminiYoutubeModel,
} from './services/ai/providers/gemini-text-provider.js'

function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

const allowedOrigins = parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS)

const app = express()

app.use(express.json({ limit: '2mb' }))
app.use(
  cors({
    origin(origin, cb) {
      // 서버-서버/헬스체크/같은 출처 요청(Origin 없음)은 그대로 허용
      if (!origin) return cb(null, true)
      if (allowedOrigins.length === 0) return cb(null, true)
      if (allowedOrigins.includes(origin)) return cb(null, true)
      return cb(new Error(`CORS blocked origin: ${origin}`))
    },
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

/** Vite 프록시(`/api`)로만 접근하는 헬스 (브라우저에서 사이트↔API 확인용) */
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

/** 공개 설정 요약. `ai` → 헤더 모델 배지(AiModelBadge) */
app.get('/api/meta', (_, res) => {
  res.json({
    ai: {
      model: resolveGeminiTextModel(),
      youtubeModel: resolveGeminiYoutubeModel(),
      keyConfigured: Boolean((process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY)?.trim()),
    },
    features: {
      columnScrapYoutubeTranscript: true,
    },
  })
})

app.use('/api/ai-smoke', aiSmokeRoutes)

app.use('/api/auth', authRoutes)
app.use('/api/links', linksRoutes)
app.use('/api/bootcamp', bootcampRoutes)
app.use('/api/geeknews', geekNewsRoutes)
app.use('/api/d2-helloworld', d2HelloWorldRoutes)
app.use('/api/tech-interview', techInterviewRoutes)
app.use('/api/ai-scraps', aiScrapsRoutes)
app.use('/api/game-dev-resources', gameDevResourcesRoutes)
app.use('/api/column-scraps', columnScrapsRoutes)
app.use('/api/learning', learningRoutes)
app.use('/api/tarot', tarotRoutes)
app.use('/api/site-domain', siteDomainRoutes)
app.use('/api/mcp', mcpRoutes)
app.use('/api/quick-save', quickSaveRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/cron', cronRoutes)

export default app
