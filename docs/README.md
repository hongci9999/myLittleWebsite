# 프로젝트 기록 (docs)

프로젝트에 대한 체계적 기록. `.cursor/rules/docs-record.mdc` 규칙을 따른다.

| 경로                           | 용도                            |
| ------------------------------ | ------------------------------- |
| [CHANGELOG.md](./CHANGELOG.md) | 버전별 변경 내역                |
| [api-spec.md](./api-spec.md)   | REST API 명세                   |
| [mcp-guide.md](./mcp-guide.md) | MCP 연결 가이드 (사이트 `/mcp`) |
| [decisions/](./decisions/)     | 의사결정 기록 (ADR)             |
| [learnings/](./learnings/)     | 학습 내용 (개념·동작 방식 정리) |
| [error-fixes/](./error-fixes/) | 에러 픽스 기록 (오류·원인·수정) |
| [journal/](./journal/)         | 개발·학습 로그                  |
| [plans/](./plans/)             | 설계·구현 계획                  |

### 디바이스 AI (링크 자동 설명·분류)

유용한 링크·스크랩 등록 시 Gemini API가 제목·설명·태그를 자동 추천한다. (로컬 Ollama 선택지는 2026-10 제거)

| 항목      | 내용                                                                                                                                                                                                                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 연결 점검 | 클라이언트 `/ai-smoke-test`, API 헬스·Gemini YouTube 스모크 — [api-spec §9](./api-spec.md)                                                                                                                                                                                                                            |
| 서버 코드 | `server/src/services/ai/` ([구조 요약](learnings/0021-server-ai-prompt-provider-layout.md))                                                                                                                                                                        |
| Gemini    | 유일한 텍스트 제공자. `GEMINI_API_KEY`(또는 `GOOGLE_AI_API_KEY`), 선택 `GEMINI_MODEL` — [decisions 0016](decisions/0016-gemini-youtube-transcript-and-public-meta.md)                                                                                                                             |
| 유튜브    | InnerTube·caption track으로 메타+자막 추출 → AI에 텍스트 입력. 자막을 못 받으면(배포 환경 IP 차단) Gemini 영상 직접 분석 폴백 — [ADR 0026](decisions/0026-youtube-gemini-digest-fallback.md), [0038](learnings/0038-youtube-cloud-ip-block.md), [ADR 0021](decisions/0021-youtube-transcript-unified-ai-path.md), [0036](learnings/0036-youtube-content-bundle-transcript.md), npm 폴백 [0023](learnings/0023-youtube-transcript-cjs-load.md) |
| 관련 문서 | [설계](plans/2026-03-13-links-ai-suggest-design.md), [decisions 0012](decisions/0012-ollama-ai-links.md), [0015 구조·교체](decisions/0015-ai-text-provider-abstraction.md), [learnings 0018](learnings/0018-local-ai-ollama-webllm.md), [0021 레이아웃](learnings/0021-server-ai-prompt-provider-layout.md) |

### 칼럼 스크랩 AI (`POST /api/column-scraps/ai-fill`)

칼럼 스크랩 추가·편집 다이얼로그에서 **AI 채우기** 시 호출. URL 기준으로 페이지 fetch(단, X/Twitter는 제외) 후 Gemini로 제목·한 줄 요약·마크다운 본문·형식·표지(og:image)·태그를 채운다. 본문은 `## 요약` / `## 상세 정리` 구조와 다단계 프롬프트로 품질을 맞춘다.

| 항목         | 내용                                                                                                                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 관련 API     | [api-spec §7](api-spec.md)                                                                                                                                                                      |
| 의사결정     | [decisions 0014](decisions/0014-column-scraps-and-scrap-ux.md)                                                                                                                                  |
| 학습         | [0020](learnings/0020-column-scrap-markdown-youtube.md), [0036 유튜브 자막·메타](learnings/0036-youtube-content-bundle-transcript.md), [0037 Obsidian 클립 붙여넣기](learnings/0037-obsidian-youtube-clip-column-scrap.md) |
| 마이그레이션 | [column-scraps-migration](plans/2026-03-24-column-scraps-migration.sql), [x kind](plans/2026-03-24-column-scraps-add-x-kind.sql), [extra_links](plans/2026-03-24-column-scraps-extra-links.sql) |

### 사이트 지식 MCP (`POST /api/mcp`)

