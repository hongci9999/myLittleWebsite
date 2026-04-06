type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const valueCache = new Map<string, CacheEntry<unknown>>()
const inflightCache = new Map<string, Promise<unknown>>()

export function getCachedResource<T>(key: string): T | null {
  const hit = valueCache.get(key)
  if (!hit) return null
  if (hit.expiresAt <= Date.now()) {
    valueCache.delete(key)
    return null
  }
  return hit.value as T
}

export async function fetchWithResourceCache<T>(options: {
  key: string
  ttlMs: number
  fetcher: () => Promise<T>
}): Promise<T> {
  const { key, ttlMs, fetcher } = options
  const cached = getCachedResource<T>(key)
  if (cached !== null) return cached

  const inflight = inflightCache.get(key) as Promise<T> | undefined
  if (inflight) return inflight

  const nextPromise = fetcher()
    .then((result) => {
      valueCache.set(key, { value: result, expiresAt: Date.now() + ttlMs })
      return result
    })
    .finally(() => {
      inflightCache.delete(key)
    })

  inflightCache.set(key, nextPromise)
  return nextPromise
}

export function clearCachedResource(key: string): void {
  valueCache.delete(key)
  inflightCache.delete(key)
}
