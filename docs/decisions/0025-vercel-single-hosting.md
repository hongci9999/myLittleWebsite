# Vercel 단일 호스팅으로 이전 (프론트 + API 통합)

날짜: 2026-07-23
상태: 채택 (0018 대체)

## 배경 (왜 이 결정이 필요한가)

[0018](0018-aws-production-split-hosting.md)에서 프론트(S3+CloudFront)와 API(Elastic Beanstalk)를 **분리 호스팅**했다. 이 구조는 동작하지만 개인 프로젝트 규모에 비해 운영 부담이 크다.

- 프론트·API **호스트가 달라** CORS·커스텀 API 도메인(ACM/ALB)·`VITE_API_BASE_URL`·Mixed Content를 매번 맞춰야 한다.
- EB(EC2+ALB) 상시 과금, 배포 파이프라인(zip → S3 → 애플리케이션 버전 → 환경 배포)이 복잡하고 실패 지점이 많다([error-fixes/0003](../error-fixes/0003-aws-eb-cloudfront-cors-deploy.md), [0006](../error-fixes/0006-github-actions-eb-iam-deploy.md)).

## 결정 (무엇으로 했는지)

프론트와 Express 백엔드를 **모두 Vercel**로 이전한다.

- **프론트**: Vite 정적 빌드(`client/dist`)를 Vercel이 서빙. SPA fallback rewrite.
- **API**: Express 앱을 Vercel **서버리스 함수**로 감싼다. `server/src/app.ts`가 `app`을 export(리스닝 제외), 로컬 dev는 `server/src/index.ts`가 `app.listen`, Vercel은 `api/index.ts`가 `export default app`.
- **라우팅**: `vercel.json` rewrite `/api/(.*) → /api`. 프론트·API가 **same-origin**이라 CORS·커스텀 API 도메인·`VITE_API_BASE_URL`이 불필요해진다.
- **도메인**: `mylittlewebsite.p-e.kr`(내도메인.한국)를 (기존 API 전용 → ) 사이트 전체 도메인으로 Vercel에 연결. CNAME → `cname.vercel-dns.com`, TLS 자동.
- **파일시스템 의존**: `project-learning` 섹션만 `docs/learnings`를 런타임 `fs`로 읽는다. `vercel.json` `functions.includeFiles`로 `docs/learnings/**`를 함수에 포함하고, `learning-sections.ts`의 프로젝트 루트 해석을 `__dirname` 실패 시 `process.cwd()`로 폴백하도록 보정.
- **배포**: Vercel Git 연동(main 푸시 자동 배포). `.github/workflows/deploy-aws.yml`은 자동 트리거 제거(수동 전용)로 비활성화 후, AWS 자원 정리 완료 시 삭제.

## 이유 (다른 선택지를 배제한 이유)

| 대안 | 배제 이유 |
|------|-----------|
| AWS 분리 호스팅 유지(0018) | CORS·커스텀 도메인·EB 배포 복잡도·상시 과금 지속 |
| 프론트만 Vercel, 백엔드 AWS 유지 | 여전히 CORS·API 도메인 필요, AWS 운영 부담 잔존 |
| 백엔드를 Railway/Render 등 컨테이너 호스팅 | Vercel 단일 플랫폼 대비 관리 지점 증가(요청은 Vercel 통합) |

## 결과/참고

- 실행 walkthrough: [plans/2026-07-23-vercel-migration.md](../plans/2026-07-23-vercel-migration.md)
- 코드: `vercel.json`, `api/index.ts`, `server/src/app.ts`, `server/src/config/learning-sections.ts`
- 트레이드오프: 서버리스 함수 실행 시간 제한(AI·youtube-transcript 느린 호출), 인메모리 캐시 콜드스타트 초기화 — [plans/2026-07-23-vercel-migration.md](../plans/2026-07-23-vercel-migration.md) 참고
- 대체 대상: [0018-aws-production-split-hosting](0018-aws-production-split-hosting.md)
