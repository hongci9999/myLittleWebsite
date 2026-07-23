/**
 * Vercel 서버리스 함수 진입점.
 * Express 앱을 그대로 핸들러로 내보낸다. `/api/*` 요청이 vercel.json rewrite로 이 함수에 도달하며,
 * Express 라우터는 원본 경로(`/api/...`)를 그대로 매칭한다.
 */
import app from '../server/src/app.js'

export default app
