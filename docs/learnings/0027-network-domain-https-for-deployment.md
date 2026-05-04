# 네트워크·도메인·HTTPS (배포 맥락)

날짜: 2026-05-04
태그: [배포, 인프라, 프론트, 백엔드]

## 요약

사용자 브라우저는 **도메인 이름**으로 서버를 찾고, **HTTPS**로 암호화된 채널을 연다. 프론트와 API가 **서로 다른 출처(origin)** 이면 브라우저가 **CORS** 규칙으로 요청을 제한할 수 있어, 배포 후에야 문제가 드러나기 쉽다.

---

## 핵심 개념

| 개념 | 한 줄 설명 |
|------|------------|
| **DNS** | `example.com` 같은 이름을 IP 주소로 바꿔 주는 분산 디렉터리 |
| **A / AAAA 레코드** | 도메인 → IPv4 / IPv6 |
| **CNAME** | 도메인 → 다른 도메인 이름(별칭). 루트 도메인 제약이 있을 수 있음 |
| **Origin(출처)** | 스킴(`https`) + 호스트 + 포트. `https://app.example.com` 과 `https://api.example.com` 은 출처가 다름 |
| **HTTPS** | TLS로 HTTP 트래픽 암호화. 인증서로 서버 신원을 검증 |
| **리버스 프록시** | 클라이언트 앞단에서 TLS 종료·라우팅·캐시를 담당(Nginx, ALB, CloudFront 등) |
| **CORS** | **브라우저**가 다른 출처로의 요청에 대해 허용 여부를 검사하는 정책. 서버가 `Access-Control-Allow-Origin` 등으로 응답해야 통과 |

---

## 상세 설명

### 1. DNS가 배포와 만나는 지점

- 사용자에게 **기억하기 쉬운 주소**를 준다.
- 프론트(S3/CloudFront)와 API(Beanstalk 등)를 **같은 브랜드 도메인** 아래에 두려면, DNS에서 각각을 가리키게 설정한다(세부는 호스팅 가이드에 따름).
- 배포 직후 “아직 안 열린다”면 **DNS 전파 지연**·TTL·잘못된 레코드 타입을 의심한다.

### 2. HTTPS가 필요한 이유

- 비밀번호·세션·토큰이 평문으로 나가면 중간에 탈취될 수 있다.
- 브라우저·API 일부 기능은 **HTTPS에서만** 동작하거나 권장된다.
- AWS에서는 CloudFront·ALB·API Gateway 등이 **인증서 연결(ACME, ACM)** 을 돕는다.

### 3. CORS는 “배포 후” 이슈가 되기 쉽다

로컬에서는 Vite 프록시로 **같은 출처처럼** 보이게 개발하는 경우가 많다. 프로덕션에서:

- 프론트: `https://d123.cloudfront.net`
- API: `https://myapi.elasticbeanstalk.com`

이면 **출처가 다르다**. API 서버(Express)에서 `Access-Control-Allow-Origin`에 프론트 출처를 명시하거나, **한 도메인 뒤에서 경로로 나누는** 방식(리버스 프록시)을 검토한다. 자세한 점검은 [0031](./0031-frontend-backend-integration-cors.md).

### 4. 절차 체크리스트 (네트워크)

- [ ] 프론트·API의 **최종 URL**(스킴 포함)을 문서에 적어 둔다.
- [ ] API가 허용할 **브라우저 출처 목록**을 정한다.
- [ ] HTTPS 인증서가 **어느 레이어**에서 종료되는지(CloudFront vs 오리진) 이해한다.

---

## 참고

- 이전: [0026 배포 공통 개념](./0026-deployment-common-concepts.md)
- 다음: [0028 AWS 계정·IAM](./0028-aws-account-region-iam-billing.md)
- 허브: [0025](./0025-aws-deployment-series-hub.md)
