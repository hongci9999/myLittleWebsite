import type { ColumnSourceKind } from '../../db/queries/column-scraps.js'
import type { SourceKind as AiScrapSourceKind } from '../../db/queries/ai-scraps.js'

export interface AiSuggestResult {
  title: string
  description: string
  rawResponse?: string
  faviconUrl?: string | null
}

export interface ColumnScrapAiFillResult {
  title: string
  summary: string
  bodyMd: string
  sourceKind: ColumnSourceKind
  coverImageUrl: string | null
  tags: string[]
  rawResponse?: string
}

export interface AiToolScrapAiFillResult {
  title: string
  summary: string
  bodyMd: string
  sourceKind: AiScrapSourceKind
  tags: string[]
  rawResponse?: string
}
