import type { TarotInputCard } from '../../tarot/tarot-local-interpreter.js'
import { getMeaningById } from '../../tarot/tarot-major-meanings.js'

export const TarotReadingPrompts = {
  build(cards: TarotInputCard[]): string {
    const lines = cards
      .map((c, i) => {
        const m = getMeaningById(c.majorId)
        const name = m?.name ?? `카드-${c.majorId}`
        return `${i + 1}. slot=${c.slot}, majorId=${c.majorId}, name=${name}, orientation=${c.orientation}`
      })
      .join('\n')

    return `다음 3장(메이저 아르카나) 타로 카드 정보를 "하루치 운세" 관점으로 해석하고 JSON만 출력하세요.

규칙:
- 스프레드 순서: past, present, advice
- 해석 초점: "오늘 하루를 어떻게 시작하고, 운영하고, 마무리할지"에 집중
- 단정적인 예언 문체 금지. 가능성과 선택 중심 문체 사용
- 카드별 interpretation은 2~3문장
- 메이저 아르카나의 상징성(원형, 교훈, 태도 변화)을 위치 의미에 대입해 해석
- 고정 스키마 외 텍스트 금지

위치별 해석 방법(필수):
- past(어제의 영향 / Past Influence):
  - 질문: "어제(또는 최근)에서 이어진 습관·감정·에너지가 오늘에 어떤 배경으로 작동하는가?"
  - 오늘을 돕는 점/방해하는 점을 균형 있게 제시
- present(오늘의 핵심 / The Core):
  - 질문: "오늘 하루 가장 강하게 작동시켜야 할 마음가짐과 태도는 무엇인가?"
  - 이 슬롯은 "오늘의 운세 핵심"이므로 가장 구체적으로 작성
- advice(성장의 메시지 / The Advice-Outcome):
  - 질문: "오늘의 에너지를 잘 활용했을 때 어떤 깨달음이 남는가? 하루를 어떻게 정리/마무리할까?"
  - 결과 예언보다, 실천 가능한 정리 행동을 제안

문체 가이드:
- 한국어 자연문으로 작성
- 과장된 신비주의/공포 유도/운명 확정 표현 금지
- "오늘"이라는 시간 범위를 반복적으로 분명히 표시

입력 카드:
${lines}

반드시 아래 JSON 형식으로만 답하세요:
{
  "cards": [
    {
      "slot": "past",
      "majorId": 0,
      "name": "카드명",
      "orientation": "upright",
      "keyMeaning": "핵심 의미",
      "interpretation": "해석"
    },
    {
      "slot": "present",
      "majorId": 1,
      "name": "카드명",
      "orientation": "reversed",
      "keyMeaning": "핵심 의미",
      "interpretation": "해석"
    },
    {
      "slot": "advice",
      "majorId": 2,
      "name": "카드명",
      "orientation": "upright",
      "keyMeaning": "핵심 의미",
      "interpretation": "해석"
    }
  ],
  "overall": {
    "summary": "오늘 하루 전체 흐름 요약",
    "energy": "오늘 가장 강하게 써야 할 에너지",
    "caution": "오늘 특히 주의할 패턴",
    "actionTip": "오늘 바로 실행할 1가지 행동"
  }
}`
  },
} as const
