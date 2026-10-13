/**
 * 저장된 스크랩의 원문(유튜브 자막·README·페이지 본문)을 scrap_sources에 채운다. 로컬 전용.
 * 유튜브 자막은 Vercel IP에서 막히므로 이 스크립트로 미리 저장해 두고 MCP get_source가 읽는다.
 *
 *   npm run backfill-sources -w server            # 없는 것만
 *   npm run backfill-sources -w server -- --force # 전부 다시
 *
 * 로그인: server/.env 의 BULK_EMAIL / BULK_PASSWORD
 */
import '../src/env.js'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseWithAuth, supabase } from '../src/db/supabase.js'
import { knowledgeTools } from '../src/services/knowledge/index.js'
import { fetchSourceText } from '../src/services/knowledge/source.js'
import { parseYoutubeVideoId } from '../src/services/youtube-transcript-text.js'

type Item = { id: string; url: string; extraLinks: { url: string }[] }

async function login(): Promise<string> {
  const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
  const { data, error } = await client.auth.signInWithPassword({
    email: process.env.BULK_EMAIL!,
    password: process.env.BULK_PASSWORD!,
  })
  if (error || !data.session) throw new Error('로그인 실패: ' + (error?.message ?? 'no session'))
  return data.session.access_token
}

const force = process.argv.includes('--force')
const tool = (name: string) => knowledgeTools.find((t) => t.name === name)!

;(async () => {
  const db = getSupabaseWithAuth(await login())!
  const list = (await tool('list_scraps').handler({})) as { id: string }[]
  const items = (await tool('get_scraps').handler({ ids: list.map((x) => x.id) })) as Item[]

  // 메인 url + 추가 링크 중 유튜브·GitHub (소개 영상, 레포)
  const urls = [
    ...new Set(
      items.flatMap((s) => [
        s.url,
        ...s.extraLinks.map((l) => l.url).filter((u) => parseYoutubeVideoId(u) || u.includes('github.com/')),
      ])
    ),
  ]
  const { data: have } = await supabase.client!.from('scrap_sources').select('url')
  const done = new Set(force ? [] : (have ?? []).map((r) => r.url as string))
  const todo = urls.filter((u) => !done.has(u))
  console.log(`대상 ${todo.length} / 전체 ${urls.length}`)

  let ok = 0
  for (const url of todo) {
    try {
      const src = await fetchSourceText(url)
      if (!src) {
        console.log(`✗ 원문 없음: ${url}`)
        continue
      }
      const { error } = await db
        .from('scrap_sources')
        .upsert({ url, kind: src.kind, text: src.text, fetched_at: new Date().toISOString() })
      if (error) throw error
      ok++
      console.log(`✓ ${src.kind} ${src.text.length.toLocaleString()}자 ${url}`)
    } catch (err) {
      console.log(`✗ ${url} — ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  console.log(`완료 ${ok}/${todo.length}`)
})().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
