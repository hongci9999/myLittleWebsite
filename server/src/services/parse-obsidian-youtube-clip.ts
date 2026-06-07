/**
 * Obsidian Web Clipper raw/youtube 노트 파싱.
 * frontmatter + (본문 마크다운 | clipper JSON noteContentFormat) 에서 메타·자막 추출.
 */

import { parseYoutubeVideoId } from './youtube-transcript-text.js'

const MAX_TRANSCRIPT_CHARS = 16_000

export interface ObsidianYoutubeClip {
  sourceUrl: string
  title: string
  channel: string
  publishedAt: string | null
  clippedAt: string | null
  description: string
  transcript: string
  thumbnailUrl: string | null
  tags: string[]
}

type Frontmatter = Record<string, string | string[]>

function unwrapWikiLink(value: string): string {
  return value.replace(/^\[\[/, '').replace(/\]\]$/, '').trim()
}

function parseScalarValue(raw: string): string {
  const t = raw.trim()
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1).trim()
  }
  return t
}

/** 단순 YAML frontmatter (중첩 객체 없음, 리스트만) */
function parseFrontmatter(text: string): { fm: Frontmatter; body: string } | null {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return null

  const fm: Frontmatter = {}
  let currentListKey: string | null = null

  for (const line of m[1].split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const listItem = line.match(/^\s+-\s+(.+)$/)
    if (listItem && currentListKey) {
      const prev = fm[currentListKey]
      const item = parseScalarValue(listItem[1])
      if (Array.isArray(prev)) prev.push(item)
      else fm[currentListKey] = [item]
      continue
    }

    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!kv) continue

    const key = kv[1]
    const rest = kv[2].trim()
    currentListKey = null

    if (!rest) {
      currentListKey = key
      fm[key] = []
      continue
    }

    fm[key] = parseScalarValue(rest)
  }

  return { fm, body: m[2] }
}

function fmString(fm: Frontmatter, key: string): string {
  const v = fm[key]
  if (typeof v === 'string') return v.trim()
  if (Array.isArray(v) && v.length > 0) return String(v[0]).trim()
  return ''
}

function fmStringList(fm: Frontmatter, key: string): string[] {
  const v = fm[key]
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean)
  if (typeof v === 'string' && v) return [v.trim()]
  return []
}

function extractMarkdownSection(body: string, headings: string[]): string {
  const lines = body.split(/\r?\n/)
  for (const heading of headings) {
    const headingRe = new RegExp(`^##\\s*${heading}\\s*$`, 'i')
    const startIdx = lines.findIndex((line) => headingRe.test(line.trim()))
    if (startIdx < 0) continue

    const chunks: string[] = []
    for (let i = startIdx + 1; i < lines.length; i++) {
      const line = lines[i]
      if (/^##\s+/.test(line) || /^---\s*$/.test(line) || line.trim() === '{') {
        break
      }
      chunks.push(line)
    }
    const section = chunks.join('\n').trim()
    if (section) return section
  }
  return ''
}

function transcriptSectionToPlain(section: string): string {
  const lines: string[] = []
  const re = /\*\*(\d{1,2}:\d{2}(?::\d{2})?)\*\*\s*[·•]\s*(.+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(section)) !== null) {
    const text = m[2].trim()
    if (text) lines.push(text)
  }
  if (lines.length > 0) {
    return lines.join(' ').replace(/\s+/g, ' ').trim()
  }
  return section
    .replace(/\*\*\d{1,2}:\d{2}(?::\d{2})?\*\*\s*[·•]\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function unescapeJsonString(s: string): string {
  return s
    .replace(/\\\\/g, '\u0000')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\u0000/g, '\\')
}

/** JSON.parse 없이 `"key": "..."` 문자열 값 추출 (noteContentFormat 등) */
function extractJsonStringValue(raw: string, key: string): string | null {
  const re = new RegExp(`"${key}"\\s*:\\s*"`)
  const m = re.exec(raw)
  if (!m || m.index === undefined) return null

  let i = m.index + m[0].length
  let result = ''
  while (i < raw.length) {
    const ch = raw[i]
    if (ch === '\\') {
      const next = raw[i + 1]
      if (next === 'n') {
        result += '\n'
        i += 2
        continue
      }
      if (next === 't') {
        result += '\t'
        i += 2
        continue
      }
      if (next === '"') {
        result += '"'
        i += 2
        continue
      }
      if (next === '\\') {
        result += '\\'
        i += 2
        continue
      }
      result += next ?? ''
      i += 2
      continue
    }
    if (ch === '"') break
    result += ch
    i++
  }
  return result
}

