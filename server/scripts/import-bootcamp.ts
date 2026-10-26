/**
 * 부트캠프 프로젝트 기록 폴더 → DB(bootcamp_docs) + Storage(bootcamp 버킷)
 * 실행: npm run import-bootcamp -w server -- <폴더> [--dry]   (폴더 = *.md + images/)
 *   --dry: 로그인·업로드 없이 파싱 결과만 출력
 *
 * - 이미지: 본문이 참조하는 images/… 만 버킷에 같은 경로로 업로드(덮어쓰기).
 *   안 쓰인 슬라이드(팀원 실명 표지 등)는 공개 버킷에 올리지 않는다.
 * - 본문: frontmatter 분리, `images/…` → Storage 공개 URL, `foo.md` 링크 → /bootcamp/foo
 * - 다시 돌리면 같은 slug는 덮어쓴다 (문서 고친 뒤 재실행용)
 * 테이블·버킷은 docs/plans/2026-10-26-bootcamp-docs.sql 먼저 실행.
 */
import 'dotenv/config'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'bootcamp'

type Front = { title: string; date: string | null; summary: string | null; tags: string[] }

/** 이 폴더 frontmatter 형식(title "…", date, summary "…", tags [a, b])만 다루는 최소 파서 */
export function parseFrontmatter(md: string): { front: Front; body: string } {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  const raw = m?.[1] ?? ''
  const get = (k: string) => raw.match(new RegExp(`^${k}:\\s*(.*)$`, 'm'))?.[1]?.trim() ?? ''
  const unquote = (s: string) => s.replace(/^"(.*)"$/, '$1')
  const tags = get('tags')
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((t) => unquote(t.trim()))
    .filter(Boolean)
  return {
    front: {
      title: unquote(get('title')),
      date: get('date') || null,
      summary: unquote(get('summary')) || null,
      tags,
    },
    body: m ? md.slice(m[0].length) : md,
  }
}

export function rewriteBody(body: string, imageBase: string): string {
  return body
    // 연속된 인용 줄(> **과정** … / > **기간** …)은 한 문단으로 합쳐지므로 줄 끝에 하드 브레이크
    .replace(/^(>[^\n]*\S)[ \t]*\r?\n(?=>[ \t]*\S)/gm, '$1  \n')
    .replace(/\]\((?:\.\/)?images\//g, `](${imageBase}/`)
    .replace(/\]\((?:\.\/)?index\.md(#[^)]*)?\)/g, '](/bootcamp$1)')
    .replace(/\]\((?:\.\/)?([\w-]+)\.md(#[^)]*)?\)/g, '](/bootcamp/$1$2)')
}

/** 본문이 참조하는 이미지 경로 (images/ 기준 상대, 중복 제거) */
export function referencedImages(mdFiles: string[]): string[] {
  const keys = mdFiles.flatMap((md) => [...md.matchAll(/\]\((?:\.\/)?images\/([^)\s]+)\)/g)].map((m) => m[1]))
  return [...new Set(keys)]
}

async function main() {
  const [dir, flag] = process.argv.slice(2)
  if (!dir) throw new Error('사용법: import-bootcamp <폴더> [--dry]')
  const dry = flag === '--dry'
  const url = process.env.SUPABASE_URL!
  const imageBase = `${url}/storage/v1/object/public/${BUCKET}`
  const mdNames = readdirSync(dir).filter((n) => n.endsWith('.md'))
  const mdTexts = mdNames.map((n) => readFileSync(path.join(dir, n), 'utf8'))
  const imageKeys = referencedImages(mdTexts)
  const docs = mdNames
    .map((n, i) => {
      const { front, body } = parseFrontmatter(mdTexts[i])
      return { slug: n.replace(/\.md$/, ''), front, body: rewriteBody(body, imageBase) }
    })
    // index가 0번, 나머지는 날짜순(먼저 한 프로젝트가 앞)
    .sort((a, b) =>
      a.slug === 'index' ? -1 : b.slug === 'index' ? 1 : (a.front.date ?? '').localeCompare(b.front.date ?? '')
    )
  const rows = docs.map((d, i) => ({
    slug: d.slug,
    title: d.front.title || d.slug,
    date: d.front.date,
    summary: d.front.summary,
    tags: d.front.tags,
    body_md: d.body,
    sort_order: i,
    updated_at: new Date().toISOString(),
  }))
  if (dry) {
    for (const r of rows) {
      const links = [...r.body_md.matchAll(/\]\((\/bootcamp[^)]*|[^)]*\.md[^)]*)\)/g)].map((m) => m[1])
      const imgs = (r.body_md.match(/!\[[^\]]*\]\(https?:[^)]+\)/g) ?? []).length
      console.log(r.sort_order, r.slug, '|', r.title, '|', r.date, '|', r.tags.join(','), '| 이미지', imgs, '| 링크', [...new Set(links)].join(' '))
    }
    console.log(`업로드할 이미지 ${imageKeys.length}장`)
    return
  }
  const client = createClient(url, process.env.SUPABASE_ANON_KEY!)
  const { error: authErr } = await client.auth.signInWithPassword({
    email: process.env.BULK_EMAIL!,
    password: process.env.BULK_PASSWORD!,
  })
  if (authErr) throw new Error('로그인 실패: ' + authErr.message)

  let done = 0
  for (const key of imageKeys) {
    const { error } = await client.storage
      .from(BUCKET)
      .upload(key, readFileSync(path.join(dir, 'images', key)), { contentType: 'image/webp', upsert: true })
    if (error) throw new Error(`이미지 업로드 실패 ${key}: ${error.message}`)
    if (++done % 20 === 0) console.log(`이미지 ${done}/${imageKeys.length}`)
  }
  console.log(`이미지 ${imageKeys.length}장 업로드`)

  const { error } = await client.from('bootcamp_docs').upsert(rows)
  if (error) throw new Error('DB 저장 실패: ' + error.message)
  for (const r of rows) console.log(`✓ ${r.sort_order} ${r.slug} — ${r.title}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
