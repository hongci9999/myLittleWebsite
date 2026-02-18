# npm workspaces – 설치 구분과 동작 방식

날짜: 2026-02-19

## 요약

루트에서 `npm install` 한 번으로 client, server 의존성을 함께 설치하는 이유는 `workspaces` 때문이다. npm이 각 workspace의 `package.json`을 읽어 하나의 의존성 트리로 합치고, 루트 `node_modules/`에 hoisting하여 설치한다.

## 핵심 개념

| 용어 | 의미 |
|------|------|
| **workspaces** | 한 저장소 안에 여러 패키지를 두고, 루트에서 함께 관리 |
| **hoisting** | 공통 의존성을 루트 `node_modules/`에 모아 설치 (중복·충돌 시 분리) |
| **-w client** | 특정 workspace만 대상으로 명령 실행 |

## 상세 설명 (이해한 내용)

### 1. 의존성은 각 package.json에 선언된다

각 패키지가 필요한 의존성을 자신의 `package.json`에 적어둔다.

- 루트: `concurrently`
- client: `react`, `react-dom`, `vite`, `typescript` 등
- server: `express`, `tsx`, `typescript` 등

### 2. npm이 어떻게 알 수 있는가

루트 `package.json`의 `workspaces: ["client", "server"]` 때문에, `npm install` 시 npm은 루트뿐 아니라 client·server의 `package.json`까지 읽는다. 이 선언들을 합쳐 하나의 의존성 트리를 만든다.

### 3. 설치 위치

- 기본: 충돌 없으면 모두 루트 `node_modules/`로 hoisting
- 충돌 시: 버전이 다른 패키지는 해당 workspace 아래 `node_modules/`에 따로 설치
- workspace 패키지들: 루트 `node_modules`에 client, server가 심볼릭 링크로 연결됨

### 4. 실행 시 구분

설치가 “나뉘어” 있다기보다, 실행 시점에 workspace가 구분된다.

- `npm run dev -w client` → client 폴더 기준 실행
- `npm run dev -w server` → server 폴더 기준 실행

각 workspace의 `package.json`에 정의된 script가 해당 workspace 맥락에서 실행된다.

### 5. 버전 충돌 시

예: client는 React 18, 다른 workspace는 React 17 필요 → 같은 패키지名이어도 버전이 다르면 별도 설치. npm이 dependency tree를 분석해 필요한 버전을 workspace별로 분리 설치한다.

## 참고

- [npm workspaces 공식 문서](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
- 이 프로젝트 루트 `package.json`에 `workspaces: ["client", "server"]` 설정됨