function extractClipperProperties(raw: string): Array<{ name: string; value: string }> {
  const out: Array<{ name: string; value: string }> = []
  const re =
    /"name"\s*:\s*"([^"]+)"\s*,\s*"value"\s*:\s*"((?:\\.|[^"\\])*)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    out.push({ name: m[1], value: unescapeJsonString(m[2]) })
  }
  return out
}

function metaFromClipperProperties(
  properties: Array<{ name: string; value: string }>
): Partial<ObsidianYoutubeClip> & { tags?: string[] } {
  const meta: Partial<ObsidianYoutubeClip> & { tags?: string[] } = {}
  for (const p of properties) {
    const name = p.name.trim()
    const value = p.value.trim()
    if (!name || !value) continue
    if (name === 'source') meta.sourceUrl = value
    else if (name === 'title') meta.title = value
    else if (name === 'channel') meta.channel = value
    else if (name === 'thumbnailUrl') meta.thumbnailUrl = value
    else if (name === 'published') meta.publishedAt = value.slice(0, 10)
    else if (name === 'clipped') meta.clippedAt = value.slice(0, 10)
    else if (name === 'tags') meta.tags = [value]
  }
  return meta
}

/** noteContentFormat 파싱 실패·깨진 JSON 대비 — 원문에서 트랜스크립트 구간 추출 */
function extractTranscriptFromRaw(raw: string): string {
  const markers = ['## 트랜스크립트\\n\\n', '## 트랜스크립트\n\n', '## 트랜스크립트']
  for (const marker of markers) {
    const idx = raw.indexOf(marker)
    if (idx < 0) continue
    let section = raw.slice(idx + marker.length)
    for (const end of ['",', '\\n\\n---', '\n\n---', '"properties"']) {
      const e = section.indexOf(end)
      if (e >= 0) section = section.slice(0, e)
    }
    section = unescapeJsonString(section)
    const plain = transcriptSectionToPlain(section)
    if (plain.length > 20) return plain
  }

  if (/\*\*\d{1,2}:\d{2}/.test(raw)) {
    const plain = transcriptSectionToPlain(unescapeJsonString(raw))
    if (plain.length > 20) return plain
  }
  return ''
}

function extractFromClipperJson(body: string): {
  description: string
  transcriptSection: string
  meta: Partial<ObsidianYoutubeClip> & { tags?: string[] }
} {
  const jsonStart = body.search(/\{\s*"schemaVersion"/)
  if (jsonStart < 0) {
    return { description: '', transcriptSection: '', meta: {} }
  }

  const slice = body.slice(jsonStart)
  let note = ''
  let properties: Array<{ name: string; value: string }> = []

  try {
    const parsed = JSON.parse(slice) as {
      noteContentFormat?: string
      properties?: Array<{ name?: string; value?: string }>
    }
    note = (parsed.noteContentFormat ?? '').replace(/\\n/g, '\n')
    properties = (parsed.properties ?? [])
      .filter((p) => p.name && typeof p.value === 'string')
      .map((p) => ({ name: p.name!.trim(), value: p.value!.trim() }))
  } catch {
    note = extractJsonStringValue(slice, 'noteContentFormat') ?? ''
    properties = extractClipperProperties(slice)
  }

  const meta = metaFromClipperProperties(properties)
  const description = extractMarkdownSection(note, ['설명', 'Description'])
  let transcriptSection = extractMarkdownSection(note, ['트랜스크립트', 'Transcript'])
  if (!transcriptSection) {
    transcriptSection = extractTranscriptFromRaw(slice)
  }

  return { description, transcriptSection, meta }
}

function truncateTranscript(text: string): string {
  if (text.length <= MAX_TRANSCRIPT_CHARS) return text
  return text.slice(0, MAX_TRANSCRIPT_CHARS) + '...'
}

/** Obsidian raw/youtube 클립 파일인지 대략 판별 */
export function isObsidianYoutubeClip(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (/^\{[\s\S]*"schemaVersion"/.test(t) && /youtube/i.test(t)) return true
  if (!t.startsWith('---')) return false
  if (/source:\s*["']?https?:\/\/[^\n"' ]*youtube/i.test(t)) return true
  if (/raw\/youtube/i.test(t) && /##\s*(트랜스크립트|Transcript)/i.test(t)) {
    return true
  }
  return /"schemaVersion"/.test(t) && /youtube/i.test(t)
}

export function parseObsidianYoutubeClip(raw: string): ObsidianYoutubeClip | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const fmParsed = parseFrontmatter(trimmed)
  const fm: Frontmatter = fmParsed?.fm ?? {}
  const body = fmParsed?.body ?? trimmed

  if (!fmParsed && !/^\{/.test(trimmed) && !/"schemaVersion"/.test(trimmed)) {
    return null
  }

  const fromJson = extractFromClipperJson(body.startsWith('{') ? trimmed : body)

  let sourceUrl = fmString(fm, 'source') || fromJson.meta.sourceUrl || ''
  if (!sourceUrl) {
    const about = extractMarkdownSection(body, ['About'])
    const link = about.match(/\((https?:\/\/[^)]+youtube[^)]+)\)/i)
    if (link) sourceUrl = link[1]
  }
  if (!sourceUrl) {
    const prop = extractClipperProperties(trimmed).find((p) => p.name === 'source')
    if (prop) sourceUrl = prop.value
  }
  if (!sourceUrl) {
    const loose = trimmed.match(
      /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+[^\s"'\\]*/
    )
    if (loose) sourceUrl = loose[0].replace(/\\+$/, '')
  }
  if (!sourceUrl || !parseYoutubeVideoId(sourceUrl)) return null

  let title = fmString(fm, 'title') || fromJson.meta.title || ''
  if (!title) {
    const about = extractMarkdownSection(body, ['About'])
    const mdLink = about.match(/\[([^\]]+)\]/)
    if (mdLink) title = mdLink[1].trim()
  }

  const creators = fmStringList(fm, 'creator').map(unwrapWikiLink)
  const channel =
    fmString(fm, 'channel') ||
    fromJson.meta.channel ||
    creators[0] ||
    ''

  const publishedAt =
    fmString(fm, 'published').slice(0, 10) ||
    fromJson.meta.publishedAt ||
    null
  const clippedAt =
    fmString(fm, 'clipped').slice(0, 10) ||
    fromJson.meta.clippedAt ||
    null

  const description =
    extractMarkdownSection(body, ['설명', 'Description']) || fromJson.description

  let transcriptSection = extractMarkdownSection(body, [
    '트랜스크립트',
    'Transcript',
  ])
  if (!transcriptSection) transcriptSection = fromJson.transcriptSection
  if (!transcriptSection) transcriptSection = extractTranscriptFromRaw(trimmed)
  const transcript = truncateTranscript(transcriptSectionToPlain(transcriptSection))
  if (!transcript) return null

  const videoId = parseYoutubeVideoId(sourceUrl)!
  const thumbnailUrl =
    fromJson.meta.thumbnailUrl ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  const tags =
    fmStringList(fm, 'tags').length > 0
      ? fmStringList(fm, 'tags')
      : (fromJson.meta.tags ?? [])

  return {
    sourceUrl,
    title: title || 'YouTube 동영상',
    channel,
    publishedAt: publishedAt || null,
    clippedAt: clippedAt || null,
    description,
    transcript,
    thumbnailUrl,
    tags,
  }
}

/** fetchWebsiteContent와 동일한 AI 입력 형식 */
export function obsidianClipToFullText(clip: ObsidianYoutubeClip): string {
  const parts: string[] = []
  parts.push(`제목: ${clip.title}`)
  if (clip.channel) parts.push(`채널: ${clip.channel}`)
  if (clip.publishedAt) parts.push(`게시일: ${clip.publishedAt}`)
  if (clip.clippedAt) parts.push(`클립일: ${clip.clippedAt}`)
  if (clip.description) {
    const desc =
      clip.description.length > 1200
        ? clip.description.slice(0, 1200) + '...'
        : clip.description
    parts.push(`설명:\n${desc}`)
  }
  parts.push(
    `동영상 자막 기반 텍스트 (Obsidian Web Clipper 클립) — 요약·본문 작성의 주요 근거:\n\n${clip.transcript}`
  )
  return parts.join('\n\n')
}

export const OBSIDIAN_YOUTUBE_CLIP_PARSE_ERROR =
  'Obsidian YouTube 클립을 인식하지 못했습니다. frontmatter·clipper JSON·트랜스크립트 섹션을 확인해 주세요.'