저장 자료(AI 도구·칼럼·게임 개발·유용한 링크)·원문·포트폴리오·개발 기록을 외부 AI가 읽는 읽기 전용 MCP 서버. 사용법 [mcp-guide.md](./mcp-guide.md), 설계 [ADR 0028](decisions/0028-site-knowledge-mcp.md), API [api-spec §13](api-spec.md), 원문 캐시 [scrap_sources SQL](plans/2026-10-13-scrap-sources.sql).

### 원클릭 저장 (`POST /api/quick-save`)

개인 크롬 확장에서 지금 탭을 버튼 하나로 분류·저장. 유튜브 자막은 브라우저에서 받아 보내 `scrap_sources`까지 채운다. 설계 [ADR 0029](decisions/0029-quick-save-pipeline.md), API [api-spec §14](api-spec.md).

### 사이트 대화창 (`POST /api/chat`)

화면 중앙 하단 입력창으로 사이트 자료를 자연어 검색. MCP 도구를 Gemini function calling에 재사용, 비로그인은 IP별 하루 10회. 설계 [ADR 0030](decisions/0030-site-chat-dock.md), API [api-spec §15](api-spec.md), 사용량 [chat_usage SQL](plans/2026-10-23-chat-usage.sql).

### 부트캠프 기록 (`/bootcamp`)

현대오토에버 모빌리티 SW스쿨 팀 프로젝트 5건의 기록. 본문은 DB `bootcamp_docs`, 슬라이드는 Supabase Storage `bootcamp` 버킷. 프로젝트 페이지 카드의 「기록 보기」로 진입하고, 대화창·MCP가 `get_project_record`로 전문을 읽는다. 올리기·갱신: `npm run import-bootcamp -w server -- <폴더>`. 설계 [ADR 0031](decisions/0031-bootcamp-docs.md), API [api-spec §17](api-spec.md), 스키마 [bootcamp SQL](plans/2026-10-26-bootcamp-docs.sql).

### AI 채우기 진행 표시

칼럼·게임 개발·AI 도구 「AI 채우기」 중 서버 단계(자막 → Gemini 영상 시청 → AI 1~3단계, 응답 시간)를 NDJSON 스트림으로 실시간 표시, 3초 heartbeat로 멈춤 구분. 헤더에 사용 중인 Gemini 모델. 설계 [ADR 0032](decisions/0032-ai-fill-progress-stream.md).

### 최근 계획

| 날짜                                                                  | 제목                                         |
| --------------------------------------------------------------------- | -------------------------------------------- |
| [2026-10-23](./plans/2026-10-23-chat-usage.sql)                       | 대화창 사용량 테이블 `chat_usage`            |
| [2026-10-13](./plans/2026-10-13-next-steps-plan.md)                   | 다음 작업: MCP 마무리·크롬 확장·사이트 대화창 |
| [2026-10-13](./plans/2026-10-13-scrap-sources.sql)                    | MCP 원문 캐시 테이블 `scrap_sources`          |
| [2026-07-23](./plans/2026-07-23-vercel-migration.md)                  | AWS → Vercel 단일 호스팅 이전 walkthrough    |
| [2026-06-22](./plans/2026-06-22-game-dev-library.md)                  | 게임 개발 도서관 구현 계획 (형식·분야 2축)   |
| [2026-06-22](./plans/2026-06-22-game-dev-resources-migration.sql)     | 게임 개발 도서관 테이블 마이그레이션         |
| [2026-05-04](./plans/2026-05-04-aws-first-deploy-walkthrough.md)     | 첫 AWS 배포 실습 가이드 (단계별)            |
| [2026-05-19](./plans/2026-05-19-api-subdomain-migration.md)         | API `api.` 서브도메인 이전 + 프론트 커스텀 도메인 |
| [2026-05-19](./plans/2026-05-19-site-domain-settings.sql)           | 메인 도메인 만료 알림 DB(`site_domain_settings`) |
| [2026-04-06](./plans/2026-04-06-geeknews-rss-widget-implementation.md) | 메인 GeekNews RSS 위젯 구현 계획            |
| [2026-04-08](./plans/2026-04-08-tarot-daily-widget-design.md) | 타로 오늘의 운세 위젯 디자인 |
| [2026-04-08](./plans/2026-04-08-tarot-daily-widget-implementation.md) | 타로 오늘의 운세 위젯 구현 계획 |
| [2026-04-01](./plans/2026-04-01-main-widget-section-refinement-design.md) | 메인 위젯 섹션 리디자인(구조 강조)          |
| [2026-03-24](./plans/2026-03-24-column-scraps-migration.sql)          | 칼럼 스크랩 테이블(통합 마이그레이션)        |
| [2026-03-24](./plans/2026-03-24-column-scraps-add-x-kind.sql)         | 칼럼 `source_kind`에 `x` 추가(기존 DB용)     |
| [2026-03-24](./plans/2026-03-24-column-scraps-extra-links.sql)        | 칼럼 `extra_links` 컬럼(기존 DB용)           |
| [2026-03-23](./plans/2026-03-23-featured-links-db-design.md)          | 즐겨찾기(메인 추천) DB 설계                  |
| [2026-03-13](./plans/2026-03-13-supabase-keepalive-github-actions.md) | Supabase Keep-Alive + GitHub Actions         |
| [2026-03-13](./plans/2026-03-13-links-ai-suggest-design.md)           | 링크 AI 자동 설명·분류                       |
| [2026-03-06](./plans/2026-03-06-favorite-links-design.md)             | 즐겨찾기 링크 위젯                           |
| [2026-03-03](./plans/2026-03-03-links-admin-design.md)                | 유용한 링크 페이지 + 사이트 전체 관리자 인증 |

