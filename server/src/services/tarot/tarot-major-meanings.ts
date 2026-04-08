export type TarotOrientation = 'upright' | 'reversed'
export type TarotSlot = 'past' | 'present' | 'advice'

export type TarotMeaningEntry = {
  id: number
  name: string
  upright: string
  reversed: string
}

export const TAROT_MAJOR_MEANINGS: TarotMeaningEntry[] = [
  { id: 0, name: '바보', upright: '새로운 시작과 가벼운 도전', reversed: '충동과 준비 부족' },
  { id: 1, name: '마법사', upright: '의지와 실행력', reversed: '자원 분산과 자신감 저하' },
  { id: 2, name: '여사제', upright: '직감과 내면 통찰', reversed: '혼란과 직감 회피' },
  { id: 3, name: '여황제', upright: '풍요와 돌봄', reversed: '과보호와 안일함' },
  { id: 4, name: '황제', upright: '구조와 책임', reversed: '통제 과잉과 경직' },
  { id: 5, name: '교황', upright: '전통과 학습', reversed: '형식주의와 고집' },
  { id: 6, name: '연인', upright: '관계와 선택의 조화', reversed: '우유부단과 관계 긴장' },
  { id: 7, name: '전차', upright: '추진력과 돌파', reversed: '방향 상실과 조급함' },
  { id: 8, name: '힘', upright: '절제된 용기', reversed: '감정 소진과 인내 부족' },
  { id: 9, name: '은둔자', upright: '성찰과 정리', reversed: '고립과 결론 지연' },
  { id: 10, name: '운명의 수레바퀴', upright: '전환점과 흐름 변화', reversed: '변화 저항과 불안정' },
  { id: 11, name: '정의', upright: '균형과 공정한 판단', reversed: '편향과 책임 회피' },
  { id: 12, name: '매달린 사람', upright: '관점 전환과 유예', reversed: '정체와 답답함' },
  { id: 13, name: '죽음', upright: '종결과 재시작', reversed: '끝내지 못함과 집착' },
  { id: 14, name: '절제', upright: '조율과 회복', reversed: '극단과 리듬 붕괴' },
  { id: 15, name: '악마', upright: '욕망과 집착 인식', reversed: '관계/습관 해방 시도' },
  { id: 16, name: '탑', upright: '급격한 변화와 각성', reversed: '붕괴 회피와 불안 누적' },
  { id: 17, name: '별', upright: '희망과 회복', reversed: '의욕 저하와 회의감' },
  { id: 18, name: '달', upright: '불확실성과 감정 파동', reversed: '오해 해소의 시작' },
  { id: 19, name: '태양', upright: '명확함과 활력', reversed: '에너지 분산과 과신' },
  { id: 20, name: '심판', upright: '각성과 결단', reversed: '미루기와 자기 의심' },
  { id: 21, name: '세계', upright: '완성과 확장', reversed: '마무리 지연과 미완' },
]

export function getMeaningById(id: number): TarotMeaningEntry | null {
  return TAROT_MAJOR_MEANINGS.find((c) => c.id === id) ?? null
}
