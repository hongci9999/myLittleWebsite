# 프론트와 API 연결 (베이스 URL·CORS·도메인)

날짜: 2026-05-04
태그: [배포, 프론트, 백엔드, 인프라, 개발방법론]

## 요약

브라우저에 로드된 프론트는 **절대 URL** 또는 **상대 경로**로 API를 호출한다. 프로덕션에서는 프론트 도메인과 API 도메인이 **다른 출처**가 되기 쉬워 **CORS**와 **API 베이스 URL**을 동시에 맞춰야 한다. 한 도메인으로 묶는 방식은 **리버스 프록시** 개념으로 이해한다.

---

## 핵심 개념

| 개념 | 설명 |
|------|------|
| **API 베이스 URL** | `fetch('https://api.example.com/api/...')` 처럼 공통 prefix. Vite는 `import.meta.env.VITE_*` 등으로 빌드 시 주입하는 패턴이 흔함 |
| **출처(origin)** | 스킴+호스트+포트. 프론트와 API가 다르면 “교차 출처” |
| **CORS preflight** | `Content-Type`, 커스텀 헤더 등 조건에 따라 `OPTIONS` 요청이 먼저 나감 |
| **프록시(개발)** | Vite `server.proxy`로 로컬에서는 같은 출처처럼 보이게 할 수 있음. **프로덕션 빌드에는 자동 적용되지 않음** |
| **경로 통합** | `https://example.com`(프론트) + `https://example.com/api`(API)처럼 한 호스트로 보이게 하려면 ALB/Nginx 등에서 경로 라우팅 |

---

## 상세 설명

### 1. 베이스 URL을 정하는 패턴

- **빌드 타임**: `VITE_API_BASE_URL`을 CI에서 주입 → 클라이언트 번들에 박힘. URL이 바뀌면 **재빌드** 필요.
- **런타임**: 배포 후 `config.json`을 한 번 fetch하거나, **같은 호스트** 아래 상대 경로 `/api`만 사용(프록시/통합 도메인이 있을 때).

이 레포는 개발 시 루트 `dev` 스크립트로 클라이언트·서버를 동시에 띄우고, Vite 프록시로 API를 묶는 구성일 수 있으므로, **프로덕션에서의 호출 경로**를 명시적으로 정리해 둔다.

### 2. Express CORS 점검

- 허용 `origin`에 **프로덕션 프론트 URL**을 넣는다(와일드카드 `*`는 쿠키·일부 헤더와 충돌할 수 있음).
- `OPTIONS` 라우트가 미들웨어에 막히지 않는지 확인한다.

### 3. “한 도메인” vs “URL 분리”

| 방식 | 장점 | 단점 |
|------|------|------|
| URL 분리(프론트 CF, API EB 등) | 구성 단순, 서비스별 스케일 | CORS·쿠키 도메인 설정 주의 |
| 한 도메인 + 경로 분리 | CORS 단순화 가능 | 프록시/ALB 라우팅 설정 필요 |

### 4. 체크리스트

- [ ] 브라우저 네트워크 탭에서 API 요청 URL이 **의도한 프로덕션 주소**인가
- [ ] CORS 에러 시: **요청 출처**, **응답 헤더**, **preflight 성공 여부**를 순서대로 본다
- [ ] 인증을 헤더로 보낸다면 허용 `Authorization`·`expose` 헤더 설정을 확인한다

---

## 참고

- 이전: [0030 Node API](./0030-aws-node-express-api-deployment.md)
- 다음: [0032 CI/CD](./0032-cicd-github-actions-aws.md)
- 선행: [0027 DNS·CORS](./0027-network-domain-https-for-deployment.md)
- 허브: [0025](./0025-aws-deployment-series-hub.md)
