# 목록 페이지 뒤로가기·링크 네비게이션 상태

날짜: 2026-06-03
상태: 채택

## 배경 (왜 이 결정이 필요한가)

칼럼·AI 도구·링크 모음 목록에서 상세(또는 다른 화면)로 갔다가 브라우저 뒤로가기를 쓰면 검색·필터·스크롤이 초기화되었다. 목록 카드가 `div` + `navigate()`였기 때문에 휠 클릭(새 탭)도 동작하지 않았다.

## 결정 (무엇으로 했는지)

1. **내부 상세 이동** — React Router `<Link to="...">` 사용(칼럼·AI 도구 카드).
2. **검색·필터** — URL 쿼리(`?q=`, `?kind=`, 링크는 차원 slug별 ID 목록 등)에 동기화. 필터 변경은 `replace: true`로 히스토리 항목을 덮어 상세 진입 전 목록 URL 한 칸만 남긴다.
3. **스크롤** — 목록 언마운트 시 `sessionStorage`에 Y 저장, 재진입·데이터 로드 후 `useListPageScrollRestore`로 복원.

공용: `client/src/shared/hooks/useListPageScrollRestore.ts`, `client/src/shared/lib/list-page-url.ts`.

## 이유 (다른 선택지를 배제한 이유)

- **전역 state(Context/Zustand)** — 라우트 언마운트와 무관하게 유지되지만, 새로고침·URL 공유·뒤로가기와 브라우저 기본 동작과 어긋남.
- **목록·상세 중첩 라우트(Outlet 유지)** — 스크롤·state 유지에 유리하나 라우트·레이아웃 변경 범위가 큼.
- **URL만** — 필터·검색은 복원되나 스크롤은 히스토리 API만으로는 SPA 재마운트 시 불안정해 sessionStorage 보조.

## 결과/참고

- 적용 페이지: `/column`, `/ai-dev-tools`, `/links`
- 링크 모음 카드는 외부 URL `<a>` 유지(이미 중클릭 가능). 이번 작업은 필터·스크롤 복원이 주 목적.
