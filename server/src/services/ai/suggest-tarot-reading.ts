import { stripMarkdownCodeFence } from './json-from-model.js'
import { TarotReadingPrompts } from './prompts/tarot-reading.prompts.js'
import { type TarotInputCard, type TarotReadingResponse } from '../tarot/tarot-local-interpreter.js'
import { getMeaningById } from '../tarot/tarot-major-meanings.js'
import {
  getAiTextProvider,
  type AiRequestPreference,
  parseAiRequestPreference,
} from './providers/registry.js'

function isSlot(v: unknown): v is TarotInputCard['slot'] {
  return v === 'past' || v === 'present' || v === 'advice'
}

function isOrientation(v: unknown): v is TarotInputCard['orientation'] {
  return v === 'upright' || v === 'reversed'
}

export function normalizeTarotCards(raw: unknown): TarotInputCard[] | null {
  if (!Array.isArray(raw) || raw.length !== 3) return null
  const out: TarotInputCard[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const o = item as Record<string, unknown>
    if (!isSlot(o.slot) || !isOrientation(o.orientation)) return null
    if (typeof o.majorId !== 'number' || !Number.isInteger(o.majorId)) return null
    out.push({ slot: o.slot, orientation: o.orientation, majorId: o.majorId })
  }
  return out
}

function normalizeAiResponse(
  cards: TarotInputCard[],
  raw: unknown,
  provider: AiRequestPreference,
  modelLabel: string
): TarotReadingResponse {
  const parsed = raw as Partial<TarotReadingResponse>
  const normalizedCards = cards.map((input, idx) => {
    const fromAi = parsed.cards?.[idx]
    const meaning = getMeaningById(input.majorId)
    return {
      slot: input.slot,
      majorId: input.majorId,
      name: fromAi?.name?.trim() || meaning?.name || `카드-${input.majorId}`,
      orientation: input.orientation,
      keyMeaning:
        fromAi?.keyMeaning?.trim() ||
        (input.orientation === 'upright' ? meaning?.upright : meaning?.reversed) ||
        '핵심 의미',
      interpretation: fromAi?.interpretation?.trim() || '',
    }
  })

  const summary = parsed.overall?.summary?.trim() || ''
  const energy = parsed.overall?.energy?.trim() || ''
  const caution = parsed.overall?.caution?.trim() || ''
  const actionTip = parsed.overall?.actionTip?.trim() || ''

  if (!summary || normalizedCards.some((c) => !c.interpretation)) {
    throw new Error('AI tarot response is missing required fields')
  }

  return {
    cards: normalizedCards,
    overall: {
      summary,
      energy,
      caution,
      actionTip,
    },
    meta: {
      provider,
      modelLabel,
      generatedAt: new Date().toISOString(),
      schemaVersion: 'v1',
    },
  }
}

export async function suggestTarotReading(
  cards: TarotInputCard[],
  preference: AiRequestPreference
): Promise<TarotReadingResponse> {
  const ai = getAiTextProvider(preference)
  const raw = await ai.complete(TarotReadingPrompts.build(cards))
  const clean = stripMarkdownCodeFence(raw)

  try {
    const parsed = JSON.parse(clean)
    const modelLabel =
      preference === 'local' ? 'ollama-text-provider' : 'api-text-provider'
    return normalizeAiResponse(cards, parsed, preference, modelLabel)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown parse error'
    throw new Error(`AI tarot parsing failed: ${msg}`)
  }
}

export { parseAiRequestPreference }
