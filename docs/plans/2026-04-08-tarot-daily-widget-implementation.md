# Tarot Daily Widget Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 메인 위젯에 3장 메이저 아르카나 타로 기능을 추가하고, 로컬/외부 API AI 경로 모두 동일한 해석 응답 포맷으로 제공한다.

**Architecture:** 클라이언트는 카드 추첨/애니메이션과 카드 선택 결과만 관리하고, 해석 생성은 서버 단일 엔드포인트로 위임한다. 서버는 `aiProvider(local|api)`에 따라 로컬 규칙 기반 해석기 또는 API LLM을 사용하되, 최종 응답은 공통 JSON 스키마로 정규화한다. API 응답이 스키마를 벗어나면 서버에서 재파싱/보정해 클라이언트에는 항상 일관된 형태만 반환한다.

**Tech Stack:** React + TypeScript (Vite), Node + Express + TypeScript, 기존 `AiTextProvider` 레지스트리 (`local|api`), CSS 3D transform

---

### Task 1: 타로 위젯 파일 스캐폴딩 및 에셋 경로 고정

**Files:**
- Create: `client/src/widgets/TarotDailyWidget/index.ts`
- Create: `client/src/widgets/TarotDailyWidget/TarotDailyWidget.tsx`
- Create: `client/src/widgets/TarotDailyWidget/model/types.ts`
- Create: `client/src/widgets/TarotDailyWidget/model/tarot-major.ts`
- Create: `client/src/widgets/TarotDailyWidget/model/tarot-draw.ts`
- Create: `client/src/widgets/TarotDailyWidget/ui/TarotCard.tsx`
- Create: `client/src/widgets/TarotDailyWidget/ui/TarotSpread.tsx`
- Create: `client/src/widgets/TarotDailyWidget/ui/tarot.css`
- Create: `client/src/widgets/TarotDailyWidget/assets/cards/back.png` (실제 이미지 수동 배치)
- Create: `client/src/widgets/TarotDailyWidget/assets/cards/major/major-00-fool.png` ... `major-21-world.png` (실제 이미지 수동 배치)

**Step 1: 타입/상수 최소 골격 작성**
- `TarotOrientation`, `TarotSlot`, `TarotCardUiState`, `TarotDrawCard` 타입을 정의한다.
- 22장 메타(`id`, `slug`, `labelKo`, `imagePath`)를 고정 배열로 선언한다.

**Step 2: 최소 빌드 확인**
- Run: `npm run build` (in `client`)
- Expected: PASS

**Step 3: Commit**
- `chore: 타로 위젯 파일 골격 추가`
- `(EN) Add tarot widget scaffolding files`

---

### Task 2: 3장 추첨 + 정/역방향 결정 로직

**Files:**
- Modify: `client/src/widgets/TarotDailyWidget/model/tarot-draw.ts`
- Test (manual): `client/src/widgets/TarotDailyWidget/model/tarot-draw.ts` (중복 없음/3장 고정 확인)

**Step 1: 실패 조건 먼저 정의(로컬 검증 함수)**
- 중복 카드가 있으면 throw 하는 개발용 검증 함수를 만든다.

**Step 2: 추첨 구현**
- Fisher-Yates 셔플로 22장 중 상위 3장 선택.
- 각 카드에 `orientation` 랜덤(`upright|reversed`) 부여.
- 슬롯 의미 고정: `past`, `present`, `advice`.

**Step 3: 검증 실행**
- Run: `npm run build` (in `client`)
- Expected: PASS
- 수동 점검: 연속 10회 호출 시 카드 중복 없음.

**Step 4: Commit**
- `feat: 타로 3장 추첨 및 정역방향 로직 추가`
- `(EN) Add three-card draw and orientation logic`

---

### Task 3: 카드 인터랙션 상태머신 구현

**Files:**
- Modify: `client/src/widgets/TarotDailyWidget/ui/TarotCard.tsx`
- Modify: `client/src/widgets/TarotDailyWidget/ui/TarotSpread.tsx`
- Modify: `client/src/widgets/TarotDailyWidget/ui/tarot.css`
- Modify: `client/src/widgets/TarotDailyWidget/TarotDailyWidget.tsx`

**Step 1: 초기 상태 UI**
- 뒷면 3장 `blur` 상태 + `운세보기` 버튼 배치.
- 버튼 전에는 카드 클릭 비활성 처리.

