# 디자인 시스템: shadcn/ui

- **날짜**: 2026-02-23
- **상태**: 채택

## 배경 (왜 이 결정이 필요한가)

프론트엔드 UI 컴포넌트·스타일링을 위한 디자인 시스템이 필요했다. 여러 후보(shadcn/ui, MUI, Radix, Chakra 등)를 비교한 뒤 선택했다.

## 결정 (무엇으로 했는지)

**shadcn/ui**를 디자인 시스템으로 채택한다.

## 이유 (다른 선택지를 배제한 이유)

- **Copy-paste**: 코드를 프로젝트에 복사해 소유. 번들 의존성 없음, 완전 커스터마이징
- **Tailwind + Radix**: Tailwind로 스타일, Radix로 접근성·동작
- **학습·확장**: foundation의 extensibility와 맞음. 필요한 컴포넌트만 추가 가능

## 결과/참고

- 디자인 시스템 비교 페이지는 삭제함 (결정 완료)
- shadcn/ui 적용 완료: Tailwind v4, Button 컴포넌트, Neutral 테마 (다크 모드)
