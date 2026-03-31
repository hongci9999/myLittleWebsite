# 메인 위젯 테트리스(벤토) 배치 설계·구현 계획

> **For Claude:** 구현 시 `@superpowers:executing-plans` 또는 `@superpowers:subagent-driven-development`로 태스크 단위 실행.

**Goal:** 메인(`/main`)에서 날씨·오늘의 운세·추천 링크 등 **서로 다른 기능의 위젯을 한 화면에 “테트리스처럼” 격자에 맞춰 배치**하고, 뷰포트·콘텐츠에 따라 자연스럽게 쌓이도록 한다.

**Architecture:** 위젯은 **등록 가능한 슬롯(메타데이터 + 컴포넌트)** 으로 두고, 레이아웃은 **CSS Grid(또는 선택 시 라이브러리)** 로 `col-span` / `row-span`을 미리 정의해 “블록” 느낌을 낸다. 데이터는 위젯별로 API·정적 설정·기존 서버 연동을 분리한다.

**Tech Stack:** React, TypeScript, Tailwind, 기존 `BentoCard`, Vite 클라이언트 / Express 서버(날씨 등은 **서버 프록시** 권장으로 API 키 보호).

**관련 문서:** [메인 위젯 섹션 UI 디자인 계획](./2026-03-31-main-widget-section-ui-design.md) — 그리드 여백, 카드 패밀리, 위젯별 시각 방향, 로딩/접근성.

---

## 현재 상태 (코드베이스)

| 위치 | 내용 |
| --- | --- |
| `client/src/pages/MainPage.tsx` | `FavoriteLinksWidget`, `AiDevToolsOverviewWidget`를 **세로 스택** (`space-y-6`, `max-w-4xl`) |
| `client/src/shared/config/main-widgets.ts` | Hero용 `intro` 메타만 존재 |
| `client/src/widgets/RightSidebar/RightSidebar.tsx` | **바로가기** 전용 (날씨/운세 없음) |
| 날씨·운세 | 앱 코드 내 **미구현** (목표 위젯으로 신규) |

---

## 설계 결정 포인트 (선택지)

### 1) 레이아웃 구현 방식

| 접근 | 장점 | 단점 |
| --- | --- | --- |
| **A. CSS Grid + Tailwind** (`grid-cols-12`, 위젯별 `sm:col-span-*`) | 의존성 없음, 디자인 룰과 잘 맞음, LCP 유리 | “진짜 테트리스” 자동 채움은 수동 정의 |
| **B. react-grid-layout 등** | 드래그·리사이즈(나중에 편집 모드) | 번들·복잡도 증가, 모바일 별도 설계 필요 |
| **C. Masonry** | 높이 다른 카드 나열 | “격자에 딱 맞는 블록” 느낌은 Grid보다 약함 |

**권장:** **1단계는 A** — “테트리스”는 **미리 정의된 span 조합**으로 표현하고, 나중에 편집 UI가 필요하면 B를 부분 도입.

### 2) 위젯 정의 방식

- **설정 파일 기반** (`shared/config/main-widget-layout.ts` 등): `id`, `order`, `gridSpan`(반응형), `enabled`.
- 각 위젯은 `widgets/<Name>/`에 두고, **페이지는 레지스트리만 순회**해 `<BentoCard>` 래핑 + 그리드 셀 배치.

### 3) 데이터·보안

- **날씨:** 공개 API 키를 클라이언트에 두지 않도록 **서버 라우트**에서 캐시(예: 10~30분) 후 JSON 반환.
- **운세:** 외부 API 또는 **고정 문구 + 날짜 시드 랜덤**(개인 사이트면 후자로도 충분). ADR 후보.

### 4) 반응형

- 모바일: **1열 스택** (span 무시 또는 모두 `col-span-full`).
- `md` 이상: 12컬럼 그리드로 span 적용.
- `RightSidebar` 너비(`lg:pr-40`)와 겹침 없이 `max-w-6xl` 등 [디자인 룰](docs/decisions/0009-design-rules.md) 정렬.

---

## 단계별 로드맵

