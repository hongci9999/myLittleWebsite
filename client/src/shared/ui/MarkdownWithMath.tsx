import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'
import { parseYoutubeVideoId, youtubeNocookieEmbedSrc } from '@/shared/lib/youtube'
import { MermaidDiagram } from '@/shared/ui/MermaidDiagram'
import { slugifyMarkdownHeading } from '@/shared/lib/markdown-headings'

const CHANGELOG_CATEGORY_STYLES: Record<string, string> = {
  added: 'bg-primary/10 text-primary',
  changed: 'bg-secondary/15 text-secondary',
  fixed: 'bg-accent/50 text-accent-foreground',
  removed: 'bg-muted text-muted-foreground',
  deprecated: 'bg-muted/80 text-muted-foreground',
  security: 'bg-destructive/10 text-destructive',
}

interface Props {
  children: string
  className?: string
  /** true면 h2/h3에 id를 부여해 목차·앵커 링크에 사용 */
  headingIds?: boolean
  /** 패치노트용: 월(h2)·카테고리(h3) 뱃지 스타일 */
  changelogHeadings?: boolean
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
function MarkdownHeading({
  as: Tag,
  children,
  className,
  node: _node,
  ...rest
}: {
  as: 'h2' | 'h3'
  children?: ReactNode
  className?: string
  node?: unknown
}) {
  const text = String(children ?? '')
  const id = slugifyMarkdownHeading(text) || undefined
  return (
    <Tag id={id} className={className} {...rest}>
      {children}
    </Tag>
  )
}

function ChangelogMonthHeading({
  children,
  className,
  node: _node,
  ...rest
}: {
  children?: ReactNode
  className?: string
  node?: unknown
}) {
  const text = String(children ?? '')
  const id = slugifyMarkdownHeading(text) || undefined
  return (
    <h2
      id={id}
      className={cn('changelog-month not-prose', className)}
      {...rest}
    >
      {children}
    </h2>
  )
}

function ChangelogCategoryHeading({
  children,
  className,
  node: _node,
  ...rest
}: {
  children?: ReactNode
  className?: string
  node?: unknown
}) {
  const text = String(children ?? '').trim()
  const key = text.toLowerCase()
  const id = slugifyMarkdownHeading(text) || undefined
  const categoryStyle = CHANGELOG_CATEGORY_STYLES[key]

  return (
    <h3
      id={id}
      className={cn(
        'changelog-category not-prose',
        categoryStyle,
        className
      )}
      {...rest}
    >
      {children}
    </h3>
  )
}

export function MarkdownWithMath({
  children,
  className,
  headingIds = false,
  changelogHeadings = false,
}: Props) {
  const useHeadingIds = headingIds || changelogHeadings

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: MarkdownAnchor,
          ...(changelogHeadings
            ? {
                h2: (props) => <ChangelogMonthHeading {...props} />,
                h3: (props) => <ChangelogCategoryHeading {...props} />,
              }
            : useHeadingIds
              ? {
                  h2: (props) => <MarkdownHeading as="h2" {...props} />,
                  h3: (props) => <MarkdownHeading as="h3" {...props} />,
                }
              : {}),
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
