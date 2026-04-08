import {
  getMeaningById,
  type TarotOrientation,
  type TarotSlot,
} from './tarot-major-meanings.js'

export type TarotInputCard = {
  slot: TarotSlot
  majorId: number
  orientation: TarotOrientation
}

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

function slotLead(slot: TarotSlot): string {
  if (slot === 'past') return '과거 흐름에서는'
  if (slot === 'present') return '현재 에너지에서는'
  return '조언 포인트에서는'
}

function orientationTone(orientation: TarotOrientation): string {
  return orientation === 'upright'
    ? '흐름이 비교적 자연스럽게 이어집니다.'
    : '흐름이 지연되거나 내면에서 충돌할 수 있습니다.'
}

function toCardInterpretation(card: TarotInputCard): TarotReadingCard {
  const found = getMeaningById(card.majorId)
  const name = found?.name ?? `카드 ${card.majorId}`
  const keyMeaning =
    card.orientation === 'upright'
      ? found?.upright ?? '핵심 의미'
      : found?.reversed ?? '보정 의미'
  return {
    slot: card.slot,
    majorId: card.majorId,
    name,
    orientation: card.orientation,
    keyMeaning,
    interpretation: `${slotLead(card.slot)} "${name}"의 의미는 ${keyMeaning}이며, ${orientationTone(card.orientation)}`,
  }
}

export function buildLocalTarotReading(cards: TarotInputCard[]): TarotReadingResponse {
  const interpreted = cards.map(toCardInterpretation)
  const summary = `${interpreted[0]?.name ?? '첫 카드'}에서 시작된 흐름이 ${interpreted[1]?.name ?? '둘째 카드'}에서 오늘의 핵심으로 나타나고, ${interpreted[2]?.name ?? '셋째 카드'}가 실천 방향을 제시합니다.`
  const energy = interpreted
    .map((c) => `${c.name}(${c.orientation === 'upright' ? '정' : '역'})`)
    .join(' · ')
  const caution = '중요한 결정은 단정적으로 해석하지 말고, 현재 컨디션과 현실 조건을 함께 점검하세요.'
  const actionTip = '오늘 바로 실행 가능한 작은 행동 하나를 정해 20분 안에 시작해보세요.'

  return {
    cards: interpreted,
    overall: { summary, energy, caution, actionTip },
    meta: {
      provider: 'local',
      modelLabel: 'rule-based-local',
      generatedAt: new Date().toISOString(),
      schemaVersion: 'v1',
    },
  }
}
