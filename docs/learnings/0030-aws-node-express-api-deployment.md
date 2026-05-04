# Node(Express) API on AWS

날짜: 2026-05-04
태그: [배포, aws, 백엔드, 인프라, 도구]

## 요약

`server`는 TypeScript를 `tsc`로 컴파일한 뒤 `node dist/index.js`로 실행하는 **장기 실행 프로세스** 모델이다. AWS에서는 **관리형 PaaS**로 시작하기 쉬운 선택지(Elastic Beanstalk, App Runner)와 **컨테이너**(ECS Fargate)·**단일 VM**(EC2)이 있다. DB는 **Supabase**를 그대로 두고, 서버 환경 변수만 맞추면 된다.

---

## 핵심 개념

| 개념 | 설명 |
|------|------|
| **프로세스** | Node가 리스닝하는 HTTP 서버(Express `listen`) |
| **포트** | 플랫폼이 `PORT` 환경 변수를 주는 경우가 많음. 하드코딩 `5000`만 믿지 말 것 |
| **헬스 체크** | 로드밸런서가 `GET /health` 같은 경로로 살아 있는지 판별 |
| **Elastic Beanstalk** | 코드/아티팩트 업로드 → 플랫폼이 EC2·로드밸런서 등을 구성(학습·중소 규모에 무난) |
| **App Runner** | 컨테이너 이미지 또는 소스에서 배포. 설정이 Beanstalk보다 단순한 편 |
| **ECS Fargate** | 컨테이너 오케스트레이션. 유연하지만 개념(태스크·서비스·ALB)이 많음 |
| **EC2** | VM 한 대에 직접 Node·systemd·Nginx. 유연하나 운영 부담 큼 |

---

## 상세 설명

### 1. 이 레포의 서버 빌드·실행

`server/package.json` 기준:

- `npm run build` → `tsc` → `dist/`
- `npm run start` → `node dist/index.js`

배포 파이프라인에서는 **프로덕션 의존성만** 설치할지, devDependencies 포함할지 정책을 맞춘다.

### 2. 환경 변수(예시 카테고리)

Supabase URL·Anon/Service 키, Ollama/Gemini 등 **서버 전용** 비밀은 호스팅 콘솔의 환경 변수로 주입한다. 이름은 로컬 `.env`와 동일하게 맞추면 운영이 단순하다.

### 3. 선택지 비교 (한 줄)

| 옵션 | 느낌 |
|------|------|
| Beanstalk | “전통적인” 웹앱 배포 경험에 가깝다 |
| App Runner | 컨테이너/소스 기반, 빠르게 URL 하나 받기 좋다 |
| ECS | 팀 단위·마이크로서비스로 확장할 때 |
| EC2 | 모든 것을 직접 제어하고 싶을 때(학습용으로는 이해에 도움) |

### 4. 절차 개요 (학습용)

1. 로컬에서 `npm run build -w server` 후 `npm run start -w server`로 프로덕션 모드 검증.
2. 선택한 플랫폼에 **Node 버전**을 로컬과 맞춘다.
3. 환경 변수·시크릿을 콘솔에 등록한다.
4. 헬스 엔드포인트를 플랫폼 헬스 체크에 연결한다.
5. 공개 URL로 API 스모크 테스트(`GET /api/health` 등).

### 5. Elastic Beanstalk(EB) 요점 — 이 레포에 맞게

Elastic Beanstalk는 **웹 계층(로드밸런서 + EC2 여러 개 등)** 과 **플랫폼(Node 런타임)** 을 묶어 주는 배포 형태이다. 앱 디렉터리에 버전 번들(zip 등)을 올리면 인스턴스에서 `npm install`·`npm start`(또는 동일 시작 명령)로 프로세스를 띄운다.

#### EB가 하는 일과 맞춰야 할 코드

