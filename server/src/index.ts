import './env.js'
import express from 'express'
import learningRoutes from './routes/learning.js'
import authRoutes from './routes/auth.js'
import linksRoutes from './routes/links.js'
import aiScrapsRoutes from './routes/ai-scraps.js'
import columnScrapsRoutes from './routes/column-scraps.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/links', linksRoutes)
app.use('/api/ai-scraps', aiScrapsRoutes)
app.use('/api/column-scraps', columnScrapsRoutes)
app.use('/api/learning', learningRoutes)

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
