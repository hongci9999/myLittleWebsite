# 현대오토에버 부트캠프 기록 — DB 본문 + Storage 이미지 + `/bootcamp` 페이지

날짜: 2026-10-26  
상태: 채택

## 배경 (왜 이 결정이 필요한가)

- 현대오토에버 모빌리티 SW스쿨에서 한 팀 프로젝트 5건을 마크다운 6개(과정 소개 + 프로젝트 5) + 발표 슬라이드 webp로 정리해 두었다. 사이트에 기록 페이지로 올리고, 프로젝트 페이지에서 카드로 진입하게 하고 싶다.
- 데이터는 레포가 아니라 DB에 두고 싶다(사용자 요청). 문서를 고치면 다시 올릴 수 있어야 한다.

## 결정 (무엇으로 했는지)

1. **본문 = Supabase `bootcamp_docs` 테이블** — slug(파일명, `index` = 과정 소개)·제목·날짜·요약·태그·본문 마크다운·순서. 공개 읽기, 쓰기는 로그인 사용자(RLS). 스키마: `docs/plans/2026-10-26-bootcamp-docs.sql`.
2. **이미지 = Supabase Storage 공개 버킷 `bootcamp`** — 본문의 `images/…`를 버킷 공개 URL로 치환해 저장. **본문이 참조하는 이미지만** 올린다(안 쓰인 표지 슬라이드에 팀원 실명이 있어 공개 버킷에 남기지 않음).
3. **올리기 = `npm run import-bootcamp -w server -- <폴더> [--dry]`** — frontmatter 분리, `foo.md` 링크 → `/bootcamp/foo`, slug 기준 upsert라 재실행으로 갱신. `--dry`는 DB 쓰기 없이 파싱 결과만.
4. **페이지 = `/bootcamp`(과정 소개) · `/bootcamp/:slug`(프로젝트)** — 한 컴포넌트(`BootcampPage`), 프로젝트 문서 아래 이전·다음 이동. 헤더 메뉴 「부트캠프 기록」.
5. **프로젝트 카드 5개는 `projects.json`** — 새 필드 `docPath`가 있으면 「기록 보기」 버튼(사이트 내부 이동). 표지는 각 문서 첫 슬라이드(Storage URL).
6. 마크다운 렌더러 공통 개선: `/`로 시작하는 링크는 react-router `Link`(새로고침 없음), 이미지는 `loading="lazy"`.

## 이유 (다른 선택지를 배제한 이유)

| 대안 | 배제 이유 |
|------|-----------|
| 이미지를 `client/public/`에 | 레포에 8.8MB 추가, 데이터가 DB와 분리됨 (사용자가 Storage 선택) |
| 이미지를 DB(bytea/base64)에 | 행 크기·전송량 낭비, CDN 캐시 불가 |
| 학습 섹션(`public/learnings`)에 추가 | 레포 정적 파일 방식이라 "DB에 저장" 요구와 다르고, 프로젝트 성과로 덜 보임 |
| 카드도 DB에서 | 카드엔 역할·표지 등 문서에 없는 필드가 필요하고 MCP `get_portfolio`가 `projects.json`을 읽음 — 카드는 기존 방식 유지 |
| 관리자 편집 UI | 원본은 로컬 마크다운 — 고치고 스크립트 재실행이면 충분 |

## 결과/참고

- 서버: `server/src/routes/bootcamp.ts`, `server/src/db/queries/bootcamp.ts`, `server/scripts/import-bootcamp.ts`
- 클라이언트: `client/src/pages/BootcampPage.tsx`, `client/src/shared/api/bootcamp.ts`, `ProjectCard`의 `docPath`
- API: [api-spec §17](../api-spec.md)
