# CI/CD로 AWS 배포하기 (GitHub Actions 연동)

날짜: 2026-05-04
태그: [배포, aws, 개발방법론, 도구, 백엔드]

## 요약

**CI/CD**는 빌드·테스트·배포를 파이프라인으로 자동화한다. GitHub에서는 **Actions** 워크플로로 정의한다. AWS 자격 증명은 **장기 Access Key를 저장소에 넣지 않고**, **OIDC로 IAM 역할을 잠깐 받는** 방식이 권장되는 경우가 많다.

---

## 핵심 개념

| 개념 | 설명 |
|------|------|
| **CI** | merge/push 시 빌드·린트·테스트 |
| **CD** | 통과 시 스테이징/프로덕션에 배포 |
| **Workflow** | `.github/workflows/*.yml`에 정의([0019](./0019-github-actions.md)) |
| **GitHub Secrets** | 토큰·키 등 민감값 저장 |
| **OIDC → AWS** | GitHub이 JWT를 발급하고, AWS IAM이 이를 신뢰해 **임시 세션** 발급(키 회전 부담 감소) |
| **배포 단계 예** | `npm ci` → `npm run build -w client` → `aws s3 sync` → `aws cloudfront create-invalidation` |

---

## 상세 설명

### 1. 파이프라인을 나누는 단위

- **Job 분리**: 빌드만 하는 job / AWS에 쓰기 권한이 필요한 deploy job을 나누면, 권한 범위를 줄이기 쉽다.
- **브랜치 정책**: `main`만 프로덕션 배포, PR은 빌드만 등.

### 2. OIDC 연동 개요 (개념)

1. AWS IAM에 **OIDC 자격 공급자**(GitHub) 등록.
2. **신뢰 정책**에서 특정 리포·환경(`environment`)·브랜치만 허용.
3. 워크플로에서 `aws-actions/configure-aws-credentials` 등으로 역할을 가정(`assume-role`).
4. 이후 `aws cli`로 S3·CloudFront 등 호출.

세부 JSON은 AWS·공식 액션 문서가 최신이다.

### 3. 프론트(정적) 배포 시 자주 쓰는 단계

1. Node 설정(`actions/setup-node`), 캐시 선택.
2. `npm ci` (또는 워크스페이스 루트 정책에 맞게).
3. `client` 빌드.
4. `aws s3 sync dist/ s3://버킷/` (정확한 플래그는 정책에 맞게).
5. CloudFront 캐시 무효화(필요 시, 비용·한도 확인).

### 4. 서버 배포

플랫폼별로 다름: Beanstalk `eb deploy`, ECR 푸시 후 ECS 서비스 업데이트, App Runner API 호출 등. **한 워크플로에 프론트+서버**를 넣을지 **분리**할지는 변경 빈도·권한 분리로 결정한다.

### 5. 체크리스트

- [ ] Secrets에 **최소한의 값**만. 가능하면 OIDC 역할만
- [ ] 배포 실패 시 **롤백 전략**(이전 S3 버전, 이전 태스크 정의 등)을 한 줄이라도 문서화
- [ ] `workflow_dispatch`로 수동 배포 가능하게 해 두면 초기 디버깅에 유리([0019](./0019-github-actions.md))

### 6. 이 레포에 적용된 워크플로 (2026-05)

- 파일: [`.github/workflows/deploy-aws.yml`](../../.github/workflows/deploy-aws.yml) — `main` push·수동 실행, OIDC, 프론트 S3 sync + CloudFront invalidation, EB zip 업로드·버전·환경 업데이트.
- Variables·실패 패턴: [0034 첫 프로덕션 배포 회고](./0034-aws-first-production-deploy-success.md), [error-fixes/0003](../error-fixes/0003-aws-eb-cloudfront-cors-deploy.md), [error-fixes/0006 EB IAM 순차 보강](../error-fixes/0006-github-actions-eb-iam-deploy.md) (2026-06).

---

## 참고

- 선행: [0019 GitHub Actions](./0019-github-actions.md)
- 이전: [0031 프론트·API 연결](./0031-frontend-backend-integration-cors.md)
- 다음: [0033 운영·트러블슈팅](./0033-aws-ops-security-troubleshooting.md)
- 허브: [0025](./0025-aws-deployment-series-hub.md)
- 실전 회고: [0034](./0034-aws-first-production-deploy-success.md)
- [GitHub OIDC with AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) (공식)
