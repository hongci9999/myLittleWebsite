# 메인 도메인 만료 알림·DB 갱신

날짜: 2026-05-19
상태: 채택

## 배경 (왜 이 결정이 필요한가)

`mylittlewebsite.p-e.kr`은 내도메인.한국 무료 도메인으로 **만료일(2026-08-16)** 이 있고, **만료 30일 전부터 연장**이 필요하다. 운영자가 연장 후에도 코드 수정·재배포 없이 등록·만료일을 맞추고 싶다.

## 결정 (무엇으로 했는지)

- **UI**: 메인(`/main`) 상단 `DomainExpiryNotice` — 등록~만료 구간 **경과 비율**로 그라데이션 바 채움, **만료 30일 전** 위치에 하단 **쐐기** 마커(툴팁만).
- **기본값**: `client/src/shared/config/site-domain.ts` (호스트·등록업체 URL·등록/만료일·30일 전 알림).
- **저장**: Supabase 단일 행 테이블 `site_domain_settings` (`id=1`, `registered_date`, `expiry_date`).
- **API**: `GET /api/site-domain`(공개), `POST /api/site-domain/renew`(JWT) — 연장 반영 시 **등록일=오늘**, **만료일=오늘+(기존 등록~만료 일수)**.
- **폴백**: DB 미적용·행 없음 → config 기본값; renew는 503.

## 이유 (다른 선택지를 배제한 이유)

- **config만**: 관리자 버튼으로 갱신 불가, 배포 필요.
- **localStorage**: 방문자·기기마다 달라짐, 운영 기록으로 부적합.
- **별도 CMS**: 개인 사이트 규모에 비해 과함. 기존 Supabase·관리자 JWT 재사용이 적절.

## 결과/참고

- SQL: [plans/2026-05-19-site-domain-settings.sql](../plans/2026-05-19-site-domain-settings.sql)
- 클라이언트: `widgets/DomainExpiryNotice`, `shared/lib/domain-expiry.ts`, `shared/api/site-domain.ts`
- 서버: `routes/site-domain.ts`, `db/queries/site-domain.ts`
- API 명세: [api-spec.md §9](../api-spec.md)
- 도메인·DNS 이전: [plans/2026-05-19-api-subdomain-migration.md](../plans/2026-05-19-api-subdomain-migration.md)
