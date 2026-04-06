# Changelog

[Keep a Changelog](https://keepachangelog.com/) 형식.

## [Unreleased]

### Added

- **링크 AI: 분류 태그(`valueIds`) 자동 제안** — `POST /api/links/ai-suggest`가 DB 분류 축·값 카탈로그를 프롬프트에 넣고, 검증된 id만 응답; `LinkForm`에서 기존 선택에 병합
- **연결 테스트** — 페이지 `/ai-smoke-test`, `GET /api/health`(Vite 프록시용), `GET /api/ai-smoke/local`(Ollama tags + 짧은 generate)
- **클라이언트 AI 제공자 기본 설정** — `shared/lib/ai-provider-preference.ts`: `localStorage` + 요청 헤더 `X-AI-Provider` + POST 본문 `aiProvider`(프록시 환경 대비)

- **서버 AI: Gemini(Google) 텍스트 제공자**
  - API 모드: `X-AI-Provider: api` 또는 JSON `aiProvider: "api"`, `GEMINI_API_KEY` 또는 `GOOGLE_AI_API_KEY`, 선택 `GEMINI_MODEL`
  - `server/src/services/ai/providers/gemini-text-provider.ts`, 레지스트리 `getAiTextProvider(preference)` 분기
  - 의사결정: [0016](decisions/0016-gemini-youtube-transcript-and-public-meta.md), 학습: [0023](learnings/0023-youtube-transcript-cjs-load.md)
- **유튜브 URL → 자막 텍스트 병합** (`youtube-transcript`, `createRequire`로 CJS 로드)
  - `fetchWebsiteContent`에 자막 병합·`youtubeMissingTranscript` 플래그
  - 링크 AI 제안·칼럼 스크랩·AI 도구 스크랩 AI 경로: 유튜브인데 자막 없으면 400(고정 안내 메시지)
- **공개 `GET /api/meta`**
  - 응답 `ai: { local, api }` — 각각 `mode`·`label`(모델·호스트 요약), 헤더 제공자 UI·툴팁용
- **헤더 AI 상태** (`AiStatusTicker`)
  - 닫힌 상태: 「로컬 AI」/「API」만 표시. 클릭 시 드롭다운으로 전환, `localStorage` 저장(기본 로컬). 상세 라벨은 툴팁·메뉴

- **메인 위젯 섹션 벤토 그리드 기초 적용**
  - `WidgetGrid` 추가: `/main` 위젯 영역을 12컬럼 기반 그리드로 관리
  - `main-widget-layout` 설정 추가: 위젯별 `col-span`/`row-span` 배치 메타 분리
  - `EmptyPlaceholderWidget` 추가: 우측 7x7 슬롯을 임시 위젯으로 시각화
- **GeekNews 최신 위젯 추가**
  - 메인 빈 슬롯을 `오늘의 GeekNews` 위젯으로 교체, 최신 5개 노출
  - 서버 API `GET /api/geeknews/latest?limit=5` 추가
  - RSS 파싱(`item`/`entry`) + 메모리 캐시 TTL 적용
- **RSS 학습 문서 추가/보강**
  - `learnings/0024-rss-basics.md` 추가
  - GeekNews 위젯 적용 사례와 구현 포인트 정리
- **에러 픽스 문서 추가**
  - `error-fixes/0002-main-widget-reload-cache.md` 추가
  - 메인 위젯 페이지 이동 후 재로딩 이슈 원인/수정/재사용 패턴 기록
- **메인 위젯 섹션 리디자인 계획 문서**
  - `docs/plans/2026-04-01-main-widget-section-refinement-design.md` 추가
  - 구조 강조(벤토 리듬·위계·상태 일관성) 방향으로 개선 범위/검증 기준 정리

- **칼럼 스크랩 (`column_scraps`)**
  - DB: `source_kind`에 `x`(X/트위터), `extra_links` JSONB(라벨+URL 배열). 신규: `docs/plans/2026-03-24-column-scraps-migration.sql`, 기존 DB: `2026-03-24-column-scraps-add-x-kind.sql`, `2026-03-24-column-scraps-extra-links.sql`
  - API: `GET/POST/PATCH/DELETE /api/column-scraps`, `GET .../by-slug/:slug`, `POST .../ai-fill`(인증, 로컬 Ollama로 폼 자동 채움)
  - 서버: `fetch-website`에 `og:image` 추출(표지용), `ollama.suggestColumnScrapFromUrl` — HTML 심층 분석 → JSON 필드, 본문 짧으면 확장 재생성; X/Twitter는 fetch 생략(오류 HTML 오염 방지)
  - 클라이언트: `/column`, `/column/:slug`, `ColumnScrapAdminDialog`, 목록 카드 그리드·필터·⋮ 메뉴(편집·삭제), 상세에 추가 링크·유튜브 형식 임베드(기존)
  - 마크다운: `MarkdownWithMath`에서 본문 내 YouTube `href`면 iframe(nocookie) + 링크
  - decisions 0014, learnings 0020, `docs/api-spec.md` §6·§7 스크랩 API
- **AI 개발도구 목록 UX**
  - `AiDevToolsPage`: 행 우측 ⋮ 메뉴로 편집·삭제; `AiToolScrapAdminDialog`에서 하단 「전체 목록」 제거(목록은 페이지에서만)
- **공통 `OverflowMenu`** (`client/src/shared/ui/OverflowMenu.tsx`)
  - 세로 점 메뉴, 바깥 클릭 닫힘, 카드 클릭과 분리(`stopPropagation`)
- **칼럼·AI 개발도구 목록·상세 좌우 여백**
  - `px-5 sm:px-8 md:px-10` 등으로 가독성 개선
- **링크 관리 페이지 · 태그 관리**
  - `/links/admin`에서 「링크 관리」 / 「태그 관리」 전환
  - 목적(purpose)·종류(medium): 상위 태그 추가, 이름 수정, 삭제, 목적은 하위 태그 추가
  - API: `PATCH /api/links/values/:valueId`, `DELETE /api/links/values/:valueId`, `POST /values`에 `parentId`(목적만) 지원
  - 위젯: `widgets/LinksTagManager`
- **즐겨찾기 링크 DB 전환 (사이트 대표 추천)**
  - `links` 테이블: `is_featured`, `featured_sort_order` 컬럼 추가
  - `GET /api/links/featured` (공개): 메인 추천 링크 목록
  - 관리자만 메인 추천 토글 (Links 페이지 별 아이콘, Links 관리 LinkForm 체크박스)
  - FavoriteLinksWidget: API 조회로 전환, "메인 추천 링크" 문구
  - decisions 0013: DB 저장 방식 채택
  - 마이그레이션: `docs/plans/2026-03-23-featured-links-migration.sql`

### Changed

- **AI 제공자 라우팅** — 전역 `AI_TEXT_PROVIDER` 환경 변수 단일 분기 제거. 요청마다 `X-AI-Provider` / `aiProvider`로 Ollama·Gemini 선택(미지정 시 로컬)
- **기본 Ollama 모델** — `gemma4` (`DEFAULT_OLLAMA_MODEL`, `ollama-text-provider.ts` + 레지스트리 메타)
- **Vite 개발 서버 `/api` 프록시** — 대상 `127.0.0.1`, 장시간 AI 채우기용 `proxyReq.setTimeout(600_000)`
- **문서** — 루트/README, `docs/README`, `docs/api-spec`(메타·헬스·스모크·ai-suggest·ai-fill), decisions [0012](decisions/0012-ollama-ai-links.md), learnings [0020](learnings/0020-column-scrap-markdown-youtube.md)

- **메인 위젯 섹션 UI 조정**
  - `FavoriteLinksWidget`: 헤더 영역 축소, 제목 톤을 회색 계열로 조정, 로딩 스켈레톤/포커스 스타일 정리
  - 링크 타이틀 hover 시 전체 글자색이 바뀌던 동작 제거(가독성/일관성 개선)
  - 문구 정리: "메인 추천 링크" → "즐겨찾기 링크"
  - 우측 빈 슬롯을 GeekNews 위젯으로 전환
- **메인 위젯 데이터 로딩 방식 개선**
  - 페이지 이동 후 메인 복귀 시 위젯이 매번 재로딩되는 문제를 완화
  - 공통 캐시 유틸 `shared/lib/resource-cache.ts` 추가
  - `FavoriteLinksWidget`, `GeekNewsWidget`에 캐시 우선 렌더 + 중복 요청 방지 적용
- **메인 히어로 정리**
  - `Hero`의 미사용 `introWidget` 참조 제거 (타입체크 오류 예방)
- **그리드 셀 크기 동기화 방식 개선**
  - `WidgetGrid`에서 `ResizeObserver` 기반으로 셀 단위 크기를 계산해 열/행 1칸 스케일을 동일하게 적용

- **서버 AI 제안 코드 구조** (`server/src/services/ai/`)
  - `AiTextProvider` + Ollama 구현(`createOllamaTextProvider`) + `getAiTextProvider()` 레지스트리
  - 기능별 프롬프트 객체: `prompts/link-meta`, `column-scrap`, `ai-tool-scrap`
  - 유스케이스: `suggest-link-meta`, `suggest-column-scrap`, `suggest-ai-tool-scrap`; `services/ollama.ts`는 라우트 호환 재export
  - decisions [0015](decisions/0015-ai-text-provider-abstraction.md), learnings [0021](learnings/0021-server-ai-prompt-provider-layout.md)
- **스크랩 관리 다이얼로그 피드백**
  - `ColumnScrapAdminDialog`·`AiToolScrapAdminDialog`: 인라인 `message` state 제거, 저장·AI 채우기 실패 시 `window.alert`
- **칼럼 스크랩 AI 채우기 품질**
  - 1단계 분석 분량·항목 확대(주제·사실·구조·독자·활용·한계)
  - `summary`(한 줄)와 `bodyMd`(`## 요약` / `## 상세 정리`) 구조 명시, 상세 분량 목표(1200자+ 등)
  - 본문이 짧게 나오면 심층 분석 기반으로 마크다운 본문만 한 번 더 생성하는 폴백
- **스크랩 관리 다이얼로그**
  - `ColumnScrapAdminDialog`·`AiToolScrapAdminDialog`: 하단 「전체 목록」 제거 → 편집·삭제는 목록 페이지 ⋮ 메뉴에서만
  - 동 다이얼로그: AI 자동 입력 버튼 문구 「AI 채우기」 등 정리

### Added (이전)

- **Supabase Keep-Alive + GitHub Actions**
  - Supabase 무료 티어 7일 비활성 정지 방지
  - `keepalive` 전용 테이블 (id, pinged_at), REST API로 5일마다 조회
  - `.github/workflows/supabase-keepalive.yml` cron 스케줄
  - GitHub Secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY` 필요
  - 설계: `docs/plans/2026-03-13-supabase-keepalive-github-actions.md`
  - 학습: `docs/learnings/0019-github-actions.md`
- **링크 AI 자동 설명·분류 구현**
  - POST /api/links/ai-suggest: Ollama(lfm2:24b) 호출, **URL만** 있어도 제목·설명·태그 추천
  - LinkForm (widgets): 링크 추가·수정 공통 폼, AI로 채우기, 진행 상태(URL 전송→AI 분석→완료) 시각화
  - AddLinkDialog: LinksPage 검색창 "추가", LinksAdminPage "새 링크 추가" → 팝업
  - LinksAdminPage: LinkForm으로 수정 폼 통합
- **태그 추가·분류 (목적/종류)**
  - POST /api/links/values: dimensionSlug(purpose|medium) 필수, 목적 또는 종류에 새 태그 생성
  - LinkForm: 목적·종류 각각 "새 태그" 입력 + 추가 버튼
  - AI suggest: suggestedLabels에 dimension 포함, 새 태그는 지정 dimension에 생성
  - custom 축 태그 → 종류 마이그레이션: `docs/plans/2026-03-13-migrate-custom-tags-to-purpose.sql`
- **AI 링크 추천 2단계 분석**
  - 1단계: 웹사이트 fetch(cheerio) → AI가 사이트 내용 분석
  - 2단계: 분석 결과를 바탕으로 제목·설명·태그 생성
  - fetch 실패 시 URL만으로 기존 방식 폴백
- **AI 분석 결과 보기**: LinkForm에서 "AI 분석 결과 보기" 버튼 → Dialog로 원시 응답 표시
- **링크 AI 자동 설명·분류 설계**
  - 설계: `docs/plans/2026-03-13-links-ai-suggest-design.md`
  - decisions 0012: Ollama 서버 방식 채택 ADR
  - 옵션: WebLLM(브라우저), Ollama(클라이언트/서버) 비교
  - 추천: Ollama 서버 방식 (어느 PC에서 접속해도 동작, AWS 배포 시 동일)
  - learnings 0018: Ollama, WebLLM 기술 상세
- **학습 기록 동적 폴더 스캔** (1번 방식)
  - 서버: `server/src/config/learning-sections.ts` 섹션 정의, `services/learning-scan.ts` 런타임 스캔
  - API: `GET /sections` DB 우선 → config 폴백, `GET /sections/:id` DB 우선 → 폴더 스캔 폴백
  - 클라이언트: API에서 섹션 목록 조회, `learning/:sectionId/*` 동적 라우팅
  - `.md` 폴더 추가 시 빌드 없이 즉시 목록 반영
  - `decisions 0011` - 학습 기록 동적 섹션 (새 섹션 추가 방법)
- **즐겨찾기 링크 위젯** (→ 2026-03 DB 전환으로 변경됨)
  - 유용한 링크 페이지: 링크 카드에 별 아이콘, 클릭 시 즐겨찾기 토글
  - 메인 페이지: 위젯 영역에 즐겨찾기 링크 표시, 없으면 "즐겨찾기 링크 없습니다"
  - `useFavoriteLinks` 훅 (DB 전환 시 제거), `FavoriteLinksWidget`
- **유용한 링크 페이지 + 사이트 전체 관리자 인증**
  - 설계: `docs/plans/2026-03-03-links-admin-design.md`, 구현 계획, 스키마·RLS SQL
  - 인증: Supabase Auth, JWT 기반 서버 검증, Remember Me, `/login` 전용 페이지
  - 링크 API: `GET/POST/PATCH/DELETE /api/links`, `GET /api/links/dimensions` (공개/인증 분리)
  - 라우트: `/links` (목록), `/links/admin` (CRUD), `/admin` (관리자 허브), `/login`
  - 분류: 축(dimension) + 계층형 값(목적·종류), 필터·검색·정렬
- **학습 폴더 DB API** (Phase 2·3)
  - 서버: Supabase 연동 (`db/supabase.ts`, `db/queries/learning.ts`), `GET /api/learning/sections`, `/sections/:sectionId`
  - 클라이언트: `fetchLearningSection()` API 호출, API 실패 시 config 폴백
  - env 선행 로드 (`server/src/env.ts`), dotenv
- **에러 픽스 기록** - `docs/error-fixes/` 폴더, 오류·원인·수정 방법 정리
  - 0001: 학습 폴더·config 관련 (EADDRINUSE, env 로드, API 폴백, config 자동생성, 99_노트 children)
- **학습 폴더 config 자동 생성** - `scripts/build-learning-config.mjs`, `npm run build:learning-config`
  - `public/learnings/정처기` 폴더 스캔 → `learning-info-engineer.ts` 자동 생성 (95개 md 반영)
- **decisions 0010** - 학습 폴더 config 자동 생성
- **파일 구조형 패턴 재귀화** - 깊이 제한 없이 확장 가능
  - `FileStructureNode`: children(재귀) 또는 docs
  - `FileStructureBrowserPage`: splat 라우트로 node-list/doc-list/doc 통합
  - `resolveFileStructurePath()`: 경로 기반 재귀 해석
  - 라우트: `learning/info-engineer/*` (splat)
- **학습자료 페이지 - 정보처리기사 프로토타입** (Phase 1 MVP)
  - 파일 구조형 3단계 네비게이션: `/learning` → `/learning/info-engineer` → `/learning/info-engineer/:categoryId` → 문서 뷰어
  - `FileListItem` 공통 컴포넌트: 가로 전체 직사각형, 세로 배치, 제목·부가설명
  - Learning* 페이지는 FileStructure* 래퍼로 전환
  - 샘플 md: `client/public/learnings/정처기/01_소프트웨어설계/` (sdlc.md, uml.md)
- **헤더 breadcrumb** - 파일 경로 형태 (`myLittleWebsite / 학습자료 / 정보처리기사 / ...`)
  - `useBreadcrumb` 훅, 경로별 클릭 가능 링크
- **@tailwindcss/typography** - prose 클래스로 마크다운 본문 스타일링

### Changed

- **링크 카드 UI**
  - 표시 순서: 제목 → 태그 → 설명 → URL
  - 태그: 목적/종류 구분 표시, 알약 크기 축소 (text-[10px], rounded-full)
  - 설명: 폰트 축소(text-xs), 더보기 버튼(호버 시 전문 툴팁)
  - URL: 카드 하단, 매우 작게(text-[9px])
- **AI 링크 추천 프롬프트**
  - 제목: 사이트 이름(브랜드명)만, 설명 아님
  - 설명: 문어체, "이 사이트는" 등 구어체 금지
  - 종류 태그 필수 포함, 웹사이트와 무관한 태그 금지
- **헤더 관리자 링크**
  - '관리' → '관리자 페이지' (로그인 시), shadcn Button variant="outline" size="sm" 적용
  - 브레드크럼 `/admin` 경로: '관리' → '관리자 페이지'
- **디자인 룰 (0009)** - 토큰별 용도·호버 기준
  - primary: 메인 링크(기본), CTA, 포커스 링
  - secondary: 호버, 강조(선택·활성), 즐겨찾기, 배지
  - 인터랙션: `hover:border-secondary/20`, `hover:text-secondary`
  - 네비게이션 활성: `border-secondary`, `text-secondary`
- **유용한 링크 페이지 색상** - 새 룰에 맞춰 secondary 적용
  - 필터 칩 선택: `bg-secondary`, 미선택 호버: `hover:text-secondary`
  - 링크 카드·제목·즐겨찾기 별 호버: secondary
  - 로딩 스피너: `border-secondary`
- **다크 모드(dark-slate) secondary**
  - `oklch(0.35 0.05 260)` → `oklch(0.6 0.1 260)` (호버 텍스트 가독성)
  - secondary-foreground: `oklch(0.1 0 0)` (배경 사용 시 대비)
- **유용한 링크 페이지 레이아웃**
  - 검색창: 상단 중앙 고정 (`sticky top-16`), pill 스타일
  - 좌측 사이드바(lg+): 태그 선택, 정렬, 링크 관리, 필터 초기화
  - 모바일: 상단에 필터·정렬·링크관리 한 줄 배치
- **링크 관리 페이지 UI**
  - 로그아웃: LinksAdminPage에서 제거 → AdminPage로 이동
  - 추가 폼: 버튼 제거, 상단에 항상 노출(새 링크 추가/링크 수정)
  - pill 스타일 입력·버튼, rounded-xl 폼
- **유용한 링크·링크 관리 디자인**
  - pill 검색·필터 칩, 카드 호버 lift, 외부 링크 아이콘
  - 레퍼런스: `docs/plans/2026-02-26-design-references.md` §4 링크/북마크 UI
- **학습 문서 뷰어(DocViewer)** - 읽기용 디자인 개선
  - 최적 읽기 폭 65ch, 줄간격 1.75, 본문 0.9375rem
  - 제목(h1~h4) 계층·여백·구분선, 인용문·코드블록·테이블 스타일
  - 문서 제목 상단 배치, "← 목록" 버튼 스타일 조정
- **바로가기(RightSidebar)** - 플로팅 패널로 전환
  - 고정 사이드바 → 오른쪽 세로 중앙 플로팅 (fixed right-0 top-1/2)
  - 메인 영역 `lg:pr-40`로 플로팅 영역 침범 방지
  - 버튼·아이콘 크기 축소 (w-40, compact 스타일)
- **헤더** - 로고+라벨 → breadcrumb 형태로 전환, text-xl font-semibold 유지
- **FileListItem** - 왼쪽 패딩(pl-12), 높이(py-6), 폰트(text-lg), 부가설명 제목 하단 배치
- **학습자료 페이지** - 카드 그리드 → 파일 구조형 풀폭 리스트로 전환

- **디자인 플레이그라운드** (`/design-playground`) - 폰트·색상·컴포넌트 스타일 실시간 비교·결정 도구
  - 폰트: 본문 7종, 코드 8종
  - 색상 테마: 복수 선택 가능, 20+ 테마 (light, dark, warm, cool, forest, navy 등)
  - 모서리·그림자·트랜지션
  - 컴포넌트 미리보기: Button, Card, 선택지(단일/다중/토글), 메뉴, 코드블록, 입력칸, 타이포그래피(굵기·줄간격·제목/본문 크기), 탭, 배지, 토글, 페이지네이션, 프로그레스, 토스트, 드롭다운
  - 선택 결과 마크다운 복사 (AI 전달용)
- **About 페이지** - 사이트 소개, 디자인 플레이그라운드 링크 추가

- **랜딩 페이지** - 스크롤 기반 표어 애니메이션 ("끊임없이 배워나가는..."), 홈 버튼으로 메인 이동
- **메인 허브** - About/Portfolio/Blog 카드 그리드, config 기반 확장 가능
- **플레이스홀더 페이지** - About, Portfolio, Blog (준비 중)
- **ESLint + Prettier** - .prettierrc, .prettierignore, eslint-config-prettier, 루트 format/format:check 스크립트
- **react-refresh 규칙 전역 비활성화** - shadcn 컴포넌트(컴포넌트+variants export) 패턴 허용
- **Superpowers 프로젝트 전용 설치** - .cursor/skills/superpowers 클론, superpowers-bootstrap.mdc 룰 (이 프로젝트에서만 적용)
- learnings 0002 보강: 수동 설치 CLI (PowerShell 경로 수정, 프로젝트 전용 방법 C), Bootstrap 역할·출처
- **파일 구조형 패턴 학습 자료** (learnings 0010~0014)
  - Part 1: 배경·목표·아키텍처 개요
  - Part 2: 재귀 타입 (FileStructureNode, ResolveResult)
  - Part 3: 경로 해석 (resolveFromNodes 재귀)
  - Part 4: UI 통합 (FileStructureBrowserPage, splat 라우트)
  - Part 5: 확장 방법 (새 섹션, 깊은 중첩)
- **docs/learnings/** - 학습 내용 정리용 (개념·동작 방식)
- docs-record 룰에 learnings 규칙 추가
- learnings 0001: npm workspaces 동작 방식, 0002: Superpowers 에이전트 워크플로우
- **client/** - Vite + React + TypeScript 프론트엔드 (components, pages, hooks, utils)
- **server/** - Express + TypeScript 백엔드 (routes, controllers, services, db)
- 루트 package.json - npm workspaces, concurrently로 client/server 동시 실행
- .gitignore - node_modules, dist, env, 로그 등
- 프로젝트 핵심 원칙 룰 (foundation.mdc) - 이유 기반, 자기서술, 확장성
- Git 작업 규칙 (git.mdc) - Conventional Commits, 브랜치 전략, Windows 한글 인코딩
- 기술 스택·폴더 구조 룰 (stack-structure.mdc) - React, Node, Supabase
- 프로젝트 기록 룰 (docs-record.mdc) - CHANGELOG, ADR, journal
- docs/ 폴더 및 초기 구조 (CHANGELOG, decisions, journal)
- 의사결정 기록: 0001 기술 스택, 0002 프로젝트 기초 구조, 0003 Superpowers 적용

### Changed

- **Hero 섹션 패딩** - md 뷰포트에서 상·하 패딩 56px → 27px (`md:py-14` → `md:py-[27px]`)
- **테마 전환 애니메이션** - oklch 색상이 자연스럽게 이어지도록 `index.css`에 transition 적용 (background-color, color, border-color, box-shadow, fill, stroke, 0.4s ease)

### Fixed

- **학습 콘텐츠 미표시** - API가 빈 nodes 반환 시 config 폴백 (`LearningBrowserPage` hasNodes 체크)
- **md 문서 일부만 표시** - config 하드코딩(sdlc, uml 2개) → 폴더 스캔 스크립트로 전체 자동 생성
- **99_노트 하위 누락** - `scanDir` 반환값(객체)을 배열처럼 사용하던 버그 수정