**Step 2: 카드별 상태 전이 구현**
- `idle-back -> spinning -> revealing -> revealed`
- 카드별 타이머/토큰으로 독립 제어.

**Step 3: 재클릭 즉시 오픈 구현**
- `spinning/revealing` 중 재클릭 시 해당 카드만 타이머 정리 후 `revealed` 강제 전환.

**Step 4: 빌드 및 수동 QA**
- Run: `npm run build` (in `client`)
- Expected: PASS
- QA: 3장 각각 연출 독립 동작, 중간 클릭 즉시 앞면 노출 확인.

**Step 5: Commit**
- `feat: 타로 카드 개별 연출과 즉시 오픈 UX 구현`
- `(EN) Implement per-card animation and instant reveal UX`

---

### Task 4: 메인 위젯 영역 통합

**Files:**
- Modify: `client/src/pages/MainPage.tsx`
- Modify: `client/src/shared/config/main-widgets.ts` (필요 시)

**Step 1: 위젯 삽입**
- 기존 메인 그리드에 `TarotDailyWidget` 추가.
- 레이아웃은 기존 `WidgetGrid` 스팬 규칙을 따름.

**Step 2: 빌드 확인**
- Run: `npm run build` (in `client`)
- Expected: PASS

**Step 3: Commit**
- `feat: 메인 페이지에 타로 운세 위젯 통합`
- `(EN) Integrate tarot widget into main page`

---

### Task 5: 공통 해석 응답 스키마 정의 (로컬/API 공통)

**Files:**
- Create: `server/src/services/ai/prompts/tarot-reading.prompts.ts`
- Create: `server/src/services/ai/suggest-tarot-reading.ts`
- Create: `server/src/services/tarot/tarot-major-meanings.ts`
- Create: `server/src/services/tarot/tarot-local-interpreter.ts`
- Modify: `server/src/services/ai/index.ts`

**Step 1: 공통 JSON 스키마 정의**
- 서버 내부 타입(예시):
  - `TarotReadingResponse`
  - `cards: [{ slot, majorId, name, orientation, keyMeaning, interpretation }]`
  - `overall: { summary, energy, caution, actionTip }`
  - `meta: { provider, modelLabel, generatedAt, schemaVersion }`

**Step 2: API 프롬프트 스키마 고정**
- 프롬프트에 "반드시 JSON만 반환" + 필수 키 명시.
- 기존 `stripMarkdownCodeFence` 재사용해 JSON 파싱.

**Step 3: 서버 정규화 계층**
- API 결과 누락 필드는 기본값으로 보정.
- 순서/문자열 길이/배열 개수(3장) 강제.
- 최종적으로 클라이언트에는 동일 타입만 반환.

**Step 4: 타입 체크**
- Run: `npm run build` (in `server`)
- Expected: PASS

**Step 5: Commit**
- `feat: 타로 해석 공통 응답 스키마와 정규화 계층 추가`
- `(EN) Add unified tarot reading schema and normalization`

---

### Task 6: 로컬 해석 규칙 엔진 구현 (일관 포맷 보장)

**Files:**
- Modify: `server/src/services/tarot/tarot-local-interpreter.ts`
- Modify: `server/src/services/tarot/tarot-major-meanings.ts`

**Step 1: 카드 의미 사전 작성**
- 22장에 대해 `upright`/`reversed` 핵심 의미 키워드 작성.

**Step 2: 해석 규칙 정의**
- 슬롯별 문맥:
  - `past`: 현재 흐름에 영향을 준 배경
  - `present`: 오늘의 핵심 에너지
  - `advice`: 실천 가능한 조언
- 역방향은 "지연/내면화/과잉" 축으로 변형 규칙 적용.

**Step 3: 종합 문장 생성 규칙**
- 3장 관계를 묶어 `summary`, `caution`, `actionTip` 생성.
- 과도한 단정(운명 확정형) 문구 금지.

**Step 4: 타입 체크**
- Run: `npm run build` (in `server`)
- Expected: PASS

**Step 5: Commit**
- `feat: 로컬 타로 해석 규칙 엔진 구현`
- `(EN) Implement local rule-based tarot interpreter`

---

### Task 7: 타로 해석 API 라우트 추가

**Files:**
- Create: `server/src/routes/tarot.ts`
- Modify: `server/src/index.ts` (라우트 등록)

