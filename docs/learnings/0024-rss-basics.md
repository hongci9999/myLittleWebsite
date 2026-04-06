# RSS 개요와 활용 방법

날짜: 2026-04-06  
태그: [도구, 개발방법론, 백엔드]

## 요약

RSS(Really Simple Syndication)는 웹사이트의 새 글·업데이트를 XML 형식으로 구독자에게 전달하는 표준 피드다. 사용자는 사이트를 직접 방문하지 않아도 피드 리더나 서버 수집기로 최신 항목을 모아볼 수 있다.

## 핵심 개념

| 개념 | 설명 |
| --- | --- |
| Feed(피드) | 사이트의 최신 콘텐츠 목록을 담은 XML 문서 |
| Item(항목) | 각 글/뉴스 단위 데이터(제목, 링크, 발행일, 요약 등) |
| Reader(리더) | RSS를 모아서 보여주는 앱/서비스 |
| Polling(주기 조회) | 일정 간격으로 피드를 다시 읽어 새 항목을 확인하는 방식 |
| 중복 제거 | `guid` 또는 `link` 기준으로 이미 수집한 항목을 걸러내는 처리 |

## 상세 설명 (이해한 내용)

### 1) RSS가 왜 필요한가

- 여러 사이트의 업데이트를 한 곳에서 확인할 수 있다.
- 뉴스·블로그·릴리즈 알림처럼 "새 글 감시"에 매우 효율적이다.
- API가 없는 서비스에서도 RSS만 있으면 비교적 안정적으로 자동 수집이 가능하다.

### 2) RSS 기본 구조

RSS XML에는 보통 아래 정보가 들어간다.

- 채널 정보: 피드 제목, 설명, 사이트 링크
- 항목 정보: `title`, `link`, `pubDate`, `description`, `guid`

수집 시스템에서는 각 항목을 내부 스키마(예: `source`, `title`, `url`, `published_at`)로 정규화해 저장하면 후속 검색·필터링이 쉬워진다.

### 3) 구현할 때 주의할 점

- 피드 URL 유효성: 404/리다이렉트/인증 필요 여부 확인
- 인코딩/파싱 오류: malformed XML 대비 예외 처리
- 조회 주기: 너무 짧으면 트래픽 부담, 너무 길면 지연 증가
- 중복 기준: `guid` 우선, 없으면 `link`+`title` 보조
- 시간대 처리: `pubDate`를 UTC 기준으로 통일 저장

### 4) 이 프로젝트 적용 사례 (GeekNews 메인 위젯)

이번 작업에서는 메인 페이지의 빈 슬롯을 "오늘의 GeekNews" 위젯으로 교체했다. 구현 흐름은 아래와 같다.

- 서버 API: `GET /api/geeknews/latest?limit=5`
  - RSS URL `https://news.hada.io/rss/news`를 fetch
  - `item`, `entry`를 모두 파싱해 RSS/Atom 변형에 대응
  - `title`, `url`, `publishedAt`, `source` 형태로 정규화
  - `limit` 범위(1~20) 검증
- 캐시:
  - 서버 메모리 캐시를 사용해 TTL 동안 RSS 재요청을 줄였다.
  - 기본 TTL은 15분, 환경변수로 변경 가능 (`GEEKNEWS_RSS_CACHE_TTL_MS`)
- 클라이언트:
  - `/api/geeknews/latest` 호출 모듈을 분리
  - 위젯에서 최신 5개 항목 렌더링
  - 로딩 스켈레톤, 에러 메시지, 빈 상태를 모두 처리

### 5) 이번 구현에서 확인한 포인트

- RSS는 메인 랭킹과 정렬 기준이 다를 수 있어, UI 문구를 "최신"으로 명확히 두는 게 좋다.
- 외부 피드 의존 기능은 직접 호출보다 "서버 프록시 + 캐시" 패턴이 안정적이다.
- 위젯 교체를 `main-widget-layout` 설정 기반으로 처리하면, 이후 다른 피드/위젯으로도 쉽게 확장된다.

## 참고

- [RSS 2.0 Spec](https://cyber.harvard.edu/rss/rss.html)
- [MDN: Syndication feeds](https://developer.mozilla.org/en-US/docs/Web/XML/RSS)
- `server/src/services/geeknews-rss.ts`
- `server/src/routes/geeknews.ts`
- `client/src/widgets/GeekNewsWidget/GeekNewsWidget.tsx`
