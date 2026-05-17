# 첫 AWS 배포 실습 가이드 (단계별)

날짜: 2026-05-04  
목적: 이 레포(Vite 클라이언트 + Express API + Supabase)를 **처음부터 끝까지 한 번** 따라가며 배포 감각을 잡는다.  
선행 학습: [0025 허브](../learnings/0025-aws-deployment-series-hub.md)에서 링크된 0026~0033.

---

## 진행 순서 한눈에

| 단계 | 하는 일 | 대략 시간 |
|------|-----------|-----------|
| 0 | 로컬에서 프로덕션 빌드 확인 | 10분 |
| 1 | AWS 계정·리전·IAM(읽기만) | 15분 |
| 2 | S3에 프론트(`client/dist`) 올리기 | 20~40분 |
| 3 | (선택) CloudFront + HTTPS | 30~60분 |
| 4 | API 서버 (**Elastic Beanstalk**) | 1~2시간 |
| 5 | 프론트 ↔ API URL·CORS 맞추기 | 30분~ |

**추천**: 오늘은 **0 → 1 → 2**까지만 끝내도 성공이다. 3~5는 다음 세션으로 넘겨도 된다.

**API**: 4단계는 **Elastic Beanstalk** 전제로 적어 두었다(App Runner 등은 [0030 §3](../learnings/0030-aws-node-express-api-deployment.md)).

---

## 0. 로컬에서 프로덕션 빌드 확인

### 0.1 빌드

저장소 루트에서:

```bash
npm run build
```

- `client`: `dist/` 생성
- `server`: `dist/` 생성

### 0.2 API만 프로덕션 모드로 띄워 보기

배포 환경에서는 **모든 인터페이스에서 수신**해야 로드밸런서가 붙는다. 이 레포는 환경 변수로 조정한다.

```bash
cd server
npm run build
set LISTEN_HOST=0.0.0.0
set PORT=3001
npm run start
```

- **`set`(cmd) / `$env:`(PowerShell)** 는 **현재 터미널 세션에만** 적용된다. 창을 닫으면 사라지며, 소스 코드나 전역 설정은 바뀌지 않는다. 이 세션에서 실행한 `npm run start` 자식 프로세스만 위 값을 물려받는다.
- PowerShell이면 `set` 대신: `$env:LISTEN_HOST='0.0.0.0'; $env:PORT='3001'; npm run start`

브라우저에서 `http://127.0.0.1:3001/api/health` 가 JSON `{ "status": "ok" }` 를 반환하면 된다.

### 0.3 프론트 정적 미리보기

```bash
cd client
npm run build
npm run preview
```

`preview`는 로컬에서 `dist`를 서빙한다. **운영에서 API를 쓰려면** 별도로 API URL·CORS를 맞춰야 한다(5단계, [0031](../learnings/0031-frontend-backend-integration-cors.md)).

---

## 1. AWS 계정·리전·IAM

[0028 학습 문서](../learnings/0028-aws-account-region-iam-billing.md) 순서대로:

1. **루트 계정 MFA** 설정.
2. 콘솔 우측 상단 **리전**을 고정한다(예: `서울 ap-northeast-2`).
3. 일상 작업용 **IAM 사용자** 생성(콘솔 로그인 또는 CLI용). 루트로는 로그인하지 않는 습관.

이 단계에서는 **S3·CloudFront**에 쓸 권한이 있는 사용자/역할만 있으면 2~3단계로 진행 가능하다(최소 권한 정책은 나중에 다듬어도 됨).

---

## 2. S3에 정적 사이트 올리기 (프론트만)

[0029](../learnings/0029-aws-static-frontend-vite-s3-cloudfront.md) 개념과 병행.

### 2.1 S3 버킷 생성

1. AWS 콘솔 → **S3** → **버킷 만들기**.
2. 버킷 이름: 전 세계 고유 문자열(예: `mylittlewebsite-dev-본인별칭`).
3. 리전: 1단계에서 고른 것과 동일.
4. **퍼블릭 액세스 차단**은 기본(모든 차단)으로 두는 것을 권장한다. 정적 웹을 **CloudFront 뒤**에 둘 계획이면 버킷은 비공개로 두고 OAC로 연결한다.
5. **학습용으로만** “정적 웹 사이트 호스팅”을 켜고 버킷을 잠깐 공개하는 방식도 가능하나, HTTPS·도메인까지 가려면 결국 CloudFront를 쓰게 되므로 **처음부터 CloudFront 연동을 목표로 비공개 버킷**을 추천한다.

### 2.2 객체 업로드

1. 빌드한 `client/dist/` **안의 파일 전부**를 버킷 **루트**에 업로드한다(`index.html`이 루트에 와야 함).
2. Windows 탐색기에서 드래그하거나, 이후 익숙해지면 AWS CLI `aws s3 sync` 사용.

### 2.3 (간이) 공개 읽기로 확인만 하는 경우

정책을 잘못 열면 위험하므로 **짧은 실험·즉시 원복** 전제로만:

- 버킷 → **권한** → 버킷 정책에 `GetObject` 허용(특정 버킷 ARN만).
- **정적 웹 사이트 호스팅** 활성화, 인덱스 문서 `index.html`.

웹사이트 엔드포인트 URL로 접속해 본다.

### 2.4 SPA(클라이언트 라우팅) 주의

직접 URL이나 새로고침 시 404가 나면 CloudFront **커스텀 에러 응답**(403/404 → `/index.html`, 200) 등이 필요하다. 상세는 [0029](../learnings/0029-aws-static-frontend-vite-s3-cloudfront.md).

---

## 3. (선택) CloudFront

1. **CloudFront** → 배포 생성 → 오리진은 위 S3 버킷.
2. **OAC(오리진 액세스 제어)** 로 버킷 비공개 유지.
3. 기본 루트 객체: `index.html`.
4. 배포 도메인(예: `dxxxx.cloudfront.net`)으로 접속 확인.
5. SPA면 2.4와 동일하게 에러 응답 설정.

**주의(2026-05-16 트러블슈팅 반영):** 오리진의 **Origin path** 는 버킷 안 **폴더 prefix**(예: `production/`에만 객체를 올렸을 때)일 때만 쓴다. `client/dist` 내용을 버킷 **루트**에 올렸다면 **비운다**. 여기에 `/index.html` 을 넣으면 뷰어가 요청한 경로 앞에 붙어 `/assets/...` 가 깨진다. **`index.html` 은 배포 설정의 Default root object 로만 지정**한다.

---

## 4. API 서버 (Express) — Elastic Beanstalk

개념·체크리스트: [0030](../learnings/0030-aws-node-express-api-deployment.md) (§5 EB).

### 4.1 콘솔에서 할 일 요약

1. **Elastic Beanstalk** → **새 환경 생성** → 웹 서버 환경.
2. **플랫폼**: Node.js(예: Amazon Linux 2023 기반). 버전은 로컬 Node와 가깝게.
3. **애플리케이션 코드**: 아래 §4.2처럼 만든 zip을 업로드하거나, 빈 환경을 만든 뒤 **버전 업로드**로 재배포.
4. 환경이 **Green** 될 때까지 대기 후, 부여된 URL(예: `http://xxxx.elasticbeanstalk.com`)으로 접속 테스트.

### 4.2 배포 버들(권장: `server` 루트)

모노레포에서는 **업로드(zip) 안의 최상단이 곧 EB 애플리케이션 디렉터리**이다. 플랫폼 기본값은 여기서 `npm install` 후 `npm start`에 가깝게 동작하므로, **처음에는 `server` 폴더 내용만** 묶는다.