### 의사결정 목록

- [0001 기술 스택](./decisions/0001-tech-stack.md)
- [0002 프로젝트 기초 구조](./decisions/0002-project-foundation.md)
- [0003 Superpowers 적용](./decisions/0003-superpowers.md)
- [0004 FSD 적용 전략](./decisions/0004-fsd-application-strategy.md)
- [0005 디자인 시스템 shadcn/ui](./decisions/0005-design-system-shadcn.md)
- [0006 디자인 플레이그라운드](./decisions/0006-design-playground.md)
- [0007 디자인 플레이그라운드 결과](./decisions/0007-design-playground-result.md)
- [0008 컬러 테마](./decisions/0008-color-themes.md)
- [0009 디자인 룰](./decisions/0009-design-rules.md)
- [0010 학습 폴더 config 자동 생성](./decisions/0010-learning-folder-config-generation.md)
- [0011 학습 기록 동적 섹션](./decisions/0011-learning-dynamic-sections.md)
- [0012 링크 AI: Ollama 서버 방식 채택](./decisions/0012-ollama-ai-links.md)
- [0013 메인 추천 링크 DB 저장](./decisions/0013-featured-links-db-storage.md)
- [0014 칼럼 스크랩·스크랩 목록 UX·마크다운 임베드](./decisions/0014-column-scraps-and-scrap-ux.md)
- [0015 서버 AI 텍스트 제공자 추상화·프롬프트 모듈화](./decisions/0015-ai-text-provider-abstraction.md)
- [0016 Gemini·유튜브 자막·공개 /api/meta](./decisions/0016-gemini-youtube-transcript-and-public-meta.md)
- [0017 타로 위젯 해석 스키마·제공자 전략](./decisions/0017-tarot-reading-schema-and-provider-strategy.md)
- [0018 프로덕션 호스팅 분리 (CloudFront + EB + API 도메인)](./decisions/0018-aws-production-split-hosting.md)
- [0019 메인 도메인 만료 알림·DB 갱신](./decisions/0019-site-domain-expiry-notice.md)
- [0020 목록 페이지 뒤로가기·링크 네비게이션 상태](./decisions/0020-list-page-navigation-state.md)
- [0021 유튜브 AI 요약 — 자막·메타데이터 통합 경로](./decisions/0021-youtube-transcript-unified-ai-path.md)
- [0022 칼럼 스크랩 Obsidian 유튜브 클립 붙여넣기](./decisions/0022-obsidian-youtube-clip-column-scrap.md)
- [0023 랜딩 페이지 셰이더 오로라 배경 (three.js)](./decisions/0023-animated-shader-landing.md)
- [0024 게임 개발 도서관 (형식·분야 2축 분류)](./decisions/0024-game-dev-library.md)
- [0025 Vercel 단일 호스팅으로 이전 (0018 대체)](./decisions/0025-vercel-single-hosting.md)
- [0026 유튜브 자막 fetch 실패 시 Gemini 영상 직접 분석 폴백](./decisions/0026-youtube-gemini-digest-fallback.md)
- [0027 유튜브 링크 일괄 등록 로컬 스크립트](./decisions/0027-bulk-youtube-import-script.md)
- [0028 사이트 지식 MCP 서버](./decisions/0028-site-knowledge-mcp.md)
- [0029 원클릭 저장 파이프라인 (개인 크롬 확장 + quick-save API)](./decisions/0029-quick-save-pipeline.md)
- [0030 사이트 대화창 (하단 입력창 + chat API, MCP 도구 재사용)](./decisions/0030-site-chat-dock.md)
- [0031 현대오토에버 부트캠프 기록 (DB 본문 + Storage 이미지 + /bootcamp)](./decisions/0031-bootcamp-docs.md)
- [0032 AI 채우기 진행 스트림 (NDJSON + AsyncLocalStorage, 헤더 모델 배지)](./decisions/0032-ai-fill-progress-stream.md)

