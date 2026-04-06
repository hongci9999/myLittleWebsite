# 메인 위젯 페이지 이동 후 재로딩 문제

날짜: 2026-04-06

## 발생한 오류

메인 페이지의 `즐겨찾기 링크`, `오늘의 GeekNews` 같은 데이터 위젯이 다른 페이지를 다녀온 뒤 다시 메인으로 돌아오면 매번 로딩 상태부터 시작했다.  
사용자는 이미 본 데이터인데도 skeleton이 다시 보이고, 네트워크 요청도 반복되었다.

## 원인

- 위젯 데이터 상태를 각 컴포넌트 내부 `useState`만 사용
- `useEffect(() => fetch..., [])` 패턴으로 mount 시마다 재요청
- 라우팅 이동 후 메인 재진입 시 컴포넌트가 재생성되어 state가 초기화됨
- 위젯 간 재사용 가능한 공통 캐시 계층이 없었음

## 수정 방법

1. 공통 리소스 캐시 유틸 추가  
   - 파일: `client/src/shared/lib/resource-cache.ts`  
   - 기능:
     - `getCachedResource(key)` : 만료 전 캐시 동기 조회
     - `fetchWithResourceCache({ key, ttlMs, fetcher })` : 캐시/진행중 요청(inflight) 재사용
2. API 단에서 캐시 래퍼 제공
   - `client/src/shared/api/links.ts`
     - `getCachedFeaturedLinks()`
     - `fetchFeaturedLinksCached()`
   - `client/src/shared/api/geeknews.ts`
     - `getCachedGeekNewsLatest(limit)`
     - `fetchGeekNewsLatestCached(limit)`
3. 위젯 적용
   - `FavoriteLinksWidget`, `GeekNewsWidget`에서
     - 초기 state를 캐시로 세팅
     - 캐시 없을 때만 로딩 표시
     - fetch는 cached fetch 함수 사용

## 결과/참고

- 페이지 이동 후 메인 복귀 시, TTL 내에서는 즉시 데이터가 보이고 불필요한 재로딩이 줄었다.
- 동일 키 요청 중복 실행이 줄어 네트워크 낭비를 줄였다.
- 새 위젯 추가 시 동일 패턴으로 확장 가능:
  1) API에 `getCachedXxx`, `fetchXxxCached` 추가  
  2) 위젯 초기 state 캐시 우선  
  3) `useEffect`에서 cached fetch 사용