**Step 1: 엔드포인트 정의**
- `POST /api/tarot/reading`
- 입력: `aiProvider`, `cards[3]` (`majorId`, `orientation`, `slot`)
- 출력: `TarotReadingResponse`

**Step 2: 제공자 분기**
- `parseAiRequestPreference` 사용.
- `local`이면 규칙 엔진, `api`면 `AiTextProvider` + 프롬프트.

**Step 3: 에러 표준화**
- 요청 포맷 오류 400
- API 키/로컬 모델 준비 오류 503
- 기타 500

**Step 4: 빌드 확인**
- Run: `npm run build` (in `server`)
- Expected: PASS

**Step 5: Commit**
- `feat: 타로 해석 API 라우트 추가`
- `(EN) Add tarot reading API route`

---

### Task 8: 클라이언트 해석 API 연결 및 결과 표시

**Files:**
- Create: `client/src/shared/api/tarot.ts`
- Modify: `client/src/widgets/TarotDailyWidget/TarotDailyWidget.tsx`
- Modify: `client/src/widgets/TarotDailyWidget/ui/TarotSpread.tsx`

**Step 1: API 클라이언트 작성**
- 기존 `aiProviderRequestHeaders`, `aiProviderBodyField` 사용.
- 서버 스키마와 동일한 TS 타입 선언.

**Step 2: 3장 공개 완료 후 해석 호출**
- 카드 3장 모두 `revealed`일 때 1회 호출.
- 로딩/실패 상태 표시 추가.

**Step 3: 결과 표시 UI**
- 슬롯별 해석 + 종합 요약 + 실천 팁 영역.
- 로컬/API 어느 쪽이든 화면 렌더링 구조 동일.

**Step 4: 빌드 및 린트**
- Run: `npm run build` (in `client`)
- Expected: PASS
- Run: `npm run lint` (in `client`)
- Expected: PASS

**Step 5: Commit**
- `feat: 타로 위젯에 AI 해석 결과 연결`
- `(EN) Connect AI tarot interpretation to widget`

---

### Task 9: 문서화 및 기록 업데이트

**Files:**
- Modify: `docs/CHANGELOG.md`
- Modify: `docs/journal/2026-04.md`
- Create: `docs/decisions/0017-tarot-reading-schema-and-provider-strategy.md` (번호는 최신 기준 재확인)
- Modify: `docs/README.md` (필요 시)

**Step 1: ADR 작성**
- 결정 주제:
  1) 타로 에셋을 위젯 내부 캡슐화
  2) 해석은 서버 단일 API + 공통 응답 스키마
  3) local(api fallback 아님) / api를 동등 제공자로 취급

**Step 2: changelog/journal 반영**
- 변경 이유(why) 중심으로 기록.

**Step 3: 문서 품질 확인**
- 날짜/형식 규칙 준수 확인.

**Step 4: Commit**
- `docs: 타로 위젯 및 해석 전략 문서화`
- `(EN) Document tarot widget and interpretation strategy`

---

## 해석 방식 세부 원칙 (로컬/API 공통 적용)

1. **스프레드 의미 고정:** `past / present / advice`
2. **카드 의미 계층:**
   - 기본 의미(카드 고유)
   - 방향 보정(정/역)
   - 슬롯 문맥 보정
3. **문체 규칙:**
   - 단정형 예언 금지, 가능성/선택 중심 문장
   - 실천 가능한 행동 한 줄 포함
4. **안전장치:**
   - 건강/법률/투자 등 고위험 조언은 회피 문구로 완화
5. **출력 길이 가이드:**
   - 카드별 해석 2~3문장
   - 종합 요약 2문장
   - actionTip 1문장

---

## 검증 체크리스트

- 클라이언트:
  - 카드 중복 추첨 없음
  - 애니메이션 중 재클릭 즉시 오픈
  - API 실패 시 오류 UI가 깨지지 않음
- 서버:
  - local/api 모두 동일 JSON 키셋 반환
  - 잘못된 입력(카드 3장 아님, orientation 오타) 400 처리
  - AI 원문이 비정형이어도 정규화 후 응답 성공 또는 명확한 에러 반환

---

## 실행 순서 권장

1) Task 1~4 (UI/인터랙션 완성)  
2) Task 5~7 (서버 해석 계약/로컬+API)  
3) Task 8 (연결)  
4) Task 9 (문서/ADR)
