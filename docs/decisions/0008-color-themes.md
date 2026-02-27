# 색상 테마 구조

- **날짜**: 2026-02-26
- **상태**: 채택

## 배경

디자인 플레이그라운드 선택 결과(0007)에서 blue-orange, amber-cyan, dark-slate를 확정했다. 메인·서브·다크 세 가지 테마를 지원한다.

## 결정

| 테마 | id | 용도 |
|------|-----|------|
| 메인 | blue-orange | 기본 라이트 테마 |
| 서브 | amber-cyan | 대안 라이트 테마 |
| 다크 | dark-slate | 다크 테마 |

- `data-theme` 속성으로 html에 적용
- localStorage(`mylittlewebsite-theme`)에 사용자 선택 저장
- Layout 헤더에 테마 전환 버튼 (메인/서브/다크)

## 결과/참고

- `client/src/index.css`: [data-theme='blue-orange'], [data-theme='amber-cyan'], [data-theme='dark-slate']
- `client/src/shared/context/ThemeContext.tsx`: ThemeProvider, useTheme
- `client/src/shared/config/themes.ts`: THEME_OPTIONS
- `client/index.html`: 초기 로드 시 localStorage 기반 data-theme 설정 (플래시 방지)
- **테마 전환 애니메이션** (2026-02-27): `[data-theme] *`에 transition 적용 (background-color, color, border-color 등 0.4s ease). oklch 색상이 보간 시 자연스럽게 이어짐.
