export type TarotOrientation = 'upright' | 'reversed'

export type TarotSlot = 'past' | 'present' | 'advice'

export type TarotCardUiState = 'idle-back' | 'spinning' | 'revealing' | 'revealed'

export type TarotMajorCard = {
  id: number
  slug: string
  labelKo: string
  imagePath: string
}

export type TarotDrawCard = {
  slot: TarotSlot
  card: TarotMajorCard
  orientation: TarotOrientation
  uiState: TarotCardUiState
}
