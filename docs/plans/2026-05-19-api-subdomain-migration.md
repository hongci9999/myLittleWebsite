# API 서브도메인 이전 + 프론트 커스텀 도메인 가이드

날짜: 2026-05-19  
상태: 실행용 체크리스트  
목적: API를 **`api.mylittlewebsite.p-e.kr`** 로 옮기고, 루트 **`mylittlewebsite.p-e.kr`** 은 CloudFront(프론트)에 쓰기 위해 DNS·ACM·EB·GitHub를 단계별로 맞춘다.

**선행 문서**

- 현재 프로덕션 회고: [0034](../learnings/0034-aws-first-production-deploy-success.md)
- 호스팅 결정(현재): [0018](../decisions/0018-aws-production-split-hosting.md)
- CORS·Mixed Content: [error-fixes/0003](../error-fixes/0003-aws-eb-cloudfront-cors-deploy.md)

---

## 1. 왜 옮기는가

| 문제 (현재) | 이전 후 |
|-------------|---------|
| `mylittlewebsite.p-e.kr` = **API만** 사용 | 루트 = **사이트**, `api.` = **API** |
| 프론트 URL이 `….cloudfront.net` | `https://mylittlewebsite.p-e.kr/main` 가능 |
| DNS·역할이 헷갈림 | URL만 봐도 구분 |

**도메인 표기**: 실제 등록명은 소문자 **`mylittlewebsite.p-e.kr`**. 문서·ACM·DNS에 대문자 넣지 않는다.

---

## 2. 이전 전 · 후 아키텍처

### 현재 (2026-05-16 기준)

```text
브라우저 → https://d4a3hmxzy83r1.cloudfront.net     → S3 (프론트)
브라우저 → https://mylittlewebsite.p-e.kr/api/...   → ALB → EB (API)
```

### 목표

```text
브라우저 → https://mylittlewebsite.p-e.kr            → CloudFront → S3 (프론트)
브라우저 → https://api.mylittlewebsite.p-e.kr/api/... → ALB → EB (API)
```

| 리소스 | 식별자 (변경 없음) |
|--------|-------------------|
| CloudFront 배포 | `EAV5ODYEOW4VD` |
| S3 버킷 | `mylittlewebsite-dev-661596276927-ap-northeast-2-an` |
| EB 환경 | `MLWserver-env` / 앱 `MLWserver` |

---

## 3. 작업 순서 개요

| 단계 | 내용 | 프론트 URL 영향 |
|------|------|-----------------|
| **A** | `api.` ACM(서울) + DNS + EB HTTPS | 없음 (아직 cloudfront.net) |
| **B** | GitHub `VITE_API_BASE_URL` + 프론트 재배포 | API 호출만 변경 |
| **C** | 루트 ACM(**us-east-1**) + CloudFront 대체 도메인 | 사이트 주소 변경 |
| **D** | 루트 DNS → CloudFront, CORS·코드 정리 | 완료 |

**A→B**만 해도 API 주소 이전은 끝난다. **C→D**는 “cloudfront.net 대신 내 도메인으로 사이트 열기”다. 한 번에 해도 되고, A·B 다음 날 C·D 해도 된다.

---

## 4. 단계 A — API를 `api.mylittlewebsite.p-e.kr` 로

### A-1. ACM 인증서 (리전 **서울** `ap-northeast-2`)

1. **Certificate Manager** → 리전 **아시아 태평양(서울)**.
2. **인증서 요청** → 퍼블릭 → 도메인: `api.mylittlewebsite.p-e.kr`.
3. 검증: **DNS** → 표시된 **CNAME 이름·값**을 내도메인.한국에 추가.

**내도메인.한국 (고급설정 DNS → 별칭 CNAME)**

| 호스트(왼쪽) | 값(오른쪽) |
|--------------|------------|
| ACM이 준 `_xxxx…` 접두사 | `….acm-validations.aws` |

기존 **루트용** ACM 검증 CNAME(`mylittlewebsite.p-e.kr` 용)은 **발급 유지 중이면 그대로** 둔다.

4. 상태 **발급됨** 확인.

> EB/ALB용 인증서는 **반드시 서울**이다. CloudFront용은 **아래 C단계에서 us-east-1** 을 따로 만든다.

### A-2. EB 로드 밸런서 HTTPS

1. **Elastic Beanstalk** → **MLWserver-env** → **구성** → **로드 밸런서** → **편집**.
2. 리스너 **HTTPS 443**:
   - SSL 인증서: **`api.mylittlewebsite.p-e.kr`** (방금 발급한 서울 ACM).
   - 기본 프로세스: `default`, 활성화.
3. 리스너 **HTTP 80**: 유지(선택: 나중에 HTTPS 리다이렉트).
4. 프로세스 **default** — 상태 확인 경로: **`/api/health`**.
5. **적용** → Green 될 때까지 대기.

### A-3. DNS — `api` → ALB

1. EB **구성 → 로드 밸런서** 또는 EC2 콘솔에서 **ALB DNS 이름** 복사  
   (예: `awseb-e-xxxxx.ap-northeast-2.elb.amazonaws.com`).
