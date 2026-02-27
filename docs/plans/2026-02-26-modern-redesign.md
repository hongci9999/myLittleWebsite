# 웹사이트 모던 리디자인

날짜: 2026-02-26
상태: 적용 완료

## 목적

자료 정리·포트폴리오·기술 학습용 개인 사이트에 최신 트렌드 반영. 기존 색상 테마(blue-orange, amber-cyan, dark-slate) 유지.

## 디자인 방향 (2024-2025 트렌드)

- **Bento/그리드**: 비대칭 카드 레이아웃, 시각적 리듬
- **여백**: 넉넉한 패딩, 시선 흐름
- **깊이감**: 부드러운 그림자, 얇은 테두리
- **타이포그래피**: 명확한 계층, 볼드 헤딩
- **헤더**: 스티키 + 블러(glassmorphism)
- **마이크로 인터랙션**: 호버 시 transform, transition

## 적용 내용

- index.css: radius 0.75rem, shadow 변수, smooth scroll, font-smoothing
- Layout: sticky header, backdrop-blur-md, 통합 네비(홈+대주제+테마)
- MainPage: 히어로 섹션, bento grid(인트로 카드 + 4개 바로가기)
- LandingPage: 큰 타이포그래피, "시작하기" CTA
- Card: rounded-xl, border-border/60, shadow-sm