### 학습 내용

**AWS 배포 학습 시리즈**(목차·읽는 순서): [0025 허브](./learnings/0025-aws-deployment-series-hub.md) — 공통 개념(0026) → 네트워크·HTTPS(0027) → AWS 계정·IAM(0028) → 정적 프론트(0029) → Node API(0030) → 연결·CORS(0031) → CI/CD(0032) → 운영·트러블슈팅(0033).

| 번호                                                         | 제목                                          | 태그                           |
| ------------------------------------------------------------ | --------------------------------------------- | ------------------------------ |
| [0001](./learnings/0001-npm-workspaces.md)                   | npm workspaces                                | 도구, 개발방법론               |
| [0002](./learnings/0002-superpowers.md)                      | Superpowers                                   | ai, 에이전트, 스킬, 개발방법론 |
| [0003](./learnings/0003-website-structure-terminology.md)    | 웹사이트 구조·UX 용어                         | 프론트, ux                     |
| [0004](./learnings/0004-feature-sliced-design.md)            | Feature-Sliced Design                         | 프론트, 개발방법론, 아키텍처   |
| [0005](./learnings/0005-shadcn-ui-setup.md)                  | shadcn/ui 적용 내역                           | 프론트, 도구                   |
| [0006](./learnings/0006-shadcn-ui-and-radix.md)              | shadcn/ui와 Radix UI                          | 프론트, 도구, ux               |
| [0007](./learnings/0007-design-playground.md)                | 디자인 플레이그라운드                         | 프론트, ux, 도구               |
| [0008](./learnings/0008-next-js-overview.md)                 | Next.js 개요 및 Vite 대비                     | 프론트, 아키텍처, 도구         |
| [0009](./learnings/0009-tailwindcss-typography.md)           | @tailwindcss/typography (Tailwind v4)         | 프론트, 도구                   |
| [0010](./learnings/0010-file-structure-pattern-index.md)     | 파일 구조형 패턴 학습 (목차)                  | 프론트, 아키텍처, 도구         |
| [0011](./learnings/0011-file-structure-recursive-types.md)   | 파일 구조형 패턴 Part 2: 재귀 타입            | 프론트, 아키텍처               |
| [0012](./learnings/0012-file-structure-path-resolution.md)   | 파일 구조형 패턴 Part 3: 경로 해석            | 프론트, 아키텍처               |
| [0013](./learnings/0013-file-structure-ui-integration.md)    | 파일 구조형 패턴 Part 4: UI 통합              | 프론트, 아키텍처               |
| [0014](./learnings/0014-file-structure-extending.md)         | 파일 구조형 패턴 Part 5: 확장 방법            | 프론트, 아키텍처               |
| [0015](./learnings/0015-backend-database-basics.md)          | 백엔드·데이터베이스 기초 (초보자용)           | 백엔드, 데이터베이스           |
| [0017](./learnings/0017-supabase.md)                         | Supabase 개요 및 이용 방법                    | 백엔드, 데이터베이스, 도구     |
| [0018](./learnings/0018-local-ai-ollama-webllm.md)           | 로컬 AI: Ollama와 WebLLM                      | ai, 백엔드, 프론트, 도구       |
| [0019](./learnings/0019-github-actions.md)                   | GitHub Actions 개요                           | 도구, 개발방법론, 백엔드       |
| [0020](./learnings/0020-column-scrap-markdown-youtube.md)    | 칼럼 스크랩 AI 파이프라인·마크다운 YouTube    | ai, 백엔드, 프론트, 도구       |
| [0021](./learnings/0021-server-ai-prompt-provider-layout.md) | 서버 AI 프롬프트 모듈·AiTextProvider 레이아웃 | ai, 백엔드, 아키텍처, 도구     |
| [0022](./learnings/0022-mermaid-diagram-basics.md)           | Mermaid 다이어그램 기초                       | 프론트, 도구, 개발방법론, 아키텍처 |
| [0023](./learnings/0023-youtube-transcript-cjs-load.md)      | youtube-transcript CJS require(tsx)           | ai, 백엔드, 도구, npm            |
| [0024](./learnings/0024-rss-basics.md)                       | RSS 개요와 활용 방법                          | 도구, 개발방법론, 백엔드         |
| [0025](./learnings/0025-aws-deployment-series-hub.md)        | AWS 배포 학습 시리즈 (허브·목차)               | 배포, aws, 인프라, 개발방법론, 도구 |
| [0026](./learnings/0026-deployment-common-concepts.md)      | 배포 공통 개념 (빌드·환경·정적 vs API)        | 배포, 개발방법론, 백엔드, 프론트, 아키텍처 |
| [0027](./learnings/0027-network-domain-https-for-deployment.md) | 네트워크·도메인·HTTPS (배포 맥락)           | 배포, 인프라, 프론트, 백엔드     |
| [0028](./learnings/0028-aws-account-region-iam-billing.md)   | AWS 계정·리전·IAM·과금                       | 배포, aws, 인프라, 도구, 개발방법론 |
| [0029](./learnings/0029-aws-static-frontend-vite-s3-cloudfront.md) | 정적 프론트(Vite) on AWS (S3·CloudFront) | 배포, aws, 프론트, 인프라, 도구 |
| [0030](./learnings/0030-aws-node-express-api-deployment.md)  | Node(Express) API on AWS                     | 배포, aws, 백엔드, 인프라, 도구   |
| [0031](./learnings/0031-frontend-backend-integration-cors.md) | 프론트·API 연결 (베이스 URL·CORS)          | 배포, 프론트, 백엔드, 인프라, 개발방법론 |
| [0032](./learnings/0032-cicd-github-actions-aws.md)          | CI/CD·GitHub Actions로 AWS 배포              | 배포, aws, 개발방법론, 도구, 백엔드 |
| [0033](./learnings/0033-aws-ops-security-troubleshooting.md) | AWS 운영·보안·트러블슈팅                     | 배포, aws, 인프라, 백엔드, 개발방법론 |
| [0034](./learnings/0034-aws-first-production-deploy-success.md) | 첫 AWS 프로덕션 배포 성공 회고 (2026-05) | 배포, aws, 인프라, 프론트, 백엔드, 개발방법론 |
| [0035](./learnings/0035-vite-src-asset-import-meta-url.md) | Vite src 내부 이미지·import.meta.url | 프론트, 도구, 배포, 개발방법론 |
| [0036](./learnings/0036-youtube-content-bundle-transcript.md) | YouTube 메타·자막 통합 추출 | ai, 백엔드, 도구 |
| [0037](./learnings/0037-obsidian-youtube-clip-column-scrap.md) | Obsidian 유튜브 클립·배포 AI 요약 | ai, 백엔드, 프론트, 도구 |
| [0038](./learnings/0038-youtube-cloud-ip-block.md) | 클라우드 IP 유튜브 자막 차단·우회 | ai, 백엔드, 배포, 도구 |

