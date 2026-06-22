# 게임 개발 도서관 (형식·분야 2축 분류)

- **날짜**: 2026-06-22
- **상태**: 채택

## 배경 (왜 이 결정이 필요한가)

게임 개발 정보(방법론·이론·기술·프로그램 등)를 한곳에 모으는 전용 공간이 필요했다. 정보의 출처 형식이 유튜브·기사·Git 저장소·블로그글·문서 등으로 다양하고, 동시에 그래픽스·물리·AI 같은 **분야별로 명확히 구분**되어 탐색되길 원했다. 기존 「AI 개발 도구 스크랩북」(`ai_tool_scraps`)과 성격이 비슷하지만, 도메인이 다르고 분야 구분이라는 새 요구가 있었다.

## 결정 (무엇으로 했는지)

- 검증된 ai-scraps 풀스택 패턴을 **별도 도메인으로 복제**해 새 테이블 `game_dev_resources` + Express 라우트/쿼리(`/api/game-dev-resources`) + React 목록/상세 페이지 + 관리자 다이얼로그(Context)를 만들었다.
- **2축 분류**를 채택했다.
  - **형식** `mediaKind`: `youtube`·`article`·`repo`·`blog`·`doc`·`book`·`other` (종류 필터)
  - **분야** `category`: `graphics`·`physics`·`ai`·`gameplay`·`engine`·`network`·`sound`·`optimization`·`etc` — **1급 필드**(NOT NULL, CHECK 제약, 인덱스)
- 분야 UI는 목록 페이지(`/game-dev`) 좌측의 **분야 네비 사이드바**(전체 + 9개 분야)로 명확히 구분하고, 모바일에서는 `<select>`로 대체했다. 선택은 `?category=<slug>` URL 쿼리로 반영해 형식·검색 필터와 공존한다.
- 세부 키워드는 보조 자유 태그로 분리했다. 상단 네비(`nav.ts`)·우측 바로가기(`shortcuts.ts`)에 노출했다.

## 이유 (다른 선택지를 배제한 이유)

- **분야를 자유 태그로만 처리**: 손쉽지만 표기가 흔들리고(렌더링 vs 그래픽스 등) 명확한 좌측 네비 구분을 만들기 어렵다. 1급 컬럼 + CHECK 제약 + 인덱스로 일관성과 탐색성을 확보했다.
- **기존 `ai_tool_scraps`를 일반화해 재사용**: 단일 테이블로 통합하면 도메인이 섞이고, 검증된 기존 기능을 건드려 리스크가 생긴다. 칼럼 스크랩과 AI 도구가 이미 같은 패턴을 병렬로 두고 있으므로(0014 참고), 저위험 복제를 택했다.
- **AI 채우기(Ollama/Gemini) 포함**: MVP에서는 제외했다. 게임 개발용 프롬프트 복제 등 추가 작업이 필요해 Phase 2로 미뤘다.

## 결과/참고

- 마이그레이션: `docs/plans/2026-06-22-game-dev-resources-migration.sql` (Supabase SQL Editor에서 수동 실행 필요, RLS: 공개 SELECT + 인증 INSERT/UPDATE/DELETE).
- 신규 클라이언트: `widgets/GameDevCategoryNav`(재사용 분야 네비), `pages/GameDevLibraryPage`·`GameDevResourceDetailPage`, `widgets/GameDevAdminDialog`, `shared/context/GameDevAdminDialogContext`, `shared/api/game-dev.ts`.
- 분야 slug↔라벨은 `CATEGORY_OPTIONS`(클라)·`CATEGORY` CHECK(DB)·`Category` 유니온(서버/클라)에서 동일하게 유지한다. 추가 시 세 곳을 함께 갱신할 것.
- 계획 문서: `docs/plans/2026-06-22-game-dev-library.md`. 관련 의사결정: [0014 칼럼 스크랩·스크랩 UX](0014-column-scraps-and-scrap-ux.md).
