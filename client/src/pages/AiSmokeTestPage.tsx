import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

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
 * 사이트(API 프록시)와 로컬 Ollama 연동을 한 화면에서 확인 (개발·점검용).
 */
export default function AiSmokeTestPage() {
  const [running, setRunning] = useState(false)
  const [blocks, setBlocks] = useState<FetchBlock[] | null>(null)

  const run = useCallback(async () => {
    setRunning(true)
    setBlocks(null)
    try {
      const [health, meta, local] = await Promise.all([
        fetchJsonBlock('백엔드 API', '/api/health'),
        fetchJsonBlock('공개 메타 (/api/meta)', '/api/meta'),
        fetchJsonBlock('로컬 Ollama 스모크', '/api/ai-smoke/local'),
      ])
      setBlocks([health, meta, local])
    } finally {
      setRunning(false)
    }
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">연결 테스트</h1>
        <p className="mt-2 text-muted-foreground">
          브라우저 → Express(`/api` 프록시) → 필요 시 Ollama까지 응답이 오는지
          확인합니다. 서버와 Ollama를 켠 뒤 아래 버튼을 누르세요.
        </p>
        <Button className="mt-4" onClick={run} disabled={running}>
          {running ? '확인 중…' : '테스트 실행'}
        </Button>
      </div>

      {blocks && (
        <div className="grid gap-4 md:grid-cols-1">
          {blocks.map((b) => (
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