| 항목 | 이 프로젝트 |
|------|-------------|
| **리스닝 주소** | 인스턴스 앞에는 보통 로드밸런서(또는 프록시)가 있다. **`LISTEN_HOST=0.0.0.0`** 이 없으면 외부·프록시가 붙지 않을 수 있다. |
| **포트** | EB Node 플랫폼은 보통 **`PORT` 환경 변수**를 앱에 넘긴다. 코드는 이미 `process.env.PORT`를 사용하면 된다. |
| **시작 명령** | `server/package.json`의 `npm run start` → `node dist/index.js`. 배포 버들 루트가 `server`와 동일해야 한다. |
| **헬스** | 타깃 그룹/프로세스 헬스 체크 경로를 **`/health` 또는 `/api/health`** 로 맞춘다([`index.ts`](../../server/src/index.ts)). 기본 `/` 만 두면 SPA가 아니면 괜찮지만, 명시하는 편이 안전하다. |

#### 모노레포에서 올리는 버들(현실적인 둘)

1. **`server/`만** 디렉터리로 간주해 zip 한다. 로컬에서 `npm run build`까지 해 두고 **`dist/`를 포함**한 뒤, 인스턴스에서는 `npm ci --omit=dev`(또는 EB가 하는 `npm install --production`)로 **런타임 의존성만** 깔거나, 같은 이유로 **생산용 `node_modules`를 같이 포함**하기도 한다.  
   - 타입스크립트(`tsc`)는 **운영 서버에서 돌리지 않으려면** 로컬/CI에서 빌드한 **`dist`** 를 zip에 넣는 방식이 단순하다.
2. 루트 전체 zip은 EB 앱 디렉터리가 깊어져 **시작 디렉터리 설정**(.ebextensions, `leader_only` 명령, 또는 Procfile 의 `cwd`)이 필요할 수 있다. 처음엔 **버들 루트 = `server`** 를 권장한다.

#### IAM(혼자 쓸 때)

IAM 사용자에게 **Elastic Beanstalk 콘솔·배포**까지 하려면, 관리형으로는 `AdministratorAccess`(이전 학습 선택)외에 **`AWSElasticBeanstalkFullAccess`** + EC2/VPC 생성에 필요한 권한이 함께 요구되는 경우가 있다. 막히는 API가 나오면 콘솔 오류 또는 **IAM 정책 시뮬레이터**로 보완하면 된다.

#### 비용·정리

EB 환경은 **EC2 인스턴스·로드밸런서** 등으로 **시간 과금**이 나가므로 실험 후 **환경 종료**나 **종료 불가 상태인지**(보호 플래그)를 확인한다. [0033](./0033-aws-ops-security-troubleshooting.md) 참고.

#### 배포 후 앱 크래시(로그) — `youtube-transcript`

`web.stdout.log` 에 `ERR_PACKAGE_PATH_NOT_EXPORTED` 가 나오면, 패키지 `exports` 가 서브경로 `dist/...` resolve 를 막은 경우다. 서버 코드는 **`package.json` 위치로 루트를 잡은 뒤** `dist/youtube-transcript.esm.js` 를 동적 `import` 한다([0023](./0023-youtube-transcript-cjs-load.md)).

---

### 6. 체크리스트

- [ ] `PORT`를 환경 변수에서 읽는가
- [ ] Beanstalk 사용 시 **`LISTEN_HOST=0.0.0.0`** 를 환경 구성에 넣었는가
- [ ] 프로덕션에서 불필요한 **디버그 로그·스택 노출**이 없는가
- [ ] 헬스 체크 URL이 **`/health` 또는 `/api/health`** 와 일치하는가
- [ ] Supabase IP 제한·RLS 정책이 운영 트래픽과 맞는가([0017](./0017-supabase.md))

---

## 참고

- 단계별(Elastic Beanstalk): [실습 가이드 §4](../plans/2026-05-04-aws-first-deploy-walkthrough.md)
- EB 공식: [Elastic Beanstalk 개념](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/concepts.html)

- 이전: [0029 정적 프론트](./0029-aws-static-frontend-vite-s3-cloudfront.md)
- 다음: [0031 프론트·API 연결](./0031-frontend-backend-integration-cors.md)
- 허브: [0025](./0025-aws-deployment-series-hub.md)
