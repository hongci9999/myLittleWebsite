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

function FavoriteLinksSkeleton() {
  return (
    <div className="mt-3 space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-9 animate-pulse rounded-lg bg-muted/40"
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export default function FavoriteLinksWidget() {
  const [featuredLinks, setFeaturedLinks] = useState<LinkWithValues[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedLinks().then(setFeaturedLinks).finally(() => setLoading(false))
  }, [])

  return (
    <BentoCard className="h-full p-3 sm:p-4">
      <h2 className="text-sm font-medium tracking-tight text-muted-foreground">
        즐겨찾기 링크
      </h2>
      {loading ? (
        <FavoriteLinksSkeleton />
      ) : featuredLinks.length === 0 ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          즐겨찾기 링크가 없습니다
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {featuredLinks.map((link) => (
            <li key={link.id}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-lg px-1.5 py-2 no-underline transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <LinkSiteIcon
                  faviconUrl={link.faviconUrl}
                  className="size-4 opacity-90 group-hover:opacity-100"
                />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
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
          className="mt-2 inline-block text-sm text-primary no-underline transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          유용한 링크에서 더 보기 →
        </Link>
      )}
    </BentoCard>
  )
}
