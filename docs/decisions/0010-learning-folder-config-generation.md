# 학습 폴더 config 자동 생성

- **날짜**: 2026-02-23
- **상태**: 채택

## 배경 (왜 이 결정이 필요한가)

학습 기록 페이지의 목록은 config의 `nodes`·`docs`를 기반으로 UI를 렌더한다. 실제 md 파일은 `client/public/learnings/정처기/`에 존재하는데, 폴더 구조와 config가 일치해야 화면에 표시된다. md 파일 추가·삭제 시 수동 config 수정은 오류를 유발하고 유지보수가 어렵다.

## 결정 (무엇으로 했는지)

1. **`scripts/build-learning-config.mjs`**로 폴더 스캔 → config 자동 생성
2. `public/learnings/정처기` 폴더를 재귀 순회해 `learning-info-engineer.ts` config를 생성
3. `npm run build:learning-config` 실행 시 config 동기화

### 아키텍처

```
client/public/learnings/정처기/
├── 01_소프트웨어설계/   ← 노드 (docs: md 파일들)
├── 02_소프트웨어개발/
├── ...
└── 99_노트/             ← 노드 (children: 1장~5장)
    ├── 1장/             ← 자식 노드 (docs: md 파일들)
    └── ...
         ↓ 스캔
scripts/build-learning-config.mjs
         ↓ 출력
client/src/shared/config/file-structure-sections/learning-info-engineer.ts
```

### 스크립트 동작

- `scanDir`: 디렉터리 재귀 순회, `.md` → `{ slug, title, filePath }`, 하위 폴더 → `children`
- `buildNode`: NODE_META에서 표시명·설명 조회, scanDir 결과와 병합
- 출력: JSON.stringify로 TypeScript 파일 생성

## 이유 (다른 선택지를 배제한 이유)

| 선택지             | 배제 이유                                                      |
| ------------------ | -------------------------------------------------------------- |
| **수동 config 수정** | md 추가·삭제마다 수동 동기화 → 누락·오타 위험                  |
| **런타임 폴더 스캔** | 당시에는 build 시점 동기화로 충분. 이후 0011에서 런타임 스캔 도입 | |

## 결과/참고

- error-fixes/0001: 관련 오류 및 수정 내역
- docs/plans/2026-02-23-learning-info-engineer.md: 학습 기록 페이지 계획
- DB 연동 시: seed.sql과 이 config 구조가 일치하도록 설계됨
- **추가**: 0011(동적 섹션) 도입 후 DB/스캔 사용 시 이 스크립트는 선택 사항
