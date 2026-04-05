import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import {
  getDimensionsWithValues,
  getLinks,
  getFeaturedLinks,
  createLink,
  updateLink,
  deleteLink,
  findValueByLabel,
  createClassificationValue,
  updateClassificationValue,
  deleteClassificationValue,
  getDimensionIdBySlug,
  getLinkUrl,
} from '../db/queries/links.js'
import { parseAiRequestPreference } from '../services/ai/index.js'
import { suggestLinkMeta } from '../services/ollama.js'
import { YOUTUBE_AI_REQUIRES_TRANSCRIPT_MESSAGE } from '../services/youtube-transcript-text.js'
import { fetchWebsiteContent } from '../services/fetch-website.js'

const router = Router()

/** GET /api/links/dimensions - 분류 축 + 값 트리 (공개) */
router.get('/dimensions', async (_, res) => {
  try {
    const dimensions = await getDimensionsWithValues()
    res.json(dimensions)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch dimensions'
    if (msg === 'Supabase not configured') {
      res.status(503).json({
        error: 'Database not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env',
      })
      return
    }
    console.error('[links] getDimensionsWithValues error:', err)
    res.status(500).json({ error: 'Failed to fetch dimensions' })
  }
})

/** GET /api/links/featured - 메인 추천 링크 (공개) */
router.get('/featured', async (_, res) => {
  try {
    const links = await getFeaturedLinks()
    res.json(links)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch featured links'
    if (msg === 'Supabase not configured') {
      res.status(503).json({
        error: 'Database not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env',
      })
      return
    }
    console.error('[links] getFeaturedLinks error:', err)
    res.status(500).json({ error: 'Failed to fetch featured links' })
  }
})

/** GET /api/links - 링크 목록 (공개). query: valueIds, q */
router.get('/', async (req, res) => {
  try {
    const valueIds = req.query.valueIds
      ? String(req.query.valueIds).split(',').filter(Boolean)
      : undefined
    const q = req.query.q ? String(req.query.q) : undefined

    const links = await getLinks({ valueIds, q })
    res.json(links)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch links'
    if (msg === 'Supabase not configured') {
      res.status(503).json({
        error: 'Database not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env',
      })
      return
    }
    console.error('[links] getLinks error:', err)
    res.status(500).json({ error: 'Failed to fetch links' })
  }
})

/** POST /api/links/ai-suggest - AI 제목·설명·파비콘·분류 태그(valueIds) 추천 (인증 필요) */
router.post('/ai-suggest', requireAuth, async (req, res) => {
  try {
    const body = req.body as { url?: string; title?: string }
    if (!body.url?.trim()) {
      res.status(400).json({ error: 'url is required' })
      return
    }

    let dimensions: Awaited<ReturnType<typeof getDimensionsWithValues>> = []
    try {
      dimensions = await getDimensionsWithValues()
    } catch {
      /* 분류 조회 실패 시에도 제목·설명 AI는 동작 */
    }
    const pref = parseAiRequestPreference(req.headers, req.body)
    const { title, description, rawResponse, faviconUrl, valueIds } = await suggestLinkMeta(
      body.url.trim(),
      body.title?.trim() ?? '',
      pref,
      dimensions
    )

    res.json({
      title,
      description,
      rawResponse: rawResponse ?? undefined,
      faviconUrl: faviconUrl ?? undefined,
      valueIds: valueIds ?? undefined,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI suggest failed'
    if (msg === YOUTUBE_AI_REQUIRES_TRANSCRIPT_MESSAGE) {
      res.status(400).json({ error: msg })
      return
    }
    if (msg.includes('GEMINI_API_KEY') || msg.includes('GOOGLE_AI_API_KEY')) {
      res.status(503).json({
        error: 'API 모드에는 서버에 GEMINI_API_KEY(또는 GOOGLE_AI_API_KEY)가 필요합니다.',
      })
      return
    }
    if (msg.includes('Ollama') || msg.includes('fetch')) {
      res.status(503).json({
        error: 'Ollama를 실행 중인지 확인하세요. (ollama run gemma4)',
      })
      return
    }
    console.error('[links] ai-suggest error:', err)
    res.status(500).json({ error: msg })
  }
})

/** POST /api/links/values - 새 태그 추가 (인증 필요). 목적(purpose) 또는 종류(medium)에 생성. purpose만 parentId 허용 */
router.post('/values', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const body = req.body as {
      label?: string
      dimensionSlug?: string
      parentId?: string | null
    }
    const label = body.label?.trim()
    const dimensionSlug = body.dimensionSlug?.trim()
    if (!label) {
      res.status(400).json({ error: 'label is required' })
      return
    }
    if (dimensionSlug !== 'purpose' && dimensionSlug !== 'medium') {
      res.status(400).json({ error: 'dimensionSlug must be "purpose" or "medium"' })
      return
    }
    if (body.parentId && dimensionSlug !== 'purpose') {
      res.status(400).json({ error: 'parentId is only allowed for purpose' })
      return
    }

    const dimId = await getDimensionIdBySlug(dimensionSlug)
    if (!dimId) {
      res.status(503).json({ error: `dimension "${dimensionSlug}" not found` })
      return
    }

    const existing = await findValueByLabel(label)
    if (existing) {
      res.json({ id: existing, label })
      return
    }

    const { id } = await createClassificationValue(authToken, dimId, {
      label,
      parentId: body.parentId ?? undefined,
    })
    res.status(201).json({ id, label })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create tag'
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Auth not configured' })
      return
    }
    console.error('[links] create value error:', err)
    res.status(500).json({ error: msg })
  }
})

