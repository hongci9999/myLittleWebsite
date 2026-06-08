# AWS 배포: EB Degraded·Mixed Content·CORS (2026-05)

날짜: 2026-05-16

## 발생한 오류

1. **CloudFront 메인** — GeekNews「불러오는 중 오류」, 즐겨찾기 비음. 콘솔 `Mixed Content` (HTTPS 페이지 → `http://…elasticbeanstalk.com/api/…`).
2. **API HTTPS 적용 후** — `https://mylittlewebsite.p-e.kr/api/health` 는 OK이나 CloudFront 메인은 여전히 실패. 콘솔 `blocked by CORS policy: No 'Access-Control-Allow-Origin' header`.
3. **EB 환경** — `Degraded`, `Incorrect application version found on all instances. Expected version n/a.` (GitHub Actions 실행 후).
4. **부수** — CloudFront `/assets` 404; Actions EB zip 경로; `create-application-version` 라벨 재실행 충돌.

## 원인

| 오류 | 원인 |
|------|------|
| Mixed Content | `VITE_API_BASE_URL`이 **HTTP** EB URL로 빌드됨 |
| CORS | `CORS_ALLOWED_ORIGINS`에 **CloudFront HTTPS 출처** 없음(또는 목록에 없는 출처만 허용) |
| EB Degraded | S3에 앱 버전은 등록됐으나 **`update-environment` 미완료**(IAM CloudFormation 등) |
| assets 404 | CloudFront 오리진 **Origin path**에 `/index.html` 설정 |
| zip/라벨 | 스크립트·워크플로 이슈(스크립트 출력 경로, `VERSION_LABEL` 중복) |

## 수정 방법

1. **ACM(서울)** + 내도메인.한국 DNS → `mylittlewebsite.p-e.kr` → ALB. EB 로드 밸런서 **443 HTTPS** + 인증서.
2. GitHub Variable `VITE_API_BASE_URL=https://mylittlewebsite.p-e.kr` → Actions로 **프론트 재빌드·S3 sync**.
3. EB 환경 속성 `CORS_ALLOWED_ORIGINS=https://d4a3hmxzy83r1.cloudfront.net` → **적용** 후 인스턴스 재시작.
4. EB **애플리케이션 버전** 최신 `gh-…` → **환경에 배포**; IAM에 `cloudformation:*`(리소스 `awseb-*`) 등 `update-environment` 권한 보강.
5. CloudFront Origin path **비움**; Default root object `index.html`.
6. [`scripts/package-eb-bundle.sh`](../../scripts/package-eb-bundle.sh), [`.github/workflows/deploy-aws.yml`](../../.github/workflows/deploy-aws.yml) 반영분 유지.

## 결과/참고

- [CloudFront /main](https://d4a3hmxzy83r1.cloudfront.net/main)에서 API 위젯 정상 로드 확인.
- [API health](https://mylittlewebsite.p-e.kr/api/health) `{"status":"ok"}`.
- 전체 회고: [learnings/0034](../learnings/0034-aws-first-production-deploy-success.md).
- 후속(2026-06): EB `update-environment` IAM 순차 보강 — [0006](./0006-github-actions-eb-iam-deploy.md).
