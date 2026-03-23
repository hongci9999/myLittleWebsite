# 즐겨찾기 링크 DB 전환 설계 (사이트 대표 추천)

- **날짜**: 2026-03-23
- **상태**: 채택

## 배경

기존 즐겨찾기는 localStorage에 저장되어 방문자별로 개인 목록이었다. 이를 DB에 저장해 **사이트 대표 추천** 링크로 전환하고, 모든 사용자가 동일한 목록을 보도록 한다.

## 결정

- **저장**: Supabase `links` 테이블에 `is_featured`, `featured_sort_order` 컬럼 추가
- **권한**: 관리자(인증된 사용자)만 메인 추천 토글 가능
- **표시**: 메인 페이지 FavoriteLinksWidget에서 featured 링크만 조회·표시
- **UI**: Links 페이지에서 관리자에게만 별 아이콘 표시, 클릭 시 토글. Links 관리 페이지에서는 LinkForm에 "메인 추천" 체크박스 추가

## 아키텍처

| 구분 | 기존 | 변경 후 |
|------|------|---------|
| 저장소 | localStorage | Supabase links 테이블 |
| 토글 가능 | 모든 방문자 | 관리자만 |
| 표시 | 개인별 | 사이트 공통 |

## 구현 요약

1. **DB**: `links`에 `is_featured BOOLEAN`, `featured_sort_order INT` 추가
2. **API**: `GET /api/links/featured` (공개), `PATCH`에 isFeatured 지원
3. **Client**: FavoriteLinksWidget → API 조회, LinksPage 별 → 관리자만 + API 토글, LinkForm → 메인 추천 체크
