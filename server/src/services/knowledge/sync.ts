/**
 * 원문 수집 + 조각 색인 동기화 (ADR 0033). Vercel cron(`/api/cron/sources`, 하루 1회)과 로컬 백필이 같이 쓴다.
 *
 * 1. 원문: 스크랩(유용한 링크 제외) 메인 url + 유튜브·GitHub 추가 링크 중 scrap_sources에 없는 것을 받는다.
 *    cron(Vercel)은 유튜브 자막이 막혀 Gemini 영상 요약(digest)으로 대신, 로컬 백필은 digest를 진짜 자막으로 교체.
 * 2. 색인: 원문·부트캠프 기록(origin=source)과 사이트 정리 본문(origin=body)을 조각으로 나눠,
 *    저장된 조각과 내용이 다를 때만 다시 임베딩. 사라진 자료의 조각은 지운다.
 * 시간이 모자라면(deadline) 남은 건 다음 실행에서 이어 한다.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { parseYoutubeVideoId } from '../youtube-transcript-text.js'
import { chunkText, cleanText, embed } from './chunks.js'
import { loadScraps } from './index.js'
import { fetchSourceText } from './source.js'

type Doc = { origin: 'source' | 'body'; ref: string; title: string; chunks: string[] }

export type SyncResult = { fetched: number; fetchFailed: number; indexed: number; chunks: number; removed: number; pending: number }

async function selectAll<T>(db: SupabaseClient, table: string, cols: string): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(cols).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    out.push(...((data ?? []) as T[]))
    if (!data || data.length < 1000) return out
  }
}

export async function syncSources(
  db: SupabaseClient,
  { allowAiDigest, deadline = Infinity, log = console.log }: { allowAiDigest: boolean; deadline?: number; log?: (m: string) => void }
): Promise<SyncResult> {
  const r: SyncResult = { fetched: 0, fetchFailed: 0, indexed: 0, chunks: 0, removed: 0, pending: 0 }
  const scraps = (await loadScraps()).filter((s) => s.section !== 'links') // 링크는 사이트 홈이라 원문이 대부분 마케팅 문구

  // 1. 원문 수집
  const titleOf = new Map<string, string>()
  for (const s of scraps) {
    titleOf.set(s.url, s.title)
    for (const l of s.extraLinks)
      if (parseYoutubeVideoId(l.url) || l.url.includes('github.com/')) titleOf.has(l.url) || titleOf.set(l.url, s.title)
  }
  const have = new Map(
    (await selectAll<{ url: string; kind: string }>(db, 'scrap_sources', 'url, kind')).map((x) => [x.url, x.kind])
  )
  const todo = [...titleOf.keys()].filter((u) => !have.has(u) || (!allowAiDigest && have.get(u) === 'digest'))
  for (const url of todo) {
    if (Date.now() > deadline) {
      r.pending++
      continue
    }
    try {
      const src = await fetchSourceText(url, { allowAiDigest })
      if (!src) {
        r.fetchFailed++
        log(`✗ 원문 없음 ${url}`)
        continue
      }
      const kind = src.kind === 'ai-digest' ? 'digest' : src.kind
      const { error } = await db.from('scrap_sources').upsert({ url, kind, text: src.text, fetched_at: new Date().toISOString() })
      if (error) throw error
      r.fetched++
      log(`✓ ${kind} ${src.text.length}자 ${url}`)
    } catch (e) {
      r.fetchFailed++
      log(`✗ ${url} — ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // 2. 색인 대상
  const sources = await selectAll<{ url: string; text: string }>(db, 'scrap_sources', 'url, text')
  const boot = await selectAll<{ slug: string; title: string; body_md: string }>(db, 'bootcamp_docs', 'slug, title, body_md')
  const docs: Doc[] = [
    ...sources
      .filter((x) => titleOf.has(x.url))
      .map((x): Doc => ({ origin: 'source', ref: x.url, title: titleOf.get(x.url)!, chunks: chunkText(cleanText(x.text)) })),
    ...boot.map((b): Doc => ({
      origin: 'source',
      ref: b.slug === 'index' ? '/bootcamp' : `/bootcamp/${b.slug}`,
      title: b.title,
      chunks: chunkText(cleanText(b.body_md)),
    })),
    ...scraps
      .filter((s) => s.bodyMd?.trim())
      .map((s): Doc => ({ origin: 'body', ref: s.id, title: s.title, chunks: chunkText(cleanText(`${s.title}\n\n${s.bodyMd}`)) })),
  ]

  const stored = new Map<string, string[]>()
  for (const c of await selectAll<{ origin: string; ref: string; chunk_idx: number; text: string }>(
    db,
    'source_chunks',
    'origin, ref, chunk_idx, text'
  )) {
    const k = `${c.origin}\t${c.ref}`
    const arr = stored.get(k) ?? []
    arr[c.chunk_idx] = c.text
    stored.set(k, arr)
  }

  // 3. 바뀐 문서만 다시 임베딩
  for (const d of docs) {
    const k = `${d.origin}\t${d.ref}`
    const old = stored.get(k)
    stored.delete(k)
    if (old && old.length === d.chunks.length && old.every((t, i) => t === d.chunks[i])) continue
    if (!d.chunks.length) continue
    if (Date.now() > deadline) {
      r.pending++
      continue
    }
    const vecs = await embed(d.chunks, 'RETRIEVAL_DOCUMENT', d.title)
    const del = await db.from('source_chunks').delete().eq('origin', d.origin).eq('ref', d.ref)
    if (del.error) throw new Error(`delete chunks: ${del.error.message}`)
    const ins = await db.from('source_chunks').insert(
      d.chunks.map((text, i) => ({ origin: d.origin, ref: d.ref, chunk_idx: i, text, embedding: JSON.stringify(vecs[i]) }))
    )
    if (ins.error) throw new Error(`insert chunks: ${ins.error.message}`)
    r.indexed++
    r.chunks += d.chunks.length
    log(`◆ ${d.origin} ${d.chunks.length}조각 ${d.ref}`)
  }

  // 4. 사라진 자료의 조각 정리
  for (const k of stored.keys()) {
    const [origin, ref] = k.split('\t')
    const { error } = await db.from('source_chunks').delete().eq('origin', origin).eq('ref', ref)
    if (error) throw new Error(`delete orphan: ${error.message}`)
    r.removed++
  }
  return r
}