1. 로컬에서 `server` 디렉터리로 이동해 **`npm run build`** 로 `dist/` 생성 (위 [0절](#0-로컬에서-프로덕션-빌드-확인) 참고).
2. **포함 파일**: `package.json`(필수), 로컬에서 만든 **`dist/`**. 선택: `src`(인스턴스에서 빌드할 때만). 의존성은 **인스턴스에서 `npm install`**(EB 기본)·또는 **로컬 `npm ci --omit=dev` 후 `node_modules`를 zip에 포함**(재현성·무거운 번들) 중 선택. 이 레포는 lock 파일이 **루트 워크스페이스**에만 있는 경우가 많아 `server/`만 묶으면 **`package-lock` 없이 `npm install`** 로 가는 편이 실무에서 흔하다.
3. 상위 디렉터리에 zip을 만들려면 예: 위 구성이 갖춰진 상태에서 `server` 폴더 선택 후 압축(윈도우: 폴더 우클릭 → 보내기 → 압축 폴더 → zip 내부가 `package.json` 바로 아래부터 오도록: **zip을 풀었을 때 루트에 `package.json`이 보이게** 한다).

세부 패키징 예시 명령(Git Bash / WSL):

```bash
cd server
npm run build
# (선택 A) 다음 줄 생략 — EB에서 npm install
# (선택 B) npm ci --omit=dev
zip -r ../my-api-eb.zip . -x "node_modules/.cache/*"
```

### 4.3 환경 구성(환경 속성)

**구성** → **소프트웨어** → **환경 속성**에서 최소한:

| 이름 | 값 | 이유 |
|------|-----|------|
| `LISTEN_HOST` | `0.0.0.0` | 로드밸런서/프록시가 인스턴스의 Node에 붙을 수 있게 함 |
| `NODE_ENV` | `production` | 일반적 관례(앱이 분기할 때) |
| (로컬 `.env`와 동일) | Supabase·Gemini 등 | 서버 코드가 읽는 이름 그대로. **값은 콘솔에만** |

**`PORT`**: EB Node 플랫폼이 보통 설정한다. **직접 덮어쓰지 않는 것이 안전**하다.

### 4.4 로드밸런서 헬스 체크

**환경 구성** → **로드 밸런서** 또는 **프로세스 헬스**(플랫폼/UI 문구에 따름):

- 헬스 체크 **경로**를 **`/health`** 또는 **`/api/health`** 로 지정한다(이 레포 두 엔드포인트 모두 사용 가능).

기본 경로(`/`)만 두어도 **JSON을 주는 헬스**가 아니면 간헐적 실패를 줄 수 있어, 명시를 권장한다.

### 4.5 EB CLI(선택)

로컬에 [AWS EB CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html)를 설치했다면:

- `eb init` → 리전·애플 선택  
- 애플 루트를 **`server`** 로 두거나, 위와 같은 zip 패키지 흐름과 맞춰 디렉터리 정리 후 `eb create`, `eb deploy`

IAM 사용자에게 EB·S3 버킷·CloudWatch 등 접근이 필요할 수 있다(막히면 정책 보강).

### 4.6 배포 검증

- 브라우저 또는 curl: `https://환경주소/api/health` → `{"status":"ok"}` (HTTPS는 플랫폼 설정에 따라 ALB 종료 후 제공).
- **로그**: EB 콘솔에서 **요청 로그·인스턴스 로그**(또는 CloudWatch 로그 스트림)로 `ECONNRESET`·빌드 실패 확인.

### 4.7 CORS

개발 중에는 Vite가 `/api`를 **프록시**하므로 출처가 같아 보인다. 프론트(S3/CloudFront)와 API URL(**`*.elasticbeanstalk.com`**)이 **달라지면** 브라우저가 CORS를 검사한다. `cors` 패키지 등으로 프로덕션 프론트 출처를 허용해야 할 수 있다([0031](../learnings/0031-frontend-backend-integration-cors.md)).

---

## 5. 프론트에서 API 주소 맞추기

- 빌드 시 `VITE_*` 환경 변수로 API 베이스 URL을 넣거나,
- 런타임에 `/api`를 **같은 도메인**의 리버스 프록시로 넘기는 방식.

클라이언트 코드가 현재 **상대 경로 `/api`**만 쓰면, 운영에서도 **같은 호스트에 API가 있어야** 추가 설정 없이 동작한다. URL을 분리할 계획이면 클라이언트 수정 + CORS가 필요하다.

---

## 6. CI/CD (GitHub Actions)

수동 배포가 한 번 성공하면 [0032](../learnings/0032-cicd-github-actions-aws.md)대로 GitHub Actions + OIDC를 연다.

- 워크플로: [`.github/workflows/deploy-aws.yml`](../../.github/workflows/deploy-aws.yml)
- EB 패키징: [`scripts/package-eb-bundle.sh`](../../scripts/package-eb-bundle.sh)
- Variables·Secret 목록: 워크플로 상단 주석, [0034 § GitHub Variables](../learnings/0034-aws-first-production-deploy-success.md)

IAM 역할에 EB S3 버킷·`elasticbeanstalk:*`·`awseb-*` CloudFormation 권한이 필요하다. `update-environment`만 실패하면 EB는 **Degraded**(`Expected version n/a`)가 될 수 있다 → [error-fixes/0003](../error-fixes/0003-aws-eb-cloudfront-cors-deploy.md).

---

## 7. 프로덕션 배포 완료 기록 (2026-05-16)

**상태: 첫 end-to-end 성공** — 상세 회고는 [0034](../learnings/0034-aws-first-production-deploy-success.md), 구조 결정은 [0018](../decisions/0018-aws-production-split-hosting.md).

| 구분 | URL·리소스 |
|------|------------|
| 프론트 | https://d4a3hmxzy83r1.cloudfront.net |
| API | https://mylittlewebsite.p-e.kr |
| API 헬스 | https://mylittlewebsite.p-e.kr/api/health |
| EB | `MLWserver` / `MLWserver-env` |
| S3 | `mylittlewebsite-dev-661596276927-ap-northeast-2-an` |
| CloudFront | `EAV5ODYEOW4VD` |

**필수 설정 요약**

- `VITE_API_BASE_URL=https://mylittlewebsite.p-e.kr` (HTTPS, Actions 빌드)
- `CORS_ALLOWED_ORIGINS=https://d4a3hmxzy83r1.cloudfront.net`
- `LISTEN_HOST=0.0.0.0`, ALB 헬스 `/api/health`, ACM + HTTPS **443**

---

## 점검 체크리스트

- [x] `npm run build` 성공
- [x] `LISTEN_HOST=0.0.0.0` 일 때 `/api/health` 응답 확인
- [x] S3(또는 CloudFront)에서 `index.html` 로딩
- [x] EB 환경 **Green**, `/api/health` 응답, **`LISTEN_HOST=0.0.0.0`** 환경 속성 확인
- [x] HTTPS API + CloudFront 메인에서 CORS·Mixed Content 없이 위젯 데이터 로드
- [ ] 실험 리소스 **태그**·**삭제/중지** 습관([0033](../learnings/0033-aws-ops-security-troubleshooting.md))

---

## 참고

- 서버 바인딩: `server/src/index.ts`의 `LISTEN_HOST`(기본 `127.0.0.1`).
- API 헬스: `GET /api/health`, `GET /health`.
- 트러블슈팅 모음: [error-fixes/0003](../error-fixes/0003-aws-eb-cloudfront-cors-deploy.md).
