/**
 * 원문·정리 본문 조각 벡터 검색 (ADR 0033) — 조각 나누기, Gemini 임베딩, pgvector 검색.
 * 색인 작업(무엇을 언제 색인할지)은 sync.ts, 검색 도구는 index.ts의 search_sources.
 */
import { supabase } from '../../db/supabase.js'

const EMBED_MODEL = 'gemini-embedding-001'
const DIM = 768
const CHUNK = 1000
const OVERLAP = 150

/** README의 HTML·JSON 이스케이프(<…) 정리 — 임베딩·검색 결과 둘 다 읽기 좋게 */
export function cleanText(text: string): string {
  return text
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim()
}

/** 약 1,000자씩, 150자 겹침. 뒤쪽 절반에서 문단 → 줄 → 문장 → 공백 경계 순으로 자른다 */
export function chunkText(text: string): string[] {
  const out: string[] = []
  let i = 0
  while (i < text.length) {
    let end = Math.min(i + CHUNK, text.length)
    if (end < text.length) {
      const from = i + CHUNK / 2
      const win = text.slice(from, end)
      for (const sep of ['\n\n', '\n', '. ', '다. ', ' ']) {
        const cut = win.lastIndexOf(sep)
        if (cut >= 0) {
          end = from + cut + sep.length
          break
        }
      }
    }
    const piece = text.slice(i, end).trim()
    if (piece) out.push(piece)
    if (end >= text.length) break
    i = end - OVERLAP
  }
  return out
}

type TaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY'

/** 100개씩 배치. 768차원은 정규화돼 오지 않아서 L2 정규화. 429면 잠깐 쉬고 재시도 */
export async function embed(texts: string[], taskType: TaskType, title?: string): Promise<number[][]> {
  const key = (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY)?.trim()
  if (!key) throw new Error('GEMINI_API_KEY not configured')
  const out: number[][] = []
  for (let b = 0; b < texts.length; b += 100) {
    const batch = texts.slice(b, b + 100)
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:batchEmbedContents?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: batch.map((text) => ({
              model: `models/${EMBED_MODEL}`,
              content: { parts: [{ text }] },
              taskType,
              ...(title && taskType === 'RETRIEVAL_DOCUMENT' && { title }),
              outputDimensionality: DIM,
            })),
          }),
          signal: AbortSignal.timeout(60_000),
        }
      )
      if (res.status === 429 && attempt < 3) {
        await new Promise((r) => setTimeout(r, 20_000 * (attempt + 1)))
        continue
      }
      const data = (await res.json()) as { embeddings?: { values: number[] }[]; error?: { message?: string } }
      if (!res.ok || !data.embeddings) throw new Error(`embed failed: ${res.status} ${data.error?.message ?? ''}`)
      for (const { values } of data.embeddings) {
        const n = Math.hypot(...values) || 1
        out.push(values.map((v) => v / n))
      }
      break
    }
  }
  return out
}

export type ChunkHit = { origin: 'source' | 'body'; ref: string; chunk_idx: number; text: string; similarity: number }

export async function searchChunks(query: string, k: number): Promise<ChunkHit[]> {
  const [vec] = await embed([query], 'RETRIEVAL_QUERY')
  const { data, error } = (await supabase.client?.rpc('match_source_chunks', {
    query_embedding: JSON.stringify(vec),
    match_count: k,
  })) ?? { data: null, error: new Error('Supabase not configured') }
  if (error) throw new Error(`match_source_chunks: ${error.message}`)
  return data as ChunkHit[]
}
