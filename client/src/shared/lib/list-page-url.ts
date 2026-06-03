export function patchSearchParams(
  prev: URLSearchParams,
  updates: Record<string, string | null | undefined>
): URLSearchParams {
  const next = new URLSearchParams(prev)
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === '') next.delete(key)
    else next.set(key, value)
  }
  return next
}

export function readDimensionFilters(
  searchParams: URLSearchParams,
  reservedKeys: Set<string>
): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {}
  searchParams.forEach((value, key) => {
    if (reservedKeys.has(key)) return
    const ids = value.split(',').filter(Boolean)
    if (ids.length > 0) out[key] = new Set(ids)
  })
  return out
}

export function dimensionFiltersToParams(
  selected: Record<string, Set<string>>
): Record<string, string | null> {
  const out: Record<string, string | null> = {}
  for (const [slug, ids] of Object.entries(selected)) {
    out[slug] = ids.size > 0 ? Array.from(ids).join(',') : null
  }
  return out
}
