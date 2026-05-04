# 정적 프론트엔드(Vite) on AWS — S3·CloudFront

날짜: 2026-05-04
태그: [배포, aws, 프론트, 인프라, 도구]

## 요약

`client`는 `vite build` 후 **정적 파일**(`dist/`)만 있으면 된다. AWS에서는 보통 **S3**에 올리고 **CloudFront**로 HTTPS·CDN을 제공한다. **SPA(클라이언트 라우팅)** 는 “404를 index로” 같은 **오류 문서/함수** 설정이 없으면 새로고침 시 깨질 수 있다.

---

## 핵심 개념

| 개념 | 설명 |
|------|------|
| **S3** | 객체 저장소. 정적 웹 호스팅으로 HTML·JS·CSS를 서빙 가능 |
| **CloudFront** | CDN + 엣지에서 캐시. HTTPS 종료, 지리적으로 가까운 응답 |
| **OAC / OAI** | CloudFront가 S3 오리진에 접근할 때 쓰는 **오리진 접근 제어**(버킷을 비공개로 두고 CF만 읽게) |
| **캐시 무효화(invalidation)** | 배포 후 이전 파일이 엣지에 남아 있을 때 `/*` 등으로 무효화(비용·한도 주의) |
| **SPA 라우팅** | 서버가 `/about` 경로의 파일을 몰라도, 브라우저가 `index.html`을 받은 뒤 라우터가 처리. **직접 URL 접속·새로고침** 시 오리진이 404를 내지 않게 설정 필요 |

---

## 상세 설명

### 1. 이 레포에서의 빌드

- 루트: `npm run build -w client` (또는 워크스페이스에 맞는 명령)
- 산출물: `client/dist/` (HTML, JS 청크, `assets/`, `public` 복사본 등)

`vite.config`의 `base`가 `/`가 아니면 S3·CloudFront의 **경로 prefix**와 맞춰야 한다.

### 2. S3만 쓰는 경우 vs CloudFront 추가

| 방식 | 장점 | 주의 |
|------|------|------|
| S3 정적 웹사이트 | 단순 | HTTPS는 별도(예: CF 없이는 제한적)·커스텀 도메인+HTTPS는 보통 CF 권장 |
| S3 + CloudFront | HTTPS, 캐시, WAF 연동 용이 | OAC 설정, 캐시 TTL·무효화 이해 필요 |

### 3. 절차 개요 (학습용)

1. 로컬에서 `client` 빌드가 성공하는지 확인한다.
2. S3 버킷 생성, **버킷 정책**은 OAC/OAI 패턴에 맞게(공개 읽기 최소화 권장).
3. `dist/` 내용을 버킷 루트(또는 prefix)에 업로드한다.
4. CloudFront 배포 생성: 오리진 S3, 기본 루트 객체 `index.html`.
5. **SPA**면 CloudFront **커스텀 에러 응답**(403/404 → `/index.html`, 200) 또는 **Lambda@Edge/CloudFront Functions** 등 프로젝트 표준 방식을 문서에 따른다.
6. 배포 URL로 접속해 라우트·자산 경로를 확인한다.

### 4. 체크리스트

- [ ] 빌드 산출물에 **환경별 API URL**이 필요하면 빌드 타임 변수(`import.meta.env` 등)로 주입했는가
- [ ] `index.html` 외 경로 **직접 접속**이 동작하는가
- [ ] 대용량 `public/` 자산 경로가 깨지지 않는가

---

## 참고

- 이전: [0028 AWS 계정·IAM](./0028-aws-account-region-iam-billing.md)
- 다음: [0030 Node API](./0030-aws-node-express-api-deployment.md)
- 허브: [0025](./0025-aws-deployment-series-hub.md)
- [Vite 배포 가이드](https://vite.dev/guide/static-deploy.html) — S3 등 일반적 패턴 요약
