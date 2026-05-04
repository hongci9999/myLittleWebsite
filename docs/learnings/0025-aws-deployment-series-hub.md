# AWS 배포 학습 시리즈 (허브·목차)

날짜: 2026-05-04
태그: [배포, aws, 인프라, 개발방법론, 도구]

## 요약

이 레포(`Vite` 클라이언트 + `Express` 서버 + `Supabase`)를 AWS에 올리려면 필요한 **개념·절차·점검 항목**을 여러 학습 문서로 나누었다. 이 문서는 **읽는 순서**와 **각 편 링크**만 담는 인덱스(허브)다.

---

## 왜 여러 문서로 나눴는가

- 한 파일에 DNS·IAM·S3·CI까지 몰아넣으면 초반에 막히기 쉽다.
- **개념(0026~0028)** → **정적 프론트(0029)** → **API 서버(0030)** → **연결(0031)** → **자동화(0032)** → **운영(0033)** 순으로 배우면 실습과 맞물리기 좋다.

---

## 이 레포와의 대응 (한 줄)

| 구성요소 | 배포 시 일반적인 위치 |
|----------|------------------------|
| `client` (`vite build` → `dist/`) | S3 + (권장) CloudFront |
| `server` (`tsc` → `node dist/index.js`) | Beanstalk / App Runner / ECS / EC2 등 |
| DB·Auth | Supabase(클라우드) — AWS 밖에서 그대로 사용 가능 |

---

## 권장 읽는 순서

### 처음 배포를 배울 때

1. [0026 배포 공통 개념](./0026-deployment-common-concepts.md)
2. [0027 네트워크·도메인·HTTPS](./0027-network-domain-https-for-deployment.md)
3. [0028 AWS 계정·리전·IAM·과금](./0028-aws-account-region-iam-billing.md)
4. [0029 정적 프론트 on AWS](./0029-aws-static-frontend-vite-s3-cloudfront.md)
5. [0030 Node API on AWS](./0030-aws-node-express-api-deployment.md)
6. [0031 프론트·API 연결](./0031-frontend-backend-integration-cors.md)
7. [0032 CI/CD (GitHub Actions)](./0032-cicd-github-actions-aws.md)
8. (선택) [0033 운영·보안·트러블슈팅](./0033-aws-ops-security-troubleshooting.md)

### 이미 네트워크·HTTP를 알고 있을 때

0026 일부 스킵 → 0027 요약만 → **0029부터** 실습 중심으로 읽고, 막히는 개념만 0026~0028로 되돌아가면 된다.

---

## 시리즈 목차 (문서별 역할)

| 번호 | 문서 | 다루는 내용 |
|------|------|-------------|
| **0025** | (이 문서) | 허브, 순서, 링크 |
| **0026** | [배포 공통 개념](./0026-deployment-common-concepts.md) | 빌드·런타임·환경·정적 vs API |
| **0027** | [네트워크·도메인·HTTPS](./0027-network-domain-https-for-deployment.md) | DNS, HTTPS, CORS(배포 맥락) |
| **0028** | [AWS 계정·IAM·과금](./0028-aws-account-region-iam-billing.md) | 리전, IAM, 비용 습관 |
| **0029** | [정적 프론트](./0029-aws-static-frontend-vite-s3-cloudfront.md) | S3, CloudFront, SPA 주의 |
| **0030** | [Node·Express API](./0030-aws-node-express-api-deployment.md) | 서버 빌드·호스팅 선택지 |
| **0031** | [프론트·API 연결](./0031-frontend-backend-integration-cors.md) | 베이스 URL, CORS, 도메인 통합 개념 |
| **0032** | [CI/CD](./0032-cicd-github-actions-aws.md) | Actions, OIDC, 배포 파이프라인 개념 |
| **0033** | [운영·보안·트러블슈팅](./0033-aws-ops-security-troubleshooting.md) | 로그, 자주 나는 오류, 정리 |

---

## 실습 가이드 (단계별)

- [첫 AWS 배포 실습 walkthrough](../plans/2026-05-04-aws-first-deploy-walkthrough.md) — 로컬 빌드 확인 → S3 → (선택) CloudFront → API(**Elastic Beanstalk** 포함)·CORS 안내

## 관련 기존 문서

- [0019 GitHub Actions 개요](./0019-github-actions.md) — 0032에서 전제로 삼는다.
- [0015 백엔드·DB 기초](./0015-backend-database-basics.md), [0017 Supabase](./0017-supabase.md) — 서버·DB 역할 이해용.

---

## 참고

- AWS 공식 문서는 서비스별로 갱신되므로, 콘솔 UI·용어는 최신 가이드를 병행한다.
- 이 시리즈는 **개념·절차 프레임**이며, 특정 리전·가격은 시점에 따라 다를 수 있다.
