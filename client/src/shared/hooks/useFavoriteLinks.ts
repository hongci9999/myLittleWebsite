import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'mlw-favorite-links'

function loadFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

function saveFavoriteIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

/**
 * 방문자별 즐겨찾기 링크 ID 관리 (localStorage)
 */
export function useFavoriteLinks() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadFavoriteIds())

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setFavoriteIds(loadFavoriteIds())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const toggleFavorite = useCallback((linkId: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(linkId)
        ? prev.filter((id) => id !== linkId)
        : [...prev, linkId]
      saveFavoriteIds(next)
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (linkId: string) => favoriteIds.includes(linkId),
    [favoriteIds]
  )

  return { favoriteIds, toggleFavorite, isFavorite }
}
