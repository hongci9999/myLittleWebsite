# 랜딩 페이지 & 메인 허브 디자인

날짜: 2026-02-25
상태: 채택

## 배경

본격적인 디자인 적용. 언제든 바뀔 수 있고 확장 가능한 구조를 전제로 한다.

## 요구사항

1. **랜딩 페이지** (`/`)
   - 스크롤 기반 애니메이션: 문구가 스크롤할수록 순서대로 페이드인
   - 표어: "끊임없이 배워나가는, 끝없이 확장해나가는, 결국 인간을 위하는 개발자"
   - 마지막에 홈 버튼 → 메인 페이지로 이동

2. **메인 페이지** (`/main`)
   - 여러 페이지로 넘어갈 수 있는 허브
   - 기본 세트: About, Portfolio, Blog(Journal)

## 결정

| 항목 | 선택 | 이유 |
|------|------|------|
| 라우팅 | `/` = 랜딩, `/main` = 메인 허브 | 분리 명확, 확장 용이 |
| 스크롤 애니메이션 | Intersection Observer | 의존성 없음, 가벼움 |
| 메인 허브 레이아웃 | 카드 그리드 | 시각적 구분, 확장 용이 |

## 아키텍처

### 라우팅 구조

```
/           → LandingPage (스크롤 애니메이션, 홈 버튼)
/main       → MainPage (허브: About, Portfolio, Blog 카드)
/about      → AboutPage (플레이스홀더)
/portfolio  → PortfolioPage (플레이스홀더)
/blog       → BlogPage (플레이스홀더)
```

### 랜딩 페이지 구조

- 전체 스크롤 가능한 단일 페이지
- 표어 3문장을 각각 별도 섹션으로 배치
- 각 섹션: 뷰포트 진입 시 Intersection Observer로 `opacity` + `transform` 애니메이션
- 마지막 섹션: "홈" 버튼 → `Link to="/main"`

### 메인 허브 구조

- 카드 그리드: About, Portfolio, Blog
- 각 카드: 제목, 짧은 설명, 링크
- config/metadata 기반으로 확장 가능 (새 페이지 = config 추가)

### 확장성

- 페이지 목록: `shared/config/nav.ts` 또는 `pages/index` 형태로 중앙화
- 새 페이지 추가 시: config에 항목 추가 + Route + 페이지 컴포넌트

## 결과/참고

- 구현 계획: `docs/plans/2026-02-25-landing-and-main.md`
