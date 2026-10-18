/**
 * 섹션 분류 프롬프트 점검 — 섹션별 최근 저장 N건을 다시 분류해 실제 저장 위치와 비교 (DB 쓰기 없음, AI 호출 N×3회).
 *   npm run eval-classify -w server -- 12
 * AI 개발 도구는 메인이 레포라 「소개 영상」 추가 링크로 평가. XX 줄이 틀린 것.
 */
import 'dotenv/config'
import { supabase } from '../src/db/supabase.js'
import { classify, videoContext, SECTIONS, type Section } from '../src/services/quick-save/index.js'
import { fetchWebsiteContent } from '../src/services/fetch-website.js'
import { parseYoutubeVideoId } from '../src/services/youtube-transcript-text.js'
const N = Number(process.argv[2] ?? 5)
const rows: { sec: Section; url: string; title: string }[] = []
for (const [sec, v] of Object.entries(SECTIONS) as [Section, any][]) {
  const { data } = await supabase.client!.from(v.table).select('url,title,extra_links').order('created_at', { ascending: false }).limit(N)
  for (const r of data ?? []) {
    // ai-tool은 메인이 레포라 소개 영상(있으면)으로 평가
    const intro = (r.extra_links ?? []).find((l: any) => l.label === '소개 영상')?.url
    rows.push({ sec, url: sec === 'ai-tool' && intro ? intro : r.url, title: r.title })
  }
}
await Promise.all(rows.map(async (r) => {
  try {
    const ctx = parseYoutubeVideoId(r.url) ? await videoContext(r.url) : `URL: ${r.url}\n${(await fetchWebsiteContent(r.url))?.fullText.slice(0, 6000) ?? ''}`
    const c = await classify('api', ctx)
    console.log(`${c.section === r.sec ? 'OK ' : 'XX '} 저장=${r.sec} 분류=${c.section} tools=[${c.tools.map((t) => t.name).join(', ')}] | ${r.title}`)
  } catch (e) { console.log('ERR', r.title, String(e)) }
}))
