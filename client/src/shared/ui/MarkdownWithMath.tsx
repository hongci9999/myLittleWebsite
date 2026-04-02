import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'
import { parseYoutubeVideoId, youtubeNocookieEmbedSrc } from '@/shared/lib/youtube'
import { MermaidDiagram } from '@/shared/ui/MermaidDiagram'

interface Props {
  children: string
  className?: string
}

function MarkdownAnchor(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown }
) {
  const { href, children, className, node: _node, ...rest } = props
  if (href) {
    const ytId = parseYoutubeVideoId(href)
    if (ytId) {
      return (
        <>
          <iframe
            title="YouTube 동영상"
            src={youtubeNocookieEmbedSrc(ytId)}
            loading="lazy"
            className="not-prose my-4 aspect-video w-full max-w-full rounded-xl border border-border/60 bg-muted/30 shadow-sm"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('text-primary underline-offset-4 hover:underline', className)}
          >
            {children}
          </a>
        </>
      )
    }
  }
  return (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  )
}

/**
 * Markdown 렌더러 — GFM(테이블 등) + LaTeX 수식($...$, $$...$$) + 본문 내 YouTube 링크 임베드
 */
export function MarkdownWithMath({ children, className }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: MarkdownAnchor,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className ?? '')
            const lang = match?.[1]?.toLowerCase()
            const text = String(children ?? '')

            if (lang === 'mermaid') {
              return <MermaidDiagram code={text} />
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
