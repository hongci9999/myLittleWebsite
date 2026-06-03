import { useEffect, useRef } from 'react'

function storageKey(pageKey: string) {
  return `list-page-scroll:${pageKey}`
}

/** 목록 페이지 이탈 시 스크롤 저장, 재진입(뒤로가기 등) 시 복원 */
export function useListPageScrollRestore(pageKey: string, ready: boolean) {
  const didRestore = useRef(false)

  useEffect(() => {
    return () => {
      sessionStorage.setItem(storageKey(pageKey), String(window.scrollY))
    }
  }, [pageKey])

  useEffect(() => {
    if (!ready || didRestore.current) return
    didRestore.current = true
    const raw = sessionStorage.getItem(storageKey(pageKey))
    if (raw == null) return
    const y = Number(raw)
    if (!Number.isFinite(y) || y <= 0) return
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, left: 0, behavior: 'auto' })
    })
  }, [pageKey, ready])
}
