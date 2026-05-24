/** Markdown ## 제목 → HTML id (한글·영문 허용) */
export function slugifyMarkdownHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export type MarkdownTocItem = { id: string; title: string }

/** 본문에서 `## ` 수준 제목만 목차로 추출 (부록·하위 ### 제외) */
export function extractMarkdownH2Toc(markdown: string): MarkdownTocItem[] {
  const items: MarkdownTocItem[] = []
  const seen = new Map<string, number>()

  for (const line of markdown.split('\n')) {
    const match = /^## (.+)$/.exec(line.trim())
    if (!match) continue

    const title = match[1].trim()
    let id = slugifyMarkdownHeading(title)
    if (!id) id = `section-${items.length}`

    const count = seen.get(id) ?? 0
    seen.set(id, count + 1)
    if (count > 0) id = `${id}-${count + 1}`

    items.push({ id, title })
  }

  return items
}