### Phase 0 — 합의·문서

- [ ] 레이아웃 방식 A/B 확정
- [ ] 위젯 MVP 목록 확정 (예: 추천 링크, AI 도구 요약, 날씨, 운세 중 우선순위)
- [ ] 필요 시 `docs/decisions/`에 “메인 벤토 그리드 + 위젯 레지스트리” ADR 추가

### Phase 1 — 레이아웃 뼈대 (기능 추가 없이 구조만)

1. `MainPage`를 **그리드 컨테이너**로 교체 (`grid`, `gap`, `auto-rows-min` 등).
2. 기존 `FavoriteLinksWidget`, `AiDevToolsOverviewWidget`에 **span 클래스만 부여**해 2열/비대칭 배치 시범.
3. `main-widget-layout` 설정 타입 정의 (`WidgetLayoutItem`).

### Phase 2 — 위젯 슬롯화

1. 레지스트리: `id` → `component` lazy import 맵.
2. `MainPage`에서 설정 배열 map 렌더 (비활성 위젯 스킵).
3. 스켈레톤/로딩은 카드 단위로 통일.

### Phase 3 — 신규 위젯

**날씨**

- 서버: `GET /api/weather?lat=&lon=` 또는 도시 고정, 메모리/간단 캐시.
- 클라이언트: 작은 카드 UI (온도, 아이콘, 위치).

**오늘의 운세**

- 가벼운 버전: JSON 한 줄 또는 배열에서 **오늘 날짜 해시로 1개 선택**.
- 확장: 외부 API 연동.

### Phase 4 — 폴리시

- 키보드 포커스 순서(`tab` 순)가 그리드 읽는 순서와 일치하는지 확인.
- 다크 모드·카드 스타일 `BentoCard` 일관성.
- CHANGELOG / journal 항목.

---

## 구현 태스크 (요약)

### Task 1: 타입 + 레이아웃 설정

**Files:**

- Create: `client/src/shared/config/main-widget-layout.ts`
- Modify: `client/src/pages/MainPage.tsx`

**내용:** `WidgetLayoutItem` (`id`, `colSpan`/`rowSpan` 반응형 객체 또는 `className` 슬롯), 기존 두 위젯 id 부여.

### Task 2: `WidgetGrid` 프레젠테이션 컴포넌트

**Files:**

- Create: `client/src/widgets/WidgetGrid/WidgetGrid.tsx` (또는 `shared/ui`)

**내용:** `children` 또는 `items`를 받아 12컬럼 그리드에 배치. 모바일 단일 열.

### Task 3: 날씨 API (서버)

**Files:**

- Create: `server/src/routes/weather.ts` (예시)
- Modify: 서버 진입점에 라우트 등록

**내용:** 환경변수 API 키, 캐시 헤더 또는 in-memory TTL.

### Task 4: `WeatherWidget` + (선택) `FortuneWidget`

**Files:**

- Create: `client/src/widgets/WeatherWidget/`, `FortuneWidget/`
- Modify: `main-widget-layout`에 항목 추가

---

## 테스트·검증

- `npm run build` (client) — 타입·번들 오류 없음.
- 브라우저: `/main`에서 `sm` / `md` / `lg` 뷰포트에서 격자 붕괴 없음.
- 네트워크 탭: 날씨 요청이 **클라이언트→자체 API**만 호출하는지 확인.

---

## 오픈 이슈 (구현 전 결정 권장)

1. **운세 콘텐츠** — 외부 API vs 자체 문구 vs 사용자 입력?
2. **날씨 위치** — 고정 도시 vs 브라우저 Geolocation(권한 UX)?
3. **편집 가능 그리드** — 1차 출시에 포함할지, Phase 4 이후로 미룰지?

---

## 실행 옵션 (문서 완료 후)

1. **같은 세션에서 서브에이전트/태스크 단위 구현** — `@superpowers:subagent-driven-development`
2. **별도 세션 + executing-plans** — `@superpowers:executing-plans`

원하는 쪽을 정하면 Task 1부터 순서대로 진행하면 된다.
