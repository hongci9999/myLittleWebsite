import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFavoriteLinks } from '@/shared/hooks/useFavoriteLinks'
import { fetchLinks, type LinkWithValues } from '@/shared/api/links'
import { BentoCard } from '@/shared/ui/BentoCard'

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
  const { favoriteIds } = useFavoriteLinks()
  const [links, setLinks] = useState<LinkWithValues[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLinks().then(setLinks).finally(() => setLoading(false))
  }, [])

  const favoriteLinks = favoriteIds
    .map((id) => links.find((l) => l.id === id))
    .filter((l): l is LinkWithValues => l != null)

  return (
    <BentoCard>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        즐겨찾기 링크
      </h2>
      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">로딩 중...</p>
      ) : favoriteLinks.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          즐겨찾기 링크 없습니다
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {favoriteLinks.map((link) => (
            <li key={link.id}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-lg py-2 no-underline transition-colors hover:bg-muted/50"
              >
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
      {favoriteLinks.length > 0 && (
        <Link
          to="/links"
          className="mt-4 inline-block text-sm text-primary no-underline hover:underline"
        >
          유용한 링크에서 더 보기 →
        </Link>
      )}
    </BentoCard>
  )
}
