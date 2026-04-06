# GeekNews RSS Widget Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 메인 페이지의 빈 위젯을 GeekNews 최신 5개 항목 위젯으로 교체하고, 서버 RSS 프록시 API로 안정적으로 데이터를 제공한다.

**Architecture:** 서버가 GeekNews RSS(Atom/RSS) 피드를 읽어 정규화한 뒤, 메모리 캐시(TTL)로 외부 요청 부담을 줄인다. 클라이언트는 `/api/geeknews/latest`를 호출해 위젯에 로딩/에러/빈 상태를 포함해 렌더링한다. 위젯 배치는 기존 `MAIN_WIDGET_LAYOUT` 구조를 유지해 확장성을 보장한다.

**Tech Stack:** Node.js + Express + TypeScript, Cheerio(XML 파싱), React + TypeScript

---

### Task 1: 서버 GeekNews RSS API 추가

**Files:**
- Create: `server/src/services/geeknews-rss.ts`
- Create: `server/src/routes/geeknews.ts`
- Modify: `server/src/index.ts`

**Step 1: 테스트 가능 단위 설계**
- RSS 항목 정규화 타입(`GeekNewsItem`) 정의
- 피드 URL/TTL 환경 변수 기본값 정의
- limit(1~20) 가드 정책 정의

**Step 2: RSS 파싱/캐시 구현**
- `fetchGeekNewsLatest(limit)`에서 RSS 다운로드 및 XML 파싱
- `title/link/publishedAt` 정규화 + 중복/누락 필드 방어
- 메모리 캐시 TTL 적용

**Step 3: API 라우트 구현**
- `GET /api/geeknews/latest?limit=5`
- 쿼리 파싱 실패 시 400
- 외부 fetch 실패 시 503, 기타 500

**Step 4: 서버 라우트 등록**
- `server/src/index.ts`에 `/api/geeknews` 라우트 연결

**Step 5: 검증**
- Run: `npm run build` (in `server`)
- Expected: TypeScript build 성공

### Task 2: 클라이언트 GeekNews 위젯 추가

**Files:**
- Create: `client/src/shared/api/geeknews.ts`
- Create: `client/src/widgets/GeekNewsWidget/GeekNewsWidget.tsx`
- Modify: `client/src/pages/MainPage.tsx`
- Modify: `client/src/shared/config/main-widget-layout.ts`

**Step 1: API 호출 모듈 추가**
- `fetchGeekNewsLatest(limit)` 구현
- 서버 응답 타입 매핑

**Step 2: 위젯 UI 구현**
- 카드 타이틀: `오늘의 GeekNews`
- 로딩 스켈레톤, 빈 상태, 에러 메시지 포함
- 최신 5개 링크 외부 새 탭 이동

**Step 3: 메인 페이지에 위젯 연결**
- 기존 `empty-placeholder`를 `geeknews-latest`로 교체
- 레이아웃 크기는 기존 빈 위젯 영역 유지

**Step 4: 검증**
- Run: `npm run build` (in `client`)
- Expected: TypeScript + Vite build 성공

### Task 3: 문서 동기화

**Files:**
- Modify: `docs/journal/2026-04.md`
- Modify: `docs/README.md` (필요 시)

**Step 1: 작업 로그 기록**
- 오늘 날짜 섹션에 변경 이유/내용/다음 단계 추가

**Step 2: decisions 점검**
- 이번 변경이 구조적 장기 결정인지 확인
- 필요 시 `docs/decisions` 추가, 아니면 journal에 "결정 추가 없음" 명시

**Step 3: 최종 검증**
- Run: `npm run build` (server/client)
- Run: `ReadLints` for edited files
- Expected: 오류 없이 완료
