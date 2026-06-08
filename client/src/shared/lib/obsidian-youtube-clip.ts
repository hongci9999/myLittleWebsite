import { parseYoutubeVideoId } from '@/shared/lib/youtube'

type ClipperProperty = { name?: string; value?: string }

function readClipperJsonProperties(text: string): ClipperProperty[] | null {
  const t = text.trim()
  const jsonStart = t.search(/\{\s*"schemaVersion"/)
  const slice = jsonStart >= 0 ? t.slice(jsonStart) : t.startsWith('{') ? t : null
  if (!slice) return null
  try {
    const parsed = JSON.parse(slice) as { properties?: ClipperProperty[] }
    return Array.isArray(parsed.properties) ? parsed.properties : null
  } catch {
    const out: ClipperProperty[] = []
    const re = /"name"\s*:\s*"([^"]+)"\s*,\s*"value"\s*:\s*"((?:\\.|[^"\\])*)"/g
    let m: RegExpExecArray | null
    while ((m = re.exec(slice)) !== null) {
      out.push({
        name: m[1],
        value: m[2]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\'),
      })
    }
    return out.length > 0 ? out : null
  }
}

function propValue(props: ClipperProperty[] | null, name: string): string {
  if (!props) return ''
  const hit = props.find((p) => p.name === name)
  return typeof hit?.value === 'string' ? hit.value.trim() : ''
}

/** Obsidian Web Clipper raw/youtube 노트인지 대략 판별 */
export function isObsidianYoutubeClip(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (/^\{[\s\S]*"schemaVersion"/.test(t) && /youtube/i.test(t)) return true
  if (/"schemaVersion"/.test(t) && /youtube/i.test(t)) return true
  if (!t.startsWith('---')) return false
  if (/source:\s*["']?https?:\/\/[^\n"' ]*youtube/i.test(t)) return true
  if (/raw\/youtube/i.test(t) && /##\s*(트랜스크립트|Transcript)/i.test(t)) {
    return true
  }
  return false
}

/** 붙여넣기만 해도 AI 채우기 시도 가능한지 (서버 파싱 위임 포함) */
export function looksLikeYoutubeClipDraft(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (isObsidianYoutubeClip(t)) return true
  return (
    t.length >= 80 &&
    (/youtube\.com|youtu\.be/i.test(t) ||
      /##\s*(트랜스크립트|Transcript)/i.test(t) ||
      /"schemaVersion"/.test(t) ||
      /raw\/youtube/i.test(t))
  )
}

/** 붙여넣기 직후 폼 URL·제목·표지 미리 채우기 */
export function prefillFromObsidianYoutubeClip(text: string): {
  url: string
  title: string
  coverImageUrl: string | null
} | null {
  if (!looksLikeYoutubeClipDraft(text)) return null

  const jsonProps = readClipperJsonProperties(text)
  let url = propValue(jsonProps, 'source')
  let title = propValue(jsonProps, 'title')
  const thumb = propValue(jsonProps, 'thumbnailUrl')

  if (!url) {
    const sourceMatch = text.match(
      /^source:\s*["']?(https?:\/\/[^\n"']+youtube[^\n"']*)["']?\s*$/im
    )
    url = sourceMatch?.[1]?.trim() ?? ''
  }
  if (!url) {
    const aboutLink = text.match(
      /\[[^\]]+\]\((https?:\/\/[^)]+youtube[^)]*)\)/i
    )
    url = aboutLink?.[1]?.trim() ?? ''
  }
  if (!url) {
    const loose = text.match(
      /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/
    )
    url = loose?.[0] ?? ''
  }
  if (!url || !parseYoutubeVideoId(url)) return null

  if (!title) {
    const titleMatch = text.match(/^title:\s*["']?(.+?)["']?\s*$/im)
    title = titleMatch?.[1]?.trim() ?? ''
  }
  if (!title) {
    const mdTitle = text.match(/##\s*About\s*\n+\[([^\]]+)\]/i)
    title = mdTitle?.[1]?.trim() ?? ''
  }

  const videoId = parseYoutubeVideoId(url)!
  return {
    url,
    title: title || 'YouTube 동영상',
    coverImageUrl:
      thumb || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  }
}
