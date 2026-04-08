import {
  aiProviderBodyField,
  aiProviderRequestHeaders,
} from '@/shared/lib/ai-provider-preference'

export type TarotOrientation = 'upright' | 'reversed'
export type TarotSlot = 'past' | 'present' | 'advice'

export type TarotReadingCard = {
  slot: TarotSlot
  majorId: number
  name: string
  orientation: TarotOrientation
  keyMeaning: string
  interpretation: string
}

export type TarotReadingResponse = {
  cards: TarotReadingCard[]
  overall: {
    summary: string
    energy: string
    caution: string
    actionTip: string
  }
  meta: {
    provider: 'local' | 'api'
    modelLabel: string
    generatedAt: string
    schemaVersion: 'v1'
  }
}

export async function fetchTarotReading(cards: {
  slot: TarotSlot
  majorId: number
  orientation: TarotOrientation
}[]): Promise<TarotReadingResponse> {
  const res = await fetch('/api/tarot/reading', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...aiProviderRequestHeaders(),
    },
    body: JSON.stringify({ cards, ...aiProviderBodyField() }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || '타로 해석 요청 실패')
  }
  return json as TarotReadingResponse
}
