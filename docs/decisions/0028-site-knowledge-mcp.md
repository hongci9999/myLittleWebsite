# 사이트 지식 MCP 서버 — 저장 자료·포트폴리오를 AI 답변에 쓰기

날짜: 2026-10-13  
상태: 채택 (`scrap_sources` 테이블 생성·백필 전)

## 배경 (왜 이 결정이 필요한가)

- 사이트에 모은 자료(AI 개발 도구·칼럼·게임 개발, 136건 — 이후 유용한 링크 36건 추가)가 쌓이기만 하고 AI 작업에 쓰이지 않는다. "이 작업엔 어떤 도구가 맞아?", "이 칼럼 내용으로 프로젝트 하자" 같은 질문에 저장 자료를 근거로 답하게 하고 싶다.
- 이 사이트가 포트폴리오이므로 자기소개서 작성 때 프로젝트·자기소개·개발 기록을 참조하게 하고 싶다.
- 나중에 사이트 안 대화창(방문자 공개)도 같은 정보를 쓰게 할 계획이다.

## 결정 (무엇으로 했는지)

1. **같은 Express 앱에 `POST /api/mcp`** — Streamable HTTP, stateless(요청마다 서버·transport 생성). Vercel 서버리스에서 그대로 동작하고 Redis가 필요 없다.
2. **인증 없음, 읽기 전용** — 노출 데이터가 모두 이미 사이트에 공개돼 있다. claude.ai·ChatGPT 웹 커넥터는 Bearer 헤더를 입력할 수 없어 무인증이어야 바로 붙는다.
3. **도구 5개** (`server/src/services/knowledge/`): `list_scraps`(id·제목·요약·태그 목록) → `get_scraps`(본문·링크) → `get_source`(원문), `get_portfolio`(about.md + 프로젝트), `read_dev_notes`(ADR·학습 노트).
4. **검색 엔진·임베딩 없음** — 목록 전체가 약 3만 자라 통째로 주고 LLM이 고른다. 한국어 질문과 영어 제목이 섞여도 의미 매칭이 된다.
5. **DB 구조와 분리** — 기존 `db/queries/*` DTO를 공통 형태로 바꿔서만 쓴다. 섹션 추가는 `SECTIONS`에 한 줄.
6. **원문 캐시 `scrap_sources(url PK)`** — 유튜브 자막은 Vercel IP에서 막히므로 로컬 `npm run backfill-sources -w server`로 미리 저장한다. 캐시가 없으면 웹페이지·README는 실시간 추출, 유튜브는 Gemini 영상 요약(`kind: ai-digest`)으로 대신한다.
7. **`get_source`는 저장된 스크랩의 url·추가 링크만 허용** — 무인증 공개 엔드포인트가 임의 URL 프록시가 되지 않게.
8. **프로젝트 목록을 `projects.json`으로 분리** — server tsconfig(`rootDir: src`)가 client TS import를 막아서. client는 JSON import, 서버는 fs로 읽고 `vercel.json` `includeFiles`에 포함한다.

## 이유 (다른 선택지를 배제한 이유)

| 대안 | 배제 이유 |
|------|-----------|
| 별도 레포·별도 배포 | 조회·추출·자막 코드와 포트폴리오 파일이 모두 여기 있음. 나중 대화창도 같은 도구를 프로세스 안에서 호출 |
| 사이트 REST API를 HTTP로 호출 | 같은 서버의 자기 호출 왕복만 늘고 이득 없음 |
| pgvector 의미 검색 | 136건이면 목록 전체가 컨텍스트에 들어감. 1000건 넘으면 재검토 |
| Bearer 토큰 | 공개 데이터라 보호할 게 없고, 웹 커넥터 연결을 막음 |
| 원문을 MCP 호출 때만 추출 | 배포 환경에서 유튜브 자막이 막힘 |

## 결과/참고

- 연결: `claude mcp add --transport http mysite https://my-little-website-client-self.vercel.app/api/mcp`
- 남은 일: Supabase에서 [`2026-10-13-scrap-sources.sql`](../plans/2026-10-13-scrap-sources.sql) 실행 → 로컬 백필. 사이트 대화창은 같은 `knowledgeTools`를 Gemini function calling으로 사용(방문자 공개, IP별 제한).
- **2026-10-13 추가 — 유용한 링크(`links`) 섹션**: 36건. slug·본문이 없어 id는 `links/<uuid>`, siteUrl은 `/links`, 분류값 라벨(+`featured`)을 태그로 넣는다. 섹션마다 공통 행을 돌려주는 구조로 바꿔 스크랩형이 아닌 테이블도 `SECTIONS` 한 줄로 붙는다. 링크는 설명이 비어 있는 경우가 많아 `get_source`(페이지 본문)로 보완한다. 전체 목록은 172건, 약 3.5만 자.
- 가이드: [docs/mcp-guide.md](../mcp-guide.md) (사이트 `/mcp`)
