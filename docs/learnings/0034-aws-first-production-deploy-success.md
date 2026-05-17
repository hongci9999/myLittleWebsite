# 첫 AWS 프로덕션 배포 성공 회고 (2026-05)

날짜: 2026-05-16
태그: [배포, aws, 인프라, 프론트, 백엔드, 개발방법론]

## 요약

`main` 푸시 시 GitHub Actions로 **프론트(S3 + CloudFront)** 와 **API(Elastic Beanstalk)** 를 배포하고, 브라우저에서 [CloudFront 메인](https://d4a3hmxzy83r1.cloudfront.net/main)이 [HTTPS API](https://mylittlewebsite.p-e.kr/api/health) 데이터(GeekNews·즐겨찾기 등)를 불러오는 것까지 확인했다. 이 문서는 **실제로 막혔던 지점과 해결**을 한곳에 모은 회고다.

---

## 최종 아키텍처

| 구분 | 리소스 | URL·식별자 |
|------|--------|------------|
| 프론트 | S3 + CloudFront (OAC) | `https://d4a3hmxzy83r1.cloudfront.net` |
| S3 버킷 | `mylittlewebsite-dev-661596276927-ap-northeast-2-an` | — |
| CloudFront 배포 | `EAV5ODYEOW4VD` | — |
| API | Elastic Beanstalk `MLWserver` / `MLWserver-env` | `https://mylittlewebsite.p-e.kr` |
| TLS (API) | ACM `ap-northeast-2`, 도메인 `mylittlewebsite.p-e.kr` | ALB 리스너 **443 HTTPS** |
| DNS | 내도메인.한국 `mylittlewebsite.p-e.kr` | CNAME → ALB + ACM 검증 CNAME |
| CI/CD | `.github/workflows/deploy-aws.yml` | OIDC 역할 `github-actions-mylittlewebsite-deploy` |
| DB·Auth | Supabase | EB 환경 속성에 URL·키 (콘솔만) |

**트래픽 흐름**

```text
브라우저 → CloudFront (HTTPS) → S3 (정적 dist)
브라우저 → mylittlewebsite.p-e.kr (HTTPS, ALB) → EC2 Node (LISTEN_HOST=0.0.0.0)
```

프론트·API **호스트가 다르므로** CORS와 빌드 타임 `VITE_API_BASE_URL` 이 필수다 ([0031](./0031-frontend-backend-integration-cors.md)).

---

## GitHub Actions 변수·시크릿 (실제 사용)

| 종류 | 이름 | 용도 |
|------|------|------|
| Secret | `AWS_ROLE_ARN` | OIDC assume 역할 |
| Variable | `AWS_REGION` | `ap-northeast-2` |
| Variable | `S3_BUCKET_FRONTEND` | 프론트 `aws s3 sync` 대상 |
| Variable | `CLOUDFRONT_DISTRIBUTION_ID` | 배포 후 `/*` invalidation |
| Variable | `VITE_API_BASE_URL` | `https://mylittlewebsite.p-e.kr` (끝 `/` 없음) |
| Variable | `EB_APPLICATION_NAME` | `MLWserver` |
| Variable | `EB_ENVIRONMENT_NAME` | `MLWserver-env` |
| Variable | `EB_S3_BUCKET` | EB 버전 zip 업로드 버킷 (`elasticbeanstalk-ap-northeast-2-…`) |
| Variable | `EB_HEALTH_CHECK_URL` | `https://mylittlewebsite.p-e.kr/api/health` |

워크플로 헤더 주석과 동일: [`.github/workflows/deploy-aws.yml`](../../.github/workflows/deploy-aws.yml).

---

## EB 환경 속성 (프로덕션 최소)

| 이름 | 값 | 이유 |
|------|-----|------|
| `LISTEN_HOST` | `0.0.0.0` | ALB→인스턴스 Node 연결 |
| `NODE_ENV` | `production` | 관례 |
| `CORS_ALLOWED_ORIGINS` | `https://d4a3hmxzy83r1.cloudfront.net` | 교차 출처 API 허용 |
| Supabase·Gemini 등 | (로컬 `.env`와 동일 키) | 서버만 사용, GitHub에 넣지 않음 |

`PORT`는 EB 플랫폼 값을 **덮어쓰지 않음**.

로드 밸런서: **Application Load Balancer**, 프로세스 헬스 **`/api/health`**, 리스너 **80 HTTP + 443 HTTPS**(ACM 인증서).

---

## 막혔던 문제 → 해결 (요약)

| 증상 | 원인 | 해결 |
|------|------|------|
| CloudFront에서 `/assets` 404 | 오리진 **Origin path**에 `/index.html` 입력 | Origin path **비움**, Default root object만 `index.html` |
| GeekNews·링크 비어 있음, Mixed Content | HTTPS 페이지가 **HTTP EB URL** 호출 | API **HTTPS** (`https://mylittlewebsite.p-e.kr`) + `VITE_API_BASE_URL` 재빌드 |
| API URL은 맞는데 여전히 실패 | **CORS** — CloudFront 출처 미허용 | `CORS_ALLOWED_ORIGINS`에 CloudFront HTTPS URL |
| EB **Degraded**, `Expected version n/a` | `create-application-version`만 성공, `update-environment` 실패 | 콘솔 **애플리케이션 버전 → 환경 배포** + IAM **CloudFormation** (`awseb-*`) |
| Actions EB zip 단계 실패 | Ubuntu `zip -C` 미지원, zip이 staging 안에 생성 | [`scripts/package-eb-bundle.sh`](../../scripts/package-eb-bundle.sh)에서 루트 절대 경로로 출력 |
| EB 버전 라벨 충돌(재실행) | 동일 `VERSION_LABEL` | `gh-${SHA::7}-${RUN_ID}-${RUN_ATTEMPT}` |
| `/api/health` 직접 접속은 OK, CF 메인만 실패 | 위 **CORS** (health는 Origin 없음) | EB 환경 속성 수정 후 재시작 |

상세: [error-fixes/0003](../error-fixes/0003-aws-eb-cloudfront-cors-deploy.md), 의사결정: [decisions/0018](../decisions/0018-aws-production-split-hosting.md).

---

## 검증 체크리스트 (성공 기준)

- [ ] `https://mylittlewebsite.p-e.kr/api/health` → `{"status":"ok"}`
- [ ] `curl -H "Origin: https://d4a3hmxzy83r1.cloudfront.net" -I https://mylittlewebsite.p-e.kr/api/health` 에 `Access-Control-Allow-Origin` 포함
- [ ] `https://d4a3hmxzy83r1.cloudfront.net/main` — GeekNews·즐겨찾기 로드, 콘솔에 CORS·Mixed Content 없음
- [ ] EB 환경 **Green**
- [ ] `main` 푸시 후 Actions **Deploy to AWS** 성공 (프론트 sync + EB 버전 + invalidation)

---

## 다음에 하면 좋은 것

- 프론트도 `mylittlewebsite.p-e.kr` 로 쓰려면 CloudFront **커스텀 도메인** + ACM **us-east-1** 인증서
- EB **api.** 서브도메인 분리(루트 CNAME 제약 회피)
- Actions 실패 시 Slack/이메일 알림, 스테이징 환경 분리
- 무료 도메인 **갱신 주기** 캘린더 등록 (내도메인.한국)

---

## 참고

- 실습 순서: [walkthrough](../plans/2026-05-04-aws-first-deploy-walkthrough.md)
- 허브: [0025](./0025-aws-deployment-series-hub.md)
- CI/CD 개념: [0032](./0032-cicd-github-actions-aws.md)
