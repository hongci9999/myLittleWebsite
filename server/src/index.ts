import express from 'express'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(express.json())

// 헬스 체크
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'myLittleWebsite API' })
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
