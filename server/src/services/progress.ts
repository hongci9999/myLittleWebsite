import { AsyncLocalStorage } from 'node:async_hooks'
import type { NextFunction, Request, Response } from 'express'

/**
 * AI 채우기 진행 상황 — 깊은 호출(자막 fetch·Gemini 요청)에서 인자 전달 없이 단계를 알린다.
 * 스트림 요청이 아니면 store가 없어 아무 일도 안 한다.
 */
const store = new AsyncLocalStorage<(msg: string) => void>()

export function reportProgress(msg: string): void {
  store.getStore()?.(msg)
}

/**
 * `Accept: application/x-ndjson` 요청이면 응답을 NDJSON 스트림으로 바꾼다.
 * - `{ t, msg }` 진행 단계, `{ t, beat: true }` 3초 heartbeat(연결·서버 살아 있음 확인용)
 * - 마지막 줄 `{ t, done: true, status, body }` — 핸들러의 res.status().json()을 그대로 옮김
 * 핸들러는 수정 없이 그대로 쓴다. (t = 요청 시작 후 ms)
 */
export function progressStream(req: Request, res: Response, next: NextFunction): void {
  if (!String(req.headers.accept ?? '').includes('application/x-ndjson')) return next()

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const started = Date.now()
  const write = (o: object) => {
    if (!res.writableEnded) res.write(JSON.stringify({ t: Date.now() - started, ...o }) + '\n')
  }
  const beat = setInterval(() => write({ beat: true }), 3000)
  res.on('close', () => clearInterval(beat))

  let status = 200
  res.status = ((code: number) => {
    status = code
    return res
  }) as Response['status']
  res.json = ((body: unknown) => {
    clearInterval(beat)
    write({ done: true, status, body })
    res.end()
    return res
  }) as Response['json']

  store.run((msg) => write({ msg }), next)
}
