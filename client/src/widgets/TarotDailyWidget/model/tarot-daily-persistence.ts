import type { TarotReadingResponse } from '@/shared/api/tarot'
import { TAROT_MAJOR_CARDS } from './tarot-major'
import { createTarotDraw } from './tarot-draw'
import type { TarotDrawCard, TarotOrientation, TarotSlot } from './types'

const STORAGE_KEY = 'mylittlewebsite-tarot-daily-v1'

const SLOTS: TarotSlot[] = ['past', 'present', 'advice']

export function getTarotDailyDateKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function finalRotationDeg(orientation: TarotOrientation): number {
  return orientation === 'reversed' ? 180 : 0
}

function isValidReading(raw: unknown): raw is TarotReadingResponse {
  if (!raw || typeof raw !== 'object') return false
  const r = raw as TarotReadingResponse
  return (
    Array.isArray(r.cards) &&
    r.cards.length > 0 &&
    r.overall != null &&
    typeof r.overall === 'object' &&
    typeof r.overall.summary === 'string' &&
    typeof r.overall.actionTip === 'string'
  )
}

function normalizeUiState(
  raw: unknown
): 'idle-back' | 'revealed' {
  if (raw === 'spinning' || raw === 'revealing') return 'revealed'
  if (raw === 'revealed') return 'revealed'
  return 'idle-back'
}

function parseDrawCards(raw: unknown): TarotDrawCard[] | null {
  if (!Array.isArray(raw) || raw.length !== 3) return null
  const out: TarotDrawCard[] = []
  for (let i = 0; i < 3; i += 1) {
    const row = raw[i]
    if (!row || typeof row !== 'object') return null
    const id = (row as { card?: { id?: unknown } }).card?.id
    if (typeof id !== 'number' || !Number.isInteger(id)) return null
    const meta = TAROT_MAJOR_CARDS.find((c) => c.id === id)
    if (!meta) return null
    const o = (row as { orientation?: unknown }).orientation
    const orientation: TarotOrientation = o === 'reversed' ? 'reversed' : 'upright'
    const uiState = normalizeUiState((row as { uiState?: unknown }).uiState)
    out.push({
      slot: SLOTS[i],
      card: meta,
      orientation,
      uiState,
    })
  }
  const ids = new Set(out.map((c) => c.card.id))
  if (ids.size !== 3) return null
  return out
}

function parseRotations(raw: unknown): [number, number, number] {
  if (!Array.isArray(raw) || raw.length !== 3) return [0, 0, 0]
  return raw.map((n) =>
    typeof n === 'number' && Number.isFinite(n) ? n : 0
  ) as [number, number, number]
}

function alignRotations(cards: TarotDrawCard[], rots: [number, number, number]): number[] {
  return cards.map((card, i) => {
    if (card.uiState === 'revealed') return finalRotationDeg(card.orientation)
    return rots[i] ?? 0
  })
}

export type TarotDailyPersistedSnapshot = {
  started: boolean
  cards: TarotDrawCard[]
  rotations: number[]
  reading: TarotReadingResponse | null
}

export function loadTarotDailySnapshot(): TarotDailyPersistedSnapshot | null {
  if (typeof window === 'undefined') return null
  let raw: unknown
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (!s) return null
    raw = JSON.parse(s) as unknown
  } catch {
    return null
  }
  if (!raw || typeof raw !== 'object') return null
  const date = (raw as { date?: unknown }).date
  if (date !== getTarotDailyDateKey()) return null
  const started = Boolean((raw as { started?: unknown }).started)
  const cards = parseDrawCards((raw as { cards?: unknown }).cards)
  if (!cards) return null
  const rotations = alignRotations(cards, parseRotations((raw as { rotations?: unknown }).rotations))
  const readingRaw = (raw as { reading?: unknown }).reading
  const reading =
    readingRaw === null || readingRaw === undefined
      ? null
      : isValidReading(readingRaw)
        ? readingRaw
        : null
  return { started, cards, rotations, reading }
}

export function saveTarotDailySnapshot(snapshot: TarotDailyPersistedSnapshot): void {
  if (typeof window === 'undefined') return
  try {
    const payload = {
      date: getTarotDailyDateKey(),
      started: snapshot.started,
      cards: snapshot.cards,
      rotations: snapshot.rotations,
      reading: snapshot.reading,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // quota / private mode 등 — 무시
  }
}

export function createFreshTarotDailySnapshot(): TarotDailyPersistedSnapshot {
  return {
    started: false,
    cards: createTarotDraw(),
    rotations: [0, 0, 0],
    reading: null,
  }
}
