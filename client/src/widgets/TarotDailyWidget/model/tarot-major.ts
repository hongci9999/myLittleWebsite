import type { TarotMajorCard } from './types'

const BASE = '/src/widgets/TarotDailyWidget/assets/cards/major'

export const TAROT_MAJOR_CARDS: TarotMajorCard[] = [
  { id: 0, slug: 'fool', labelKo: '바보', imagePath: `${BASE}/0.png` },
  { id: 1, slug: 'magician', labelKo: '마법사', imagePath: `${BASE}/1-4.png` },
  { id: 2, slug: 'high-priestess', labelKo: '여사제', imagePath: `${BASE}/2.png` },
  { id: 3, slug: 'empress', labelKo: '여황제', imagePath: `${BASE}/3.png` },
  { id: 4, slug: 'emperor', labelKo: '황제', imagePath: `${BASE}/4.png` },
  { id: 5, slug: 'hierophant', labelKo: '교황', imagePath: `${BASE}/5.png` },
  { id: 6, slug: 'lovers', labelKo: '연인', imagePath: `${BASE}/6.png` },
  { id: 7, slug: 'chariot', labelKo: '전차', imagePath: `${BASE}/7.png` },
  { id: 8, slug: 'strength', labelKo: '힘', imagePath: `${BASE}/8.png` },
  { id: 9, slug: 'hermit', labelKo: '은둔자', imagePath: `${BASE}/9.png` },
  { id: 10, slug: 'wheel-of-fortune', labelKo: '운명의 수레바퀴', imagePath: `${BASE}/10.png` },
  { id: 11, slug: 'justice', labelKo: '정의', imagePath: `${BASE}/11.png` },
  { id: 12, slug: 'hanged-man', labelKo: '매달린 사람', imagePath: `${BASE}/12.png` },
  { id: 13, slug: 'death', labelKo: '죽음', imagePath: `${BASE}/13.png` },
  { id: 14, slug: 'temperance', labelKo: '절제', imagePath: `${BASE}/14.png` },
  { id: 15, slug: 'devil', labelKo: '악마', imagePath: `${BASE}/15.png` },
  { id: 16, slug: 'tower', labelKo: '탑', imagePath: `${BASE}/16.png` },
  { id: 17, slug: 'star', labelKo: '별', imagePath: `${BASE}/17.png` },
  { id: 18, slug: 'moon', labelKo: '달', imagePath: `${BASE}/18.png` },
  { id: 19, slug: 'sun', labelKo: '태양', imagePath: `${BASE}/19.png` },
  { id: 20, slug: 'judgement', labelKo: '심판', imagePath: `${BASE}/20.png` },
  { id: 21, slug: 'world', labelKo: '세계', imagePath: `${BASE}/21.png` },
]
