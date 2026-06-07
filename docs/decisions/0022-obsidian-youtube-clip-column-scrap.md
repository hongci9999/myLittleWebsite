# 칼럼 스크랩 — Obsidian 유튜브 클립 붙여넣기

날짜: 2026-06-07  
상태: 채택

## 배경 (왜 이 결정이 필요한가)

- **로컬**에서는 칼럼 스크랩 「AI 채우기」에 YouTube URL만 넣어도 서버가 InnerTube·caption track으로 자막을 가져와 요약이 됐다.
- **배포(Elastic Beanstalk)** 환경에서는 YouTube가 서버 IP·요청 패턴에 따라 자막 API 응답이 비거나 막혀, URL만으로는 AI 제안이 자주 실패했다([0021](0021-youtube-transcript-unified-ai-path.md)의 서버 fetch 경로 한계).
- 개인 워크플로에는 이미 Obsidian Web Clipper `raw/youtube` 템플릿으로 **브라우저에서 자막을 확보**하는 경로가 있다. 배포 서버가 자막을 못 가져와도, 사용자가 클립 내용을 넘기면 동일한 AI 파이프라인을 탈 수 있어야 한다.

## 결정 (무엇으로 했는지)

1. **`POST /api/column-scraps/ai-fill`** 본문에 선택 필드 `youtubeClip` 추가. `url` 또는 `youtubeClip` 중 하나 이상.
2. **`parse-obsidian-youtube-clip.ts`**: frontmatter 노트·clipper JSON 템플릿·`noteContentFormat` 내 `## 트랜스크립트`에서 메타·자막 추출. `noteNameFormat` 등으로 **JSON.parse가 깨져도** properties·noteContentFormat 문자열을 regex로 복구.
3. **클라이언트** `ColumnScrapAdminDialog`: 「YouTube 클립 붙여넣기」 textarea, 파일 가져오기, 클립 적용·AI 채우기. 붙여넣기만 해도 유효 형식이면 AI 요청에 포함.
4. 클립이 있으면 **서버 YouTube fetch·자막 assert를 건너뛰고** 클립 텍스트를 `fullText`로 AI에 전달([0021](0021-youtube-transcript-unified-ai-path.md)과 동일한 텍스트 `complete` 단계).

## 이유 (다른 선택지를 배제한 이유)

- **배포 서버에서만 프록시/우회 강화**: IP 차단·캡차는 환경마다 달라 근본 해결이 어렵다. 클립은 사용자 브라우저(Clipper)가 이미 자막을 받은 결과를 쓴다.
- **URL만 계속 요구**: 배포에서 실패율이 높아 운영·학습 기록 목적에 맞지 않다.
- **클라이언트만 파싱**: AI 입력 구성·검증은 서버에서 한 번 더 해야 형식 변조·빈 자막을 막을 수 있다.

## 결과/참고

- 코드: `parse-obsidian-youtube-clip.ts`, `suggest-column-scrap.ts`, `ColumnScrapAdminDialog`, `obsidian-youtube-clip.ts`(클라이언트 prefill)
- 학습: [0037](../learnings/0037-obsidian-youtube-clip-column-scrap.md)
- URL-only 경로: 로컬·자막 fetch 성공 환경에서는 [0021](0021-youtube-transcript-unified-ai-path.md) 그대로 사용
