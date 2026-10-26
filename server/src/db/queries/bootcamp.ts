import { supabase } from '../supabase.js'

/** 현대오토에버 부트캠프 프로젝트 기록 (server/scripts/import-bootcamp.ts가 채움) */
export interface BootcampDoc {
  slug: string
  title: string
  date: string | null
  summary: string | null
  tags: string[]
  bodyMd: string
  sortOrder: number
}

export type BootcampDocSummary = Omit<BootcampDoc, 'bodyMd'>

function mapRow(row: Record<string, unknown>): BootcampDoc {
  return {
    slug: String(row.slug),
    title: String(row.title),
    date: row.date != null ? String(row.date) : null,
    summary: row.summary != null ? String(row.summary) : null,
    tags: Array.isArray(row.tags) ? (row.tags as unknown[]).map(String) : [],
    bodyMd: row.body_md != null ? String(row.body_md) : '',
    sortOrder: Number(row.sort_order ?? 0),
  }
}

/** 목록 — 본문 제외 */
export async function listBootcampDocs(): Promise<BootcampDocSummary[]> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')
  const { data, error } = await client
    .from('bootcamp_docs')
    .select('slug, title, date, summary, tags, sort_order')
    .order('sort_order')
  if (error) throw error
  return (data ?? []).map((r) => {
    const { bodyMd: _omit, ...rest } = mapRow(r as Record<string, unknown>)
    return rest
  })
}

export async function getBootcampDoc(slug: string): Promise<BootcampDoc | null> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')
  const { data, error } = await client.from('bootcamp_docs').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data ? mapRow(data as Record<string, unknown>) : null
}
