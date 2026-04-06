const API_BASE = '/api/geeknews'

export type GeekNewsItem = {
  title: string
  url: string
  publishedAt: string
  source: 'geeknews'
}

export async function fetchGeekNewsLatest(limit = 5): Promise<GeekNewsItem[]> {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  const res = await fetch(`${API_BASE}/latest?${params.toString()}`)
  if (!res.ok) return []
  const data = await res.json()
  return data as GeekNewsItem[]
}
