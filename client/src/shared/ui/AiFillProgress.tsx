import { useEffect, useState } from 'react'
import type { AiProgressEvent } from '@/shared/api/ai-fill-stream'

/** 이 시간 넘게 heartbeat(3초 간격)도 없으면 연결·버퍼링 문제로 본다 */
const STALL_MS = 10_000

type Step = { t: number; msg: string }

/**
 * AI 채우기 진행 표시. `start()` → 요청에 `onProgress` 전달 → `stop()`.
 * 단계 로그 + 경과 시간 + 마지막 서버 신호 — 신호가 끊기면 「진짜 진행 중」인지 아닌지 구분된다.
 */
export function useAiFillProgress() {
  const [steps, setSteps] = useState<Step[]>([])
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [endedAt, setEndedAt] = useState<number | null>(null)
  const [lastSignal, setLastSignal] = useState(0)
  const [streaming, setStreaming] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const running = startedAt != null && endedAt == null

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [running])

  return {
    start() {
      const t = Date.now()
      setSteps([])
      setStartedAt(t)
      setEndedAt(null)
      setLastSignal(t)
      setStreaming(false)
      setNow(t)
    },
    stop() {
      setEndedAt(Date.now())
    },
    onProgress(e: AiProgressEvent) {
      setLastSignal(Date.now())
      setStreaming(true)
      if (e.msg) setSteps((s) => [...s, { t: e.t, msg: e.msg! }])
    },
    panel:
      startedAt == null ? null : (
        <AiFillProgressPanel
          steps={steps}
          elapsed={(endedAt ?? now) - startedAt}
          silentFor={running ? now - lastSignal : 0}
          running={running}
          streaming={streaming}
        />
      ),
  }
}

function sec(ms: number): string {
  return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)}초`
}

function AiFillProgressPanel({
  steps,
  elapsed,
  silentFor,
  running,
  streaming,
}: {
  steps: Step[]
  elapsed: number
  silentFor: number
  running: boolean
  streaming: boolean
}) {
  const stalled = running && silentFor > STALL_MS
  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-[11px] text-muted-foreground"
    >
      <ol className="space-y-0.5 font-mono">
        {steps.map((s, i) => (
          <li key={i} className={i === steps.length - 1 && running ? 'text-foreground' : undefined}>
            <span className="inline-block w-12 tabular-nums text-muted-foreground/70">+{sec(s.t)}</span>
            {s.msg}
            {i === steps.length - 1 && running ? ' …' : ''}
          </li>
        ))}
        {steps.length === 0 && running ? <li>서버 응답 기다리는 중 …</li> : null}
      </ol>
      <p className={`mt-1.5 border-t border-border/40 pt-1.5 tabular-nums ${stalled ? 'text-destructive' : ''}`}>
        {running ? '진행 중' : '끝'} · 경과 {sec(elapsed)}
        {running
          ? stalled
            ? ` · ${sec(silentFor)}째 서버 신호 없음 — ${streaming ? '연결 끊김 가능' : '스트림이 버퍼링되는 중일 수 있음'}`
            : streaming
              ? ` · 서버 살아 있음 (마지막 신호 ${sec(silentFor)} 전)`
              : ''
          : ''}
      </p>
    </div>
  )
}