### 에러 픽스

| 번호                                                  | 제목                            |
| ----------------------------------------------------- | ------------------------------- |
| [0001](./error-fixes/0001-learning-folder-session.md) | 학습 폴더·config 관련 오류 모음 |
| [0002](./error-fixes/0002-main-widget-reload-cache.md) | 메인 위젯 페이지 이동 후 재로딩 문제 |
| [0003](./error-fixes/0003-aws-eb-cloudfront-cors-deploy.md) | EB Degraded·Mixed Content·CORS (AWS 배포) |
| [0004](./error-fixes/0004-tarot-deploy-image-paths.md) | 타로 위젯 배포 시 카드 이미지 미표시 |
| [0005](./error-fixes/0005-learning-production-split-hosting.md) | 학습 기록 프로덕션: 준비 중·목록 순서 깜빡임 |
| [0006](./error-fixes/0006-github-actions-eb-iam-deploy.md) | GitHub Actions EB 배포 IAM 권한 부족 |
| [0007](./error-fixes/0007-domain-renew-period-mismatch.md) | 도메인 연장 반영이 +3개월로 계산됨 |
| [0008](./error-fixes/0008-d2-helloworld-video-only-filter.md) | D2 Hello world 위젯이 최신 텍스트 글 대신 6월 영상 글 표시 |

**태그 목록** (DB·필터링용): `ai`, `에이전트`, `mcp`, `스킬`, `프론트`, `백엔드`, `알고리즘`, `개발방법론`, `아키텍처`, `도구`, `ux`, `데이터베이스` — 필요 시 확장
