import './env.js'
import express from 'express'
import learningRoutes from './routes/learning.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/learning', learningRoutes)

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
