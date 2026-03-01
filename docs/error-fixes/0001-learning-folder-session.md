# 학습 폴더·config 관련 오류 모음

날짜: 2026-02-23

학습자료(정처기) 페이지 개발·운영 중 발생한 오류와 수정 내역.

---

## 1. EADDRINUSE (포트 사용 중)

### 발생한 오류

```
Error: listen EADDRINUSE: address already in use :::3001
```

서버(`npm run dev`) 실행 시 포트 3001이 이미 사용 중이라 바인딩 실패.

### 원인

- 이전에 실행한 `npm run dev`가 `Ctrl+C`로 완전히 종료되지 않음
- 다른 터미널/탭에서 동일 서버가 이미 실행 중
- 포트를 3000 → 3001로 바꾼 것과 무관. **기본 포트를 바꾼 것이 아니라, 이전 프로세스가 포트를 점유한 상태**

### 수정 방법

1. **프로세스 종료** (Windows):
   ```bash
   netstat -ano | findstr :3001   # PID 확인
   taskkill /PID <pid> /F
   ```
2. **대체 포트 사용**: `npm run dev:alt` (PORT=3000)

### 결과/참고

- 포트 충돌 시 `dev:alt`로 우회 가능
- 서버 종료 시 터미널에서 `Ctrl+C` 후 프로세스가 완전히 사라졌는지 확인

---

## 2. supabaseUrl required (환경 변수 미로드)

### 발생한 오류

서버 기동 시 Supabase 클라이언트 초기화 단계에서 `supabaseUrl is required` 오류.

### 원인

- ES 모듈에서 `import` 순서: `supabase.ts`가 `dotenv`보다 **먼저** 로드됨
- `supabase` import 시점에 `process.env`가 아직 비어 있음

### 수정 방법

1. **env 선행 로드**: `server/src/env.ts` 생성, `dotenv.config()`를 **가장 먼저** 실행
2. **index.ts 첫 줄**: 다른 import보다 `import './env.js'`를 최상단에 배치
3. **지연 초기화**: `supabase.ts`에서 env 없을 때 클라이언트를 null로 두고, 503 응답으로 안내

### 결과/참고

- `server/src/env.ts`가 모든 모듈보다 먼저 로드되도록 보장
- DB 미설정 시 503 + "Set SUPABASE_URL and SUPABASE_ANON_KEY" 메시지

---

## 3. 학습 콘텐츠가 사이트에 안 나옴

### 발생한 오류

`/learning` → 정보처리기사 → 과목 목록이 비어 있거나 "준비 중"만 표시됨.

### 원인

- **API 우선 사용**: `LearningBrowserPage`가 API에서 섹션을 가져옴
- API가 200을 반환해도 **DB에 노드가 없으면** `nodes: []` 반환
- 클라이언트가 이 빈 데이터를 그대로 사용 → config 폴백 없음

### 수정 방법

`LearningBrowserPage.tsx`에서 API 응답에 노드가 없으면 config로 폴백:

```ts
.then((data) => {
  const hasNodes = data?.nodes?.length > 0
  setSection(hasNodes ? data : null)  // null → config 사용
})
```

### 결과/참고

- DB 미설정·시드 미실행 시에도 config 기반으로 목록 표시
- API 성공 + 노드 있음 → API 데이터 사용
- API 실패 또는 노드 없음 → config 사용

---

## 4. sdlc, uml만 보이고 나머지 md 문서가 안 나옴

### 발생한 오류

`public/learnings/정처기`에 95개 이상 md 파일이 있는데, 화면에는 sdlc, uml 2개만 표시됨.

### 원인

- `learning-info-engineer.ts` config에 **sdlc, uml만 하드코딩**되어 있음
- 02~05 과목, 99_노트는 `docs: []`로 비어 있음

### 수정 방법

1. **폴더 스캔 스크립트** 작성: `scripts/build-learning-config.mjs`
   - `client/public/learnings/정처기` 디렉터리 재귀 스캔
   - md 파일 → `{ slug, title, filePath }` 형태로 config 생성
2. **실행**: `npm run build:learning-config`
3. **생성 결과**: `learning-info-engineer.ts`에 95개 문서 자동 반영

### 결과/참고

- md 추가·삭제 시 `npm run build:learning-config` 재실행
- config는 스크립트가 덮어쓰므로 수동 수정 시 다음 빌드에서 사라짐

---

## 5. 99_노트 하위(1장~5장)가 config에 안 들어감

### 발생한 오류

스크립트 실행 후 99_노트에 `children`이 없고, 1장~5장 폴더의 문서가 누락됨.

### 원인

- `scanDir()`이 `{ docs, children }` **객체**를 반환하는데, 하위 디렉터리 처리 시 **배열**처럼 사용함
- `const subDocs = scanDir(...)` → `subDocs.length` 체크 → 객체에는 `length` 없음 → `undefined > 0` → false → children에 push 안 됨

### 수정 방법

```js
// 잘못된 코드
const subDocs = scanDir(fullPath, relPath)
if (subDocs.length > 0) { ... }  // subDocs는 객체!

// 수정
const sub = scanDir(fullPath, relPath)
const hasContent = sub.docs.length > 0 || sub.children.length > 0
if (hasContent) {
  const child = { id, name, ... }
  if (sub.docs.length > 0) child.docs = sub.docs
  if (sub.children.length > 0) child.children = sub.children
  children.push(child)
}
```

### 결과/참고

- `scanDir` 반환값 구조를 정확히 사용
- 99_노트 → 1장~5장 → 각 장별 문서 계층 구조 정상 반영
