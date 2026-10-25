import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { apiUrl } from '@/shared/api/base'
import { useAuth } from '@/shared/context/AuthContext'

type FetchBlock = {
  name: string
  url: string
  ok: boolean
  status: number
  body: unknown
}

async function fetchJsonBlock(
  name: string,
  url: string
): Promise<FetchBlock> {
  try {
    const res = await fetch(url)
    let body: unknown
    const ct = res.headers.get('content-type') ?? ''
    if (ct.includes('application/json')) {
      body = await res.json()
    } else {
      body = { raw: (await res.text()).slice(0, 2000) }
    }
    return { name, url, ok: res.ok, status: res.status, body }
  } catch (e) {
    return {
      name,
      url,
      ok: false,
      status: 0,
      body: { error: e instanceof Error ? e.message : String(e) },
    }
  }
}

/**
 * 사이트(API 프록시)·Gemini 연동을 한 화면에서 확인 (개발·점검용).
 */
export default function AiSmokeTestPage() {
  const [running, setRunning] = useState(false)
  const [blocks, setBlocks] = useState<FetchBlock[] | null>(null)
  const { token } = useAuth()
  const [ytUrl, setYtUrl] = useState('')
  const [ytRunning, setYtRunning] = useState(false)
  const [ytBlock, setYtBlock] = useState<FetchBlock | null>(null)

  /** 서버 자막 fetch 없이 Gemini가 YouTube URL을 직접 분석하는지 확인 (임시) */
  async function runGeminiYoutube(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setYtRunning(true)
    setYtBlock(null)
    const url = apiUrl('/api/ai-smoke/gemini-youtube')
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: ytUrl }),
      })
      const text = await res.text()
      let body: unknown
      try {
        body = JSON.parse(text)
      } catch {
        body = { raw: text.slice(0, 2000) }
      }
      const ok = res.ok && (body as { ok?: boolean })?.ok === true
      setYtBlock({ name: 'Gemini YouTube 직접 분석', url, ok, status: res.status, body })
    } catch (err) {
      setYtBlock({
        name: 'Gemini YouTube 직접 분석',
        url,
        ok: false,
        status: 0,
        body: { error: err instanceof Error ? err.message : String(err) },
      })
    } finally {
      setYtRunning(false)
    }
  }

  const run = useCallback(async () => {
    setRunning(true)
    setBlocks(null)
    try {
      const [health, meta] = await Promise.all([
        fetchJsonBlock('백엔드 API', apiUrl('/api/health')),
        fetchJsonBlock('공개 메타 (/api/meta)', apiUrl('/api/meta')),
      ])
      setBlocks([health, meta])
    } finally {
      setRunning(false)
    }
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">연결 테스트</h1>
        <p className="mt-2 text-muted-foreground">
          브라우저 → Express(`/api` 프록시) 응답이 오는지 확인합니다.
        </p>
        <Button className="mt-4" onClick={run} disabled={running}>
          {running ? '확인 중…' : '테스트 실행'}
        </Button>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold tracking-tight">Gemini YouTube 직접 분석</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          서버 자막 fetch 없이 Gemini가 영상 URL을 직접 분석하는지 확인합니다. (Gemini 비용 발생 · 로그인 필요)
        </p>
        {token ? (
          <form onSubmit={runGeminiYoutube} className="mt-3 flex gap-2">
            <input
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
              className="min-w-0 flex-1 rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
            />
            <Button type="submit" disabled={ytRunning}>
              {ytRunning ? '분석 중…' : '분석'}
            </Button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-destructive">로그인 후 사용할 수 있습니다.</p>
        )}
      </div>

      {(ytBlock || blocks) && (
        <div className="grid gap-4 md:grid-cols-1">
          {[...(ytBlock ? [ytBlock] : []), ...(blocks ?? [])].map((b) => (
            <Card
              key={b.name}
              className="border-border/60 shadow-sm"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{b.name}</CardTitle>
                <CardDescription className="font-mono text-xs">
                  {b.url} · HTTP {b.status || '—'}{' '}
                  <span
                    className={
                      b.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'
                    }
                  >
                    {b.ok ? '성공' : '실패'}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-64 overflow-auto rounded-lg border border-border/60 bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {JSON.stringify(b.body, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
