# 원클릭 저장 파이프라인 — 개인 크롬 확장 + `POST /api/quick-save`

날짜: 2026-10-14  
상태: 채택 (배포·실사용 1건 확인)

## 배경 (왜 이 결정이 필요한가)

- 자료 저장이 두 갈래였다. 사이트 관리 화면에서 하나씩 AI 채우기를 하거나, 링크를 모아 로컬 일괄 스크립트(ADR 0027)를 돌렸다. 평소 브라우징하다 "이거 저장"이 바로 안 된다.
- 유튜브 자막은 Vercel(클라우드) IP에서 막힌다. 배포 서버로 저장하면 Gemini 영상 요약(ADR 0026)으로 대신하고, MCP 원문(`scrap_sources`, ADR 0028)은 로컬 백필을 따로 돌려야 했다.
- 자막은 **사용자 브라우저(가정용 IP)에서는 받을 수 있다**. 저장 버튼을 브라우저에 두면 자막 문제와 수집 동선이 같이 풀린다.

## 결정 (무엇으로 했는지)

1. **크롬 확장(MV3, 빌드 없는 plain JS, 본인 전용)** — 버튼 하나로 지금 탭을 저장. 레포는 public이라 확장 코드는 `.gitignore`로 제외하고 로컬에만 둔다. 웹스토어 배포·다중 사용자 대응은 하지 않는다.
2. **자막은 탭 안에서 수집** — `chrome.scripting.executeScript({ world: 'MAIN' })`로 유튜브 페이지에서 innertube `player`(ANDROID 클라이언트) → 자막 트랙(ko 우선) XML을 받아 텍스트로 만든다. 서버 `youtube-content.ts`와 같은 방식이라 결과가 같다.
3. **서버 `POST /api/quick-save`** (로그인 필요) `{ url, youtube? }` → 중복 확인(세 섹션 통합 `linkKey`) → 섹션 분류 → AI 채우기 → 저장 → 자막을 `scrap_sources`에 upsert. AI 개발 도구 영상은 도구 레포·공식 사이트를 메인 링크로, 영상은 「소개 영상」 추가 링크(ADR 0027 관례 그대로).
4. **받은 자막 주입은 `withProvidedYoutubeBundle`** — 실행 동안 `fetchYoutubeContentBundle`이 서버 fetch 대신 받은 자막을 돌려준다. 분류·`suggest*FromUrl`·`fetchWebsiteContent`가 모두 이 함수를 거치므로 깊은 호출부 시그니처를 바꾸지 않는다.
5. **로직 공유** — bulk-youtube 스크립트의 분류·레포 찾기·중복 검사·채우기를 `server/src/services/quick-save/`로 옮기고 스크립트와 API가 같이 쓴다. 분류 프롬프트는 영상 전용에서 "자료(영상·글·레포)"로 일반화.
6. **초안 없이 바로 저장, 오분류는 결과 화면에서** — 확장 결과에 섹션 바꾸기(`POST /api/quick-save/move`: 내용 그대로 새 섹션에 만들고 기존 삭제)·삭제(기존 DELETE API) 버튼. 이름 검색으로 찾은 레포처럼 불확실한 항목은 ❓ 표시.
7. **저장은 service worker에서** — AI 채우기가 수십 초 걸려 popup이 닫혀도 끝나야 한다. 진행 상태는 `chrome.storage`와 아이콘 배지로 전달.
8. **로그인은 기존 `/api/auth/login`·`/refresh`** — 확장에 Supabase 키를 두지 않는다. 토큰은 `chrome.storage.local`.

## 이유 (다른 선택지를 배제한 이유)

| 대안 | 배제 이유 |
|------|-----------|
| 서버가 자막 fetch (프록시·다른 리전) | 클라우드 IP 차단은 리전을 바꿔도 같음. 유료 프록시는 개인 사이트에 과함 |
| 확장이 영상 ID만 보내고 Gemini 요약 | 이미 있는 폴백(ADR 0026). 자막 원문이 MCP·요약 품질 모두 낫고 비용도 없음 |
| `suggest*FromUrl`마다 transcript 인자 추가 | 호출 깊이가 깊어 시그니처 변경이 여러 파일로 번짐. 주입 지점 한 곳이 단순 |
| 확장에서 미리보기 → 확인 후 저장 | 원클릭 의미가 사라짐. 저장 후 섹션 변경·삭제로 충분 |
| 확장 코드 레포에 커밋 | 레포가 public. 본인 전용 도구라 공개할 이유가 없음 |
| 블로그 글 본문도 확장이 전송 | 지금은 서버 fetch로 충분. 로그인 필요한 글을 저장하게 되면 그때 |

## 결과/참고

- 첫 실사용: 유튜브 「Insane Search 소개」 → AI 개발 도구 `/ai-dev-tools/claude-code-insane-search`(메인 = GitHub 레포, ❓ 검색으로 찾은 레포 → 확인 결과 맞음), `scrap_sources`에 자막 저장 확인.
- 유튜브가 아닌 AI 도구 글은 레포를 찾지 않고 그 페이지를 메인 링크로 저장한다.
- 같은 영상을 동시에 두 번 저장하면 주입 Map이 먼저 끝난 쪽에서 지워져 나머지는 서버 fetch로 폴백(개인 사용이라 허용).
- CORS: `CORS_ALLOWED_ORIGINS`가 비어 있으면 모두 허용. 값을 쓰게 되면 `chrome-extension://<확장 ID>`를 넣는다(코드에 하드코딩하지 않음).
- API: [api-spec §14](../api-spec.md), 일괄 등록: [ADR 0027](0027-bulk-youtube-import-script.md), 원문 캐시: [ADR 0028](0028-site-knowledge-mcp.md)
