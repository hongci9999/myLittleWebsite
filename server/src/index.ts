import app from './app.js'

const PORT = Number(process.env.PORT) || 3001
/** 로컬: `127.0.0.1`(기본). AWS·컨테이너 등 외부 접속 시 `LISTEN_HOST=0.0.0.0` */
const LISTEN_HOST = process.env.LISTEN_HOST ?? '127.0.0.1'

app.listen(PORT, LISTEN_HOST, () => {
  console.log(`Server listening on http://${LISTEN_HOST}:${PORT}`)
})
