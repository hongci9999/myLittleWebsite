import { supabase } from '../supabase.js'

export interface LearningSectionRow {
  id: string
  section_id: string
  label: string
  base_path: string
  sort_order: number
}

export interface LearningNodeRow {
  id: string
  section_id: string
  parent_id: string | null
  node_id: string
  name: string
  description: string | null
  sort_order: number
}

export interface LearningDocRow {
  id: string
  node_id: string
  slug: string
  title: string
  file_path: string
  sort_order: number
}

/** API 응답용: FileStructureSection 형식 */
export interface FileStructureSectionResponse {
  sectionId: string
  sectionLabel: string
  basePath: string
  nodes: FileStructureNodeResponse[]
}

export interface FileStructureNodeResponse {
  id: string
  name: string
  description?: string
  children?: FileStructureNodeResponse[]
  docs?: FileStructureDocResponse[]
}

export interface FileStructureDocResponse {
  slug: string
  title: string
  filePath: string
}

/** 섹션 목록 조회 */
export async function getSections(): Promise<LearningSectionRow[]> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')
  const { data, error } = await client
    .from('learning_sections')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

/** 섹션 상세 + 노드·문서 (FileStructureSection 형식) */
export async function getSectionWithNodes(
  sectionId: string
): Promise<FileStructureSectionResponse | null> {
  const client = supabase.client
  if (!client) throw new Error('Supabase not configured')
  const { data: section, error: sectionError } = await client
    .from('learning_sections')
    .select('*')
    .eq('section_id', sectionId)
    .single()

  if (sectionError || !section) return null

  const { data: nodes, error: nodesError } = await client
    .from('learning_nodes')
    .select('*')
    .eq('section_id', section.id)
    .is('parent_id', null)
    .order('sort_order', { ascending: true })

  if (nodesError) throw nodesError

  const nodesWithDocs: FileStructureNodeResponse[] = await Promise.all(
    (nodes ?? []).map(async (node) => {
      const { data: docs } = await client
        .from('learning_docs')
        .select('slug, title, file_path')
        .eq('node_id', node.id)
        .order('sort_order', { ascending: true })

      return {
        id: node.node_id,
        name: node.name,
        description: node.description ?? undefined,
        docs:
          docs && docs.length > 0
            ? docs.map((d) => ({
                slug: d.slug,
                title: d.title,
                filePath: d.file_path,
              }))
            : undefined,
      }
    })
  )

  return {
    sectionId: section.section_id,
    sectionLabel: section.label,
    basePath: section.base_path,
    nodes: nodesWithDocs,
  }
}
