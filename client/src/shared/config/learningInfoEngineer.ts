/**
 * 정보처리기사 학습 자료 인덱스 (프로토타입)
 * Phase 2에서 DB/정적 JSON로 대체 예정
 */
export interface LearningDoc {
  slug: string
  title: string
  /** public/learnings/정처기 기준 상대 경로 */
  filePath: string
}

export interface LearningCategory {
  id: string
  name: string
  description?: string
  docs: LearningDoc[]
}

export const INFO_ENGINEER_CATEGORIES: LearningCategory[] = [
  {
    id: '01_소프트웨어설계',
    name: '소프트웨어 설계',
    description: 'SDLC, UML, 요구공학 등',
    docs: [
      {
        slug: 'sdlc',
        title: '소프트웨어 개발 생명주기(SDLC) 및 방법론',
        filePath: '01_소프트웨어설계/sdlc.md',
      },
      {
        slug: 'uml',
        title: 'UML',
        filePath: '01_소프트웨어설계/uml.md',
      },
    ],
  },
  {
    id: '02_소프트웨어개발',
    name: '소프트웨어 개발',
    description: '자료구조, 알고리즘, 테스트 등',
    docs: [],
  },
  {
    id: '03_데이터베이스구축',
    name: '데이터베이스 구축',
    description: 'ERD, SQL, 정규화 등',
    docs: [],
  },
  {
    id: '04_프로그래밍언어활용',
    name: '프로그래밍 언어 활용',
    description: 'C, Python, 객체지향 등',
    docs: [],
  },
  {
    id: '05_정보시스템구축관리',
    name: '정보시스템 구축관리',
    description: '통신, 보안, 프로토콜 등',
    docs: [],
  },
  {
    id: '99_노트',
    name: '노트',
    description: '기출·복습 노트',
    docs: [],
  },
]

export const BASE_PATH = '/learnings/정처기'
