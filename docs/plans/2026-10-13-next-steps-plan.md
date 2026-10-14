# 다음 작업 계획 — MCP 마무리 · 크롬 확장 원클릭 저장 · 사이트 대화창

날짜: 2026-10-13  
진행: 2026-10-14 — 0번 완료(백필·배포 MCP 실사용 확인, claude.ai 커넥터 등록만 남음), 1번 완료([ADR 0029](../decisions/0029-quick-save-pipeline.md), 블로그 본문은 서버 fetch 유지). 다음은 2번.  
선행: [ADR 0028 사이트 지식 MCP](../decisions/0028-site-knowledge-mcp.md) (커밋·배포 완료)

## 0. MCP 마무리 (바로)

1. Supabase SQL 에디터에서 [`2026-10-13-scrap-sources.sql`](2026-10-13-scrap-sources.sql) 실행 (DROP은 새 테이블 정책 재실행 대비용, 데이터 영향 없음)
2. 로컬 `npm run backfill-sources -w server` → `✗ 원문 없음` 항목 확인 (자막 없는 영상, 접근 막힌 페이지)
3. 배포 주소로 연결해 실사용 테스트
   - `claude mcp add --transport http mysite https://my-little-website-client-self.vercel.app/api/mcp`
   - "게임 AI 관련 저장 자료로 할 만한 프로젝트 추천", "CHEESESTORM으로 자소서 문단 써줘", 유튜브 항목 `get_source`가 `transcript`로 나오는지
4. claude.ai 웹 커스텀 커넥터에도 같은 URL 등록 (자소서는 웹에서 쓸 가능성 높음)

## 1. 크롬 확장 — 보고 있는 페이지 원클릭 저장

**목표**: 유튜브·칼럼 글·GitHub 레포를 보다가 버튼 하나로 사이트에 분류·저장. 유튜브는 브라우저에서 자막까지 같이 보내 `scrap_sources`도 채운다(Vercel IP 자막 차단 우회).

**구성**
- `extension/` (MV3, 빌드 도구 없이 plain JS): popup 버튼 1개 + 유튜브 content script
- 로그인: popup에서 Supabase 이메일/비밀번호 → access token을 `chrome.storage.local`에 저장, 만료 시 refresh
- 자막: content script가 페이지의 `ytInitialPlayerResponse.captions...captionTracks[].baseUrl` fetch (사용자 브라우저라 차단 없음). 기존 서버 `pickCaptionTrack` 규칙(ko 우선)과 맞춘다

**서버**
- `POST /api/quick-save` (requireAuth) `{ url, title?, transcript? }`
  1. 중복 검사 — bulk-youtube의 `linkKey`·`loadSavedLinks` (세 섹션 통합)
  2. 섹션 분류 — bulk-youtube의 `classify`
  3. AI 채우기 — 기존 `suggest*FromUrl` (transcript 있으면 그걸 근거로, 없으면 현행 경로)
  4. AI 도구면 레포 찾기 — bulk-youtube의 `resolveTool`·`verifyRepo`
  5. 저장 + transcript를 `scrap_sources`에 upsert
- **선행 리팩터**: `classify`·`resolveTool`·`linkKey`·`fill`을 `scripts/bulk-youtube.ts`에서 `server/src/services/quick-save/`로 옮기고 스크립트는 import만. 동작 변경 없음
- `suggest*FromUrl`이 외부 transcript를 받도록 인자 추가 (fetch-website 우회)

**오분류 대응** (저장 즉시 공개라 필수)
- popup 결과 화면: 섹션·제목·사이트 링크 + [섹션 바꾸기] [삭제] 버튼 (기존 PATCH/DELETE API 재사용, 섹션 변경 = 새 섹션 create + 기존 delete)
- `check`(이름 검색으로 찾은 레포)처럼 불확실하면 결과 화면에 ❓ 표시

**결정할 것**: 칼럼 글(블로그)은 본문을 content script로 보낼지(로그인 필요 글 대응) vs 서버 fetch 유지

## 2. 사이트 대화창 (방문자 공개)

**목표**: 방문자(채용 담당자 등)가 "이 사람 어떤 프로젝트 했어?", "게임 개발 자료 뭐 있어?"를 물으면 사이트 데이터로 답한다.

**서버**
- `POST /api/chat` `{ messages }` — Gemini function calling 루프, 도구는 `knowledgeTools` 그대로
  - 선언 변환: `z.toJSONSchema(z.object(t.inputSchema))` (zod v4) → Gemini `functionDeclarations`
  - 최대 5회 도구 호출 후 답변. 시스템 프롬프트: "사이트 주인(포트폴리오) 소개 도우미, 사이트 자료 근거로만, siteUrl 출처 표기"
- 남용 방지: IP 해시별 하루 N회 — 서버리스라 메모리 카운터 불가 → Supabase `chat_usage(ip_hash, day, count)` 테이블 + RPC로 증가
- `maxDuration` 300 내에서 처리. 스트리밍은 1차엔 생략(완성 응답), 체감 느리면 SSE 추가

**클라이언트**
- `/chat` 페이지 또는 우하단 플로팅 버튼 — 메시지 목록 + 입력창, 답변 Markdown은 기존 `MarkdownWithMath` 재사용
- 대화 기록은 브라우저 메모리만 (저장 안 함)

**결정할 것**: 하루 제한 횟수, 위치(페이지 vs 플로팅), Gemini 모델(flash 계열 비용)

## 순서

0 → 1 → 2. 크롬 확장이 자막 저장 경로를 만들어 줘서 MCP·대화창의 원문 품질이 같이 올라간다.