2. 내도메인.한국 → `mylittlewebsite.p-e.kr` 수정:

| 타입 | 호스트 | 값 |
|------|--------|-----|
| CNAME | `api` | ALB DNS 이름 |

- **웹포워딩·단일페이지**: `api` 관련 없으면 루트만 확인. 루트는 **이 단계에서도 당분간 ALB**를 가리켜도 됨(아직 B에서 클라이언트만 바꿀 때).

3. 전파 후 확인:

```powershell
curl.exe -sS "https://api.mylittlewebsite.p-e.kr/api/health"
```

기대: `{"status":"ok"}`

### A-4. (선택) 루트 DNS

- **B·C 전**: `mylittlewebsite.p-e.kr` 이 여전히 ALB를 가리키면, 예전 API URL도 잠깐 동작할 수 있다.
- **C 이후**: 루트 CNAME은 **CloudFront**로 바꾸므로, 루트의 `/api/health`는 더 이상 API가 아니다.

---

## 5. 단계 B — GitHub·프론트 빌드

### B-1. Repository Variables (Settings → Actions → Variables)

| 변수 | 변경 후 값 |
|------|------------|
| `VITE_API_BASE_URL` | `https://api.mylittlewebsite.p-e.kr` |
| `EB_HEALTH_CHECK_URL` | `https://api.mylittlewebsite.p-e.kr/api/health` |

- 끝에 **`/` 없음**.
- `https` 필수.

### B-2. EB 환경 속성 (CORS — 이 단계)

프론트가 아직 `cloudfront.net` 이면 **기존 값 유지 +** 나중 C에서 바꿈:

```text
CORS_ALLOWED_ORIGINS=https://d4a3hmxzy83r1.cloudfront.net
```

(단계 D에서 `https://mylittlewebsite.p-e.kr` 로 교체.)

### B-3. 배포

