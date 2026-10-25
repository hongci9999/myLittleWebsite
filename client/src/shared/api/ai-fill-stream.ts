/** 서버 `progressStream` 이벤트. t = 요청 시작 후 ms */
export type AiProgressEvent = { t: number; msg?: string; beat?: boolean }

/**
 * AI 채우기 POST — NDJSON 스트림으로 진행 단계·heartbeat를 받고 마지막 줄의 결과를 돌려준다.
 * 서버가 스트림이 아닌 JSON으로 답하면(검증 400·인증 401 등) 그대로 처리.
 */
export async function postAiFill(
  url: string,
  token: string,
  body: object,
  onProgress?: (e: AiProgressEvent) => void
): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/x-ndjson',
    },
    body: JSON.stringify(body),
  })

  if (!res.body || !res.headers.get('content-type')?.includes('ndjson')) {
    const j = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) throw new Error(String(j.error || 'AI 채우기 실패'))
    return j
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buf = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += value
    let i: number
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim()
      buf = buf.slice(i + 1)
      if (!line) continue
      const e = JSON.parse(line) as AiProgressEvent & {
        done?: boolean
        status?: number
        body?: Record<string, unknown>
      }
      if (e.done) {
        if ((e.status ?? 200) >= 400) throw new Error(String(e.body?.error || 'AI 채우기 실패'))
        return e.body ?? {}
      }
      onProgress?.(e)
    }
  }
  throw new Error('응답이 중간에 끊겼습니다 (서버 실행 시간 초과 가능성)')
}