/** PATCH /api/links/values/:valueId - 태그 이름 수정 (인증 필요). purpose | medium만 */
router.patch('/values/:valueId', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const { valueId } = req.params
    const body = req.body as { label?: string }
    const label = body.label?.trim()
    if (!label) {
      res.status(400).json({ error: 'label is required' })
      return
    }
    await updateClassificationValue(authToken, valueId, { label })
    res.status(204).send()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update tag'
    if (msg === 'Tag not found') {
      res.status(404).json({ error: msg })
      return
    }
    if (msg === 'Only purpose and medium tags can be managed here') {
      res.status(403).json({ error: msg })
      return
    }
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Auth not configured' })
      return
    }
    console.error('[links] update value error:', err)
    res.status(500).json({ error: msg })
  }
})

/** DELETE /api/links/values/:valueId - 태그 삭제 (인증 필요). 링크 연결·하위 태그 CASCADE */
router.delete('/values/:valueId', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const { valueId } = req.params
    await deleteClassificationValue(authToken, valueId)
    res.status(204).send()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete tag'
    if (msg === 'Tag not found') {
      res.status(404).json({ error: msg })
      return
    }
    if (msg === 'Only purpose and medium tags can be managed here') {
      res.status(403).json({ error: msg })
      return
    }
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Auth not configured' })
      return
    }
    console.error('[links] delete value error:', err)
    res.status(500).json({ error: msg })
  }
})

/** POST /api/links - 링크 추가 (인증 필요) */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const body = req.body as {
      url?: string
      title?: string
      description?: string
      valueIds?: string[]
      isFeatured?: boolean
      faviconUrl?: string | null
    }
    if (!body.url || !body.title) {
      res.status(400).json({ error: 'url and title are required' })
      return
    }
    const trimmedUrl = body.url.trim()
    let faviconUrl: string | null = null
    const fromClient = body.faviconUrl?.trim()
    if (fromClient) {
      faviconUrl = fromClient
    } else {
      const content = await fetchWebsiteContent(trimmedUrl)
      faviconUrl = content?.faviconUrl ?? null
    }
    const link = await createLink(authToken, {
      url: trimmedUrl,
      title: body.title,
      description: body.description,
      valueIds: body.valueIds,
      isFeatured: body.isFeatured,
      faviconUrl,
    })
    res.status(201).json(link)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create link'
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Auth not configured' })
      return
    }
    console.error('[links] createLink error:', err)
    res.status(500).json({ error: 'Failed to create link' })
  }
})

/** PATCH /api/links/:id - 링크 수정 (인증 필요) */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const { id } = req.params
    const body = req.body as {
      url?: string
      title?: string
      description?: string
      valueIds?: string[]
      isFeatured?: boolean
      featuredSortOrder?: number
      faviconUrl?: string | null
    }

    let faviconPatch: { faviconUrl?: string | null } = {}
    if (body.url != null) {
      const trimmed = body.url.trim()
      let urlChanged = true
      try {
        const previous = await getLinkUrl(authToken, id)
        if (previous !== null) urlChanged = trimmed !== previous
      } catch {
        urlChanged = true
      }
      if (urlChanged) {
        const content = await fetchWebsiteContent(trimmed)
        faviconPatch = { faviconUrl: content?.faviconUrl ?? null }
      }
    }

    const link = await updateLink(authToken, id, {
      url: body.url,
      title: body.title,
      description: body.description,
      valueIds: body.valueIds,
      isFeatured: body.isFeatured,
      featuredSortOrder: body.featuredSortOrder,
      faviconUrl: body.faviconUrl,
      ...faviconPatch,
    })
    res.json(link)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update link'
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Auth not configured' })
      return
    }
    console.error('[links] updateLink error:', err)
    res.status(500).json({ error: 'Failed to update link' })
  }
})

/** DELETE /api/links/:id - 링크 삭제 (인증 필요) */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { authToken } = req as AuthenticatedRequest
    const { id } = req.params
    await deleteLink(authToken, id)
    res.status(204).send()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete link'
    if (msg === 'Supabase not configured') {
      res.status(503).json({ error: 'Auth not configured' })
      return
    }
    console.error('[links] deleteLink error:', err)
    res.status(500).json({ error: 'Failed to delete link' })
  }
})

export default router
