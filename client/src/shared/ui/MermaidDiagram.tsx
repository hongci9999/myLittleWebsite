import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  code: string
  className?: string
}

export function MermaidDiagram({ code, className }: Props) {
  const id = useMemo(
    () => `mermaid-${Math.random().toString(36).slice(2)}-${Date.now()}`,
    []
  )
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'strict',
        })

        const { svg } = await mermaid.render(id, code.trim())
        if (!cancelled) setSvg(svg)
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        if (!cancelled) setError(message)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [code, id])

  if (error) {
    return (
      <pre
        className={cn(
          'not-prose my-4 overflow-auto rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-destructive',
          className
        )}
      >
        {error}
      </pre>
    )
  }

  if (!svg) {
    return (
      <div
        className={cn(
          'not-prose my-4 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground',
          className
        )}
      >
        다이어그램 로딩 중...
      </div>
    )
  }

  return (
    <div
      className={cn(
        'not-prose my-4 overflow-auto rounded-xl border border-border/60 bg-card/30 p-3 shadow-sm',
        className
      )}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