- `main` 푸시 또는 **Actions → Deploy to AWS → Run workflow**.
- [CloudFront /main](https://d4a3hmxzy83r1.cloudfront.net/main)에서 GeekNews·즐겨찾기·네트워크 탭 API URL이 `api.mylittlewebsite.p-e.kr` 인지 확인.

### B-4. 로컬에서만 빌드 테스트할 때

```powershell
$env:VITE_API_BASE_URL="https://api.mylittlewebsite.p-e.kr"
npm run build -w client
```

---

## 6. 단계 C — 프론트에 `mylittlewebsite.p-e.kr` (CloudFront)

### C-1. ACM (리전 **미국 동부** `us-east-1`) — 필수

CloudFront 커스텀 도메인은 **버지니아 북부** 인증서만 연결된다.

1. 콘솔 리전을 **US East (N. Virginia)** 로 전환.
2. **ACM** → 인증서 요청 → `mylittlewebsite.p-e.kr`.
3. DNS 검증 CNAME을 **내도메인.한국**에 추가(호스트·값은 ACM 화면 그대로).
4. **발급됨** 확인.

### C-2. CloudFront 대체 도메인

1. **CloudFront** → 배포 `EAV5ODYEOW4VD` → **편집**.
2. **설정** 탭:
   - **대체 도메인 이름(CNAME)**: `mylittlewebsite.p-e.kr` 추가.
   - **사용자 지정 SSL 인증서**: **us-east-1** 의 `mylittlewebsite.p-e.kr` 인증서.
3. **Default root object**: `index.html` (기존 유지).
4. **Origin path**: 비움 ([walkthrough §3](./2026-05-04-aws-first-deploy-walkthrough.md) 참고).
5. (SPA) **사용자 정의 오류 응답**: 403·404 → `/index.html`, 응답 코드 **200** — 이미 있으면 유지.
6. 저장 후 배포 완료 대기.

### C-3. DNS — 루트 → CloudFront

CloudFront **일반** 탭의 **배포 도메인 이름** 복사 (예: `d4a3hmxzy83r1.cloudfront.net`).

**내도메인.한국**

| 타입 | 호스트 | 값 |
|------|--------|-----|
| CNAME | (루트 — 패널 규칙에 맞게 비움/`@`) | `d4a3hmxzy83r1.cloudfront.net` |

- **이때 루트가 ALB를 가리키던 CNAME은 제거·교체**한다. 같은 이름에 CNAME 하나만.
- `api` → ALB CNAME은 **유지**.

**웹포워딩·단일페이지(HTML)**: 루트에 켜져 있으면 **끈다**.

전파 후:

```text
https://mylittlewebsite.p-e.kr/main
```

---

## 7. 단계 D — CORS·코드·문서 정리

### D-1. EB `CORS_ALLOWED_ORIGINS`

```text
https://mylittlewebsite.p-e.kr
```

- 전환 기간: `https://d4a3hmxzy83r1.cloudfront.net,https://mylittlewebsite.p-e.kr` 처럼 **둘 다** 넣어도 된다.
- 안정화 후 cloudfront.net 출처는 제거 가능.

### D-2. 저장소 코드 (선택·권장)

| 파일 | 변경 예 |
|------|---------|
| `client/src/shared/config/projects.ts` | `demoUrl` → `https://mylittlewebsite.p-e.kr/main` |

`VITE_API_BASE_URL` 은 **GitHub Variable** 이므로 코드에 API 호스트를 하드코딩하지 않는다.

### D-3. 검증

```powershell
# API
curl.exe -sS "https://api.mylittlewebsite.p-e.kr/api/health"

# CORS (프론트 출처)
curl.exe -sSI -H "Origin: https://mylittlewebsite.p-e.kr" "https://api.mylittlewebsite.p-e.kr/api/health"
```

브라우저:

- [https://mylittlewebsite.p-e.kr/main](https://mylittlewebsite.p-e.kr/main) — 위젯 데이터 로드.
- 개발자 도구 — CORS·Mixed Content 없음.

### D-4. 문서 갱신 (이전 완료 후)

- [0034](../learnings/0034-aws-first-production-deploy-success.md) § URL 표
- [walkthrough §7](./2026-05-04-aws-first-deploy-walkthrough.md)
- [0018](../decisions/0018-aws-production-split-hosting.md) 상태·결과 (또는 후속 ADR)

---

## 8. GitHub Variables 최종 표

| 변수 | 최종 값 |
|------|---------|
| `VITE_API_BASE_URL` | `https://api.mylittlewebsite.p-e.kr` |
| `EB_HEALTH_CHECK_URL` | `https://api.mylittlewebsite.p-e.kr/api/health` |
| `S3_BUCKET_FRONTEND` | (기존 유지) |
| `CLOUDFRONT_DISTRIBUTION_ID` | `EAV5ODYEOW4VD` |
| `EB_*` | (기존 유지) |

---

## 9. EB 환경 속성 최종 표

| 이름 | 값 |
|------|-----|
| `LISTEN_HOST` | `0.0.0.0` |
| `NODE_ENV` | `production` |
| `CORS_ALLOWED_ORIGINS` | `https://mylittlewebsite.p-e.kr` |
| Supabase·Gemini 등 | (기존과 동일, 콘솔만) |

---

## 10. 인증서·DNS 한눈에

| 도메인 | ACM 리전 | 연결 대상 |
|--------|----------|-----------|
| `api.mylittlewebsite.p-e.kr` | **서울** | EB ALB :443 |
| `mylittlewebsite.p-e.kr` | **us-east-1** | CloudFront |
| ACM 검증용 `_xxx…` CNAME | — | 내도메인.한국에 **각각** 유지 |

---

## 11. 롤백 (막히면)

| 단계 | 되돌리기 |
|------|----------|
| API만 이상 | `VITE_API_BASE_URL` 을 이전 `https://mylittlewebsite.p-e.kr` 로, DNS `api` 제거, EB 인증서를 루트 인증서로 |
| 프론트만 이상 | CloudFront에서 대체 도메인 제거, 루트 DNS를 ALB 또는 제거, `cloudfront.net` 으로 접속 |
| CORS | `CORS_ALLOWED_ORIGINS` 에 실제 쓰는 프론트 URL만 남기기 |

---

## 12. 체크리스트

### API 이전 (A·B)

- [ ] ACM 서울 `api.mylittlewebsite.p-e.kr` 발급됨
- [ ] EB HTTPS 443 + api 인증서
- [ ] DNS `api` → ALB
- [ ] `https://api.mylittlewebsite.p-e.kr/api/health` → ok
- [ ] GitHub `VITE_API_BASE_URL`·`EB_HEALTH_CHECK_URL` 갱신
- [ ] Actions 배포 성공, cloudfront.net /main 에서 API 호출 성공

### 프론트 도메인 (C·D)

- [ ] ACM us-east-1 `mylittlewebsite.p-e.kr` 발급됨
- [ ] CloudFront 대체 도메인 + SSL
- [ ] DNS 루트 → CloudFront, `api` → ALB 유지
- [ ] `https://mylittlewebsite.p-e.kr/main` 로딩
- [ ] `CORS_ALLOWED_ORIGINS` 에 루트 HTTPS 출처
- [ ] `projects.ts` 등 공개 URL 정리(선택)

---

## 13. 자주 하는 실수

| 실수 | 결과 |
|------|------|
| CloudFront에 **서울** ACM 연결 | 콘솔에서 인증서 선택 불가 |
| 루트 CNAME을 CF·ALB **동시**에 | DNS 충돌, 한쪽만 동작 |
| `VITE_API_BASE_URL` 만 바꾸고 **재배포 안 함** | 번들에 예전 API URL |
| CORS에 새 프론트 URL **미추가** | 메인만 실패, `/api/health` 직접 접속은 성공 |
| Origin path에 `/index.html` | `/assets` 404 |

---

## 참고

- [0031 프론트·API·CORS](../learnings/0031-frontend-backend-integration-cors.md)
- [0027 HTTPS·출처](../learnings/0027-network-domain-https-for-deployment.md)
- [AWS CloudFront CNAME 요구사항](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html)
