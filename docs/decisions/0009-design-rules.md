# 디자인 룰

- **날짜**: 2026-02-26
- **상태**: 채택

## 배경

사이트를 확장하면서 일관된 디자인을 유지하기 위해 따라야 할 룰을 명시한다. AI·개발자가 UI 작업 시 참조한다.

## 1. 원칙

- **미니멀·프로페셔널**: 자료 정리·포트폴리오·기술 학습 목적에 맞는 톤
- **콘텐츠 우선**: 기술 과시보다 내용 전시
- **확장 가능**: 새 섹션·컴포넌트 추가 시 기존 룰과 조화

## 2. 색상

| 용도      | 값          |
| --------- | ----------- |
| 메인 테마 | blue-orange |
| 서브 테마 | amber-cyan  |
| 다크 테마 | dark-slate  |

- CSS 변수(`--primary`, `--background` 등) 사용. 하드코딩 지양
- 새 색 추가 시 `index.css` 테마 블록에 정의

### 토큰별 용도

| 토큰      | 용도 |
| --------- | ---- |
| **primary** | 메인 링크(기본), CTA, 포커스 링 |
| **secondary** | 호버, 강조(선택·활성 상태), 즐겨찾기, 배지, 보조 버튼 |
| **muted** | 비강조 텍스트, 배경 |

## 3. 타이포그래피

| 용도 | 폰트         |
| ---- | ------------ |
| 본문 | Noto Sans KR |
| 코드 | Consolas     |

- 제목: `text-3xl` ~ `text-5xl`, `font-bold` 또는 `font-semibold`
- 본문: `text-base` 또는 `text-lg`, `leading-relaxed`
- `tracking-tight` for 큰 제목

## 4. 레이아웃

- **컨테이너**: `max-w-6xl` 또는 `max-w-5xl`, `mx-auto`, `px-4 sm:px-6`
- **섹션 패딩**: `py-16` ~ `py-24` (히어로), `py-12` ~ `py-16` (일반)
- **여백**: 넉넉하게. `gap-4` ~ `gap-8` for 그리드/플렉스

## 5. 컴포넌트

- **카드**: `BentoCard` 또는 `rounded-2xl`, `border-border/60`, `shadow-sm`
- **버튼**: shadcn `Button`. variant는 `default`, `outline`, `ghost`, `secondary`
- **헤더**: `widgets/Header` 사용. 높이 `h-16`, 햄버거 → 좌측 사이드 메뉴
- **테마 토글**: pill 형태, `bg-muted/50`

## 6. 인터랙션

- **호버**: `transition-colors` 또는 `transition-all`, `hover-bg`·`hover-bg-card`·`hover-bg-card-lg`·`group-hover-bg` 유틸리티 사용 (index.css 한 곳에서 관리), `hover:text-secondary`
- **그림자**: `shadow-sm` 기본, 호버 시 `shadow-md`
- **애니메이션**: 300~700ms, `ease-out`

## 7. 네비게이션

- 대주제: `MAIN_NAV` config 기반
- 활성 표시: 밑줄(`border-b-2 border-secondary`) 또는 `text-secondary`
- 새 페이지 추가 시 `nav.ts`에 항목 추가

## 8. 참고 문서.

- `docs/decisions/0005-design-system-shadcn.md` - shadcn 채택
- `docs/decisions/0007-design-playground-result.md` - 플레이그라운드 선택
- `docs/decisions/0008-color-themes.md` - 테마 구조
- `docs/plans/2026-02-26-design-references.md` - 레퍼런스
