# 클라우드 IP에서 유튜브 자막이 막히는 이유와 우회 방법

날짜: 2026-10-11  
태그: [ai, 백엔드, 배포, 도구]

## 요약

- Vercel(AWS)에서 유튜브 자막 fetch가 실패하는 원인은 코드가 아니라 **요청 IP**다. 유튜브는 클라우드 IP의 비공식 자막 요청을 봇으로 보고 차단한다.
- 비공식 라이브러리(`youtube-transcript-api`, npm `youtube-transcript`)를 바꿔도 같은 IP라 결과는 같다. 우회 수단은 **프록시(주거용)**, **요청 주체를 바꾸기(Gemini가 영상 직접 분석)**, **가정용 IP에서 실행(로컬)** 셋뿐이다.

## 핵심 개념

### 1) 공식 API vs 비공식 라이브러리

| | 공식 YouTube Data API | youtube-transcript-api 등 |
|---|---|---|
| 허가 | API 키 | 없음 (웹 클라이언트 내부 엔드포인트 흉내) |
| 남의 영상 자막 | 불가 (`captions.download`는 소유자 OAuth만) | 가능 |
| 차단 기준 | 키 | **IP·요청 패턴** |

"API"라는 이름이어도 내 서버에서 실행되는 코드일 뿐이라, 유튜브가 보는 건 내 서버 IP다.

### 2) 실측 (2026-10-11)

| 영상 | Vercel (Python youtube-transcript-api) | 로컬 PC |
|---|---|---|
| `dQw4w9WgXcQ` | ✅ (예외적으로 통과) | ✅ |
| `9bZkp7q19f0` | ❌ RequestBlocked | ✅ ko |
| `jNQXAC9IVRw` | ❌ RequestBlocked | ✅ en |
| `kJQP7kiw5Fk` | ❌ RequestBlocked | ✅ en |

- 첫 영상 하나만 보고 "된다"고 판단하면 틀린다 — 여러 영상으로 확인할 것.
- 로컬에서도 watch 페이지 HTML의 caption `baseUrl`(`pot`·`exp` 포함)은 0바이트를 준다(브라우저 PO 토큰 필요). InnerTube ANDROID 클라이언트 경로만 로컬에서 동작.

### 3) 우회 방법

| 방법 | 비용 | 비고 |
|---|---|---|
| 주거용 로테이팅 프록시 (Webshare 등) | 유료 | 데이터센터·고정 프록시는 다시 막힘 |
| Gemini `file_data.file_uri`에 YouTube URL | Gemini 토큰 | 구글이 직접 읽어 IP 무관. 공개 영상만. 4분 영상 ~33초 |
| 로컬(가정용 IP) 스크립트 | 무료 | PC에서 실행해야 함 |

## 상세 설명 (이해한 내용)

- **프록시**: 요청을 대신 보내는 중간 서버. 유튜브는 프록시 IP만 본다. 주거용 프록시는 실제 가정 회선 IP라 일반 사용자로 보인다.
- **Vercel Python 함수 번들**: Python 함수는 저장소 파일을 함께 묶어 `node_modules`까지 포함되면 한도(로그상 225MB)를 넘는다 → `functions["api/x.py"].excludeFiles`로 제외. 빌드 실패 시 이전 배포가 계속 서비스된다.
- **Vercel rewrites**: `/api/(.*) → /api` catch-all이 있으면 별도 함수 경로는 그보다 앞에 rewrite를 둬야 확실하다.

## 참고

- 결정: [0026 Gemini 영상 직접 분석 폴백](../decisions/0026-youtube-gemini-digest-fallback.md), [0027 유튜브 일괄 등록 로컬 스크립트](../decisions/0027-bulk-youtube-import-script.md)
- 이전 맥락: [0036](0036-youtube-content-bundle-transcript.md), [0037](0037-obsidian-youtube-clip-column-scrap.md)
- youtube-transcript-api README "Working around IP bans" 섹션
