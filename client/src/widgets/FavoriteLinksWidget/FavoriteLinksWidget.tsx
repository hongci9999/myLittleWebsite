import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchFeaturedLinks, type LinkWithValues } from '@/shared/api/links'
import { BentoCard } from '@/shared/ui/BentoCard'
import { LinkSiteIcon } from '@/shared/ui/LinkSiteIcon'

const ExternalLinkIcon = () => (
  <svg
    className="size-3.5 shrink-0 opacity-60"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
)

export default function FavoriteLinksWidget() {
  const [featuredLinks, setFeaturedLinks] = useState<LinkWithValues[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedLinks().then(setFeaturedLinks).finally(() => setLoading(false))
  }, [])

  return (
    <BentoCard className="p-4 sm:p-5">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        메인 추천 링크
      </h2>
      {loading ? (
        <p className="mt-2 text-sm text-muted-foreground">로딩 중...</p>
      ) : featuredLinks.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          메인 추천 링크 없습니다
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1.5">
          {featuredLinks.map((link) => (
            <li key={link.id}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-lg py-2 no-underline transition-colors hover:bg-muted/50"
              >
                <LinkSiteIcon
                  faviconUrl={link.faviconUrl}
                  className="size-4 opacity-90 group-hover:opacity-100"
                />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground group-hover:text-primary">
                  {link.title}
                </span>
                <span className="shrink-0 rounded p-1 opacity-70 group-hover:opacity-100">
                  <ExternalLinkIcon />
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {featuredLinks.length > 0 && (
        <Link
          to="/links"
          className="mt-3 inline-block text-sm text-primary no-underline hover:underline"
        >
          유용한 링크에서 더 보기 →
        </Link>
      )}
    </BentoCard>
  )
}
