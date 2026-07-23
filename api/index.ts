/**
 * Vercel 서버리스 함수 진입점.
 * Express 앱을 지연(dynamic) import 해 핸들러로 넘긴다. 정적 import는 로드 시점 예외를
 * 잡을 수 없어, 초기화 실패 시 원인 파악이 어렵다. 여기서는 초기화 예외를 응답(JSON)으로
 * 노출해 진단을 쉽게 한다. (안정화 후 stack 노출은 제거 가능)
 */
import type { IncomingMessage, ServerResponse } from 'node:http'

type ExpressLike = (req: IncomingMessage, res: ServerResponse) => void

let appPromise: Promise<ExpressLike> | null = null

async function loadApp(): Promise<ExpressLike> {
  if (!appPromise) {
    appPromise = import('../server/src/app.js').then(
      (m) => m.default as unknown as ExpressLike
    )
  }
  return appPromise
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    const app = await loadApp()
    app(req, res)
  } catch (err) {
    appPromise = null
    res.statusCode = 500
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(
      JSON.stringify({
        error: 'API init failed',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      })
    )
  }
}
