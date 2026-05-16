import { parseYoutubeVideoId, youtubeNocookieEmbedSrc } from '@/shared/lib/youtube'

type Props = {
  label: string
  url: string
}

/** 추가 링크 항목: YouTube면 본문에 임베드 + 같은 URL로 텍스트 링크 */
export function ExtraLinkWithEmbed({ label, url }: Props) {
  const ytId = parseYoutubeVideoId(url)
  const iframeTitle = label.trim() || 'YouTube 동영상'

  return (
    <div className="space-y-2">
      {ytId ? (
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-border/60 bg-muted/30 shadow-sm">
          <iframe
            title={iframeTitle}
            src={youtubeNocookieEmbedSrc(ytId)}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : null}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {label}
      </a>
    </div>
  )
}
