# 프로덕션 호스팅 분리 (CloudFront + EB + 커스텀 API 도메인)

날짜: 2026-05-16
상태: 채택

## 배경 (왜 이 결정이 필요한가)

첫 AWS 배포에서 프론트는 정적 파일(S3), API는 Node(Express)로 **호스트·배포 주기가 다르다**. 브라우저는 CloudFront **HTTPS**로 열리므로, API도 **HTTPS**와 **CORS**를 명시적으로 맞춰야 메인 위젯(GeekNews·즐겨찾기 등)이 동작한다.

## 결정 (무엇으로 했는지)

1. **프론트**: S3 버킷 + CloudFront(OAC, 버킷 퍼블릭 차단). 사용자 URL은 CloudFront 기본 도메인(`*.cloudfront.net`).
2. **API**: Elastic Beanstalk(로드 밸런싱 + ALB), 애플리케이션 zip은 `scripts/package-eb-bundle.sh` → S3 → `create-application-version` → `update-environment`.
3. **API 공개 URL**: 내도메인.한국 **`mylittlewebsite.p-e.kr`** → ALB CNAME. ACM(서울)으로 ALB **443 HTTPS** 종료.
4. **클라이언트 API 베이스**: 빌드 시 `VITE_API_BASE_URL=https://mylittlewebsite.p-e.kr` ([`client/src/shared/api/base.ts`](../../client/src/shared/api/base.ts)).
5. **CORS**: EB 환경 속성 `CORS_ALLOWED_ORIGINS=https://d4a3hmxzy83r1.cloudfront.net` (프론트 출처만 허용 목록에 추가).
6. **배포 자동화**: `main` 푸시·`workflow_dispatch` — [`.github/workflows/deploy-aws.yml`](../../.github/workflows/deploy-aws.yml), AWS 자격은 **OIDC IAM 역할**(장기 Access Key 미사용).

## 이유 (다른 선택지를 배제한 이유)

| 대안 | 배제 이유 |
|------|-----------|
| EB 기본 `http://*.elasticbeanstalk.com` 만 사용 | CloudFront(HTTPS)에서 **Mixed Content** 차단 |
| CloudFront `/api` 프록시만 (EB HTTP 유지) | 가능하나 초기에 ALB·오리진 behavior 설정 부담; **커스텀 도메인 + ACM**으로 API HTTPS를 먼저 확보 |
| `VITE_API_BASE_URL` 비우고 same-origin `/api` | 프론트·API 호스트가 달라 **불가** (CF와 EB 분리 유지 시) |
| API·프론트 동일 호스트(루트) | 무료 DNS에서 루트 CNAME 제약·CloudFront와 EB 동시 사용 복잡; 당분간 **호스트 분리** 유지 |

## 결과/참고

- 회고·체크리스트: [learnings/0034](../learnings/0034-aws-first-production-deploy-success.md)
- 트러블슈팅: [error-fixes/0003](../error-fixes/0003-aws-eb-cloudfront-cors-deploy.md), 학습 기록 UI·md fetch: [error-fixes/0005](../error-fixes/0005-learning-production-split-hosting.md)
- walkthrough 점검표 갱신: [plans/2026-05-04-aws-first-deploy-walkthrough.md](../plans/2026-05-04-aws-first-deploy-walkthrough.md) §7
