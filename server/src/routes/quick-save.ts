import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { supabase } from '../db/supabase.js'
import { deleteColumnScrap } from '../db/queries/column-scraps.js'
import { deleteGameDevResource } from '../db/queries/game-dev-resources.js'
import { deleteAiToolScrap } from '../db/queries/ai-scraps.js'
import {
  SECTIONS,
  createInSection,
  quickSave,
  type ProvidedYoutube,
  type Section,
} from '../services/quick-save/index.js'

const router = Router()

const isSection = (s: unknown): s is Section => typeof s === 'string' && s in SECTIONS

/** POST /api/quick-save — 원클릭 저장 `{ url, youtube? }` */
router.post('/', requireAuth, async (req, res) => {
  const { url, youtube } = req.body as { url?: unknown; youtube?: ProvidedYoutube }
  if (typeof url !== 'string' || !/^https?:\/\//.test(url)) {
    res.status(400).json({ error: 'url is required' })
    return
  }
  const yt =
    youtube && typeof youtube.transcript === 'string'
      ? {
          title: String(youtube.title ?? ''),
          channel: String(youtube.channel ?? ''),
          description: String(youtube.description ?? ''),
          transcript: youtube.transcript,
          lang: typeof youtube.lang === 'string' ? youtube.lang : null,
        }
      : undefined
  try {
    const results = await quickSave((req as AuthenticatedRequest).authToken, url, yt)
    res.json({ results })
  } catch (e) {
    console.error('[quick-save]', e)
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) })
  }
})

/** POST /api/quick-save/move — 오분류 고치기 `{ id, from, to }`: 내용 그대로 새 섹션에 만들고 기존 삭제 */
router.post('/move', requireAuth, async (req, res) => {
  const { id, from, to } = req.body as { id?: unknown; from?: unknown; to?: unknown }
  if (typeof id !== 'string' || !isSection(from) || !isSection(to) || from === to) {
    res.status(400).json({ error: 'id, from, to(서로 다른 섹션) are required' })
    return
  }
  const token = (req as AuthenticatedRequest).authToken
  try {
    const { data: r, error } = await supabase.client!.from(SECTIONS[from].table).select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!r) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    const row = await createInSection(token, to, r.url, {
      title: r.title,
      summary: r.summary,
      bodyMd: r.body_md,
      tags: r.tags,
      extraLinks: r.extra_links,
      coverImageUrl: r.cover_image_url,
    })
    await { column: deleteColumnScrap, 'game-dev': deleteGameDevResource, 'ai-tool': deleteAiToolScrap }[from](token, id)
    res.json({ section: to, id: row.id, slug: row.slug, title: row.title, sitePath: `/${SECTIONS[to].path}/${row.slug}` })
  } catch (e) {
    console.error('[quick-save/move]', e)
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) })
  }
})

export default router
