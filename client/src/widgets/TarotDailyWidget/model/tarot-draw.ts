import { TAROT_MAJOR_CARDS } from './tarot-major'
import type { TarotDrawCard, TarotOrientation, TarotSlot } from './types'

const SLOTS: TarotSlot[] = ['past', 'present', 'advice']

function randomOrientation(): TarotOrientation {
  return Math.random() < 0.5 ? 'upright' : 'reversed'
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = next[i]
    next[i] = next[j]
    next[j] = temp
  }
  return next
}

function assertNoDuplicates(cards: TarotDrawCard[]) {
  const ids = cards.map((x) => x.card.id)
  const unique = new Set(ids)
  if (unique.size !== cards.length) {
    throw new Error('Duplicate tarot cards detected in draw result')
  }
}

export function createTarotDraw(): TarotDrawCard[] {
  const picked = shuffle(TAROT_MAJOR_CARDS).slice(0, 3)
  const result = picked.map((card, index) => ({
    slot: SLOTS[index],
    card,
    orientation: randomOrientation(),
    uiState: 'idle-back' as const,
  }))
  assertNoDuplicates(result)
  return result
}
