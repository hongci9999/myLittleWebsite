# 즐겨찾기 링크 DB 저장 (사이트 대표 추천)

날짜: 2026-03-23
상태: 채택

## 배경 (왜 이 결정이 필요한가)

기존 즐겨찾기는 localStorage에 저장되어 방문자별 개인 목록이었다. 사용자 요청으로 메인 추천 링크를 **DB에 저장해 모든 사용자에게 동일한 목록**을 보여주도록 전환한다.

## 결정 (무엇으로 했는지)

- **저장소**: Supabase `links` 테이블에 `is_featured`, `featured_sort_order` 컬럼 추가
- **권한**: 관리자(인증된 사용자)만 메인 추천 토글 가능
- **API**: `GET /api/links/featured` (공개), `PATCH`/`POST`에 `isFeatured` 지원

## 이유 (다른 선택지를 배제한 이유)

- **사이트 대표 추천 vs 사용자별 즐겨찾기**: 요청이 "모든 사용자에게 보이도록"이므로 공용 목록(옵션 A) 선택
- **links 컬럼 vs 별도 테이블**: 단순 구현을 위해 `links`에 컬럼 추가. 별도 `featured_links` 테이블은 정렬·히스토리 등 확장 필요 시 고려

## 결과/참고

- 설계: `docs/plans/2026-03-23-featured-links-db-design.md`
- 마이그레이션: `docs/plans/2026-03-23-featured-links-migration.sql` (Supabase SQL Editor에서 실행)
- 기존 `useFavoriteLinks` 훅 제거
