# 학습 폴더 config 자동 생성

날짜: 2026-02-23
태그: [프론트, 백엔드, 도구, 아키텍처]

## 요약

`public/learnings/정처기` 폴더를 스캔해 `learning-info-engineer.ts` config를 자동 생성하는 스크립트. md 파일 추가·삭제 시 수동 config 수정 대신 스크립트 재실행으로 동기화.

## 핵심 개념

- **config = 목록 소스**: FileStructure 패턴은 config의 `nodes`·`docs`를 기반으로 UI 렌더
- **폴더 = 실제 콘텐츠**: md 파일은 `client/public/learnings/정처기/`에 존재
- **동기화**: 폴더 구조와 config가 일치해야 화면에 표시됨

## 상세 설명

### 아키텍처

```
client/public/learnings/정처기/
├── 01_소프트웨어설계/   ← 노드 (docs: md 파일들)
├── 02_소프트웨어개발/
├── ...
└── 99_노트/             ← 노드 (children: 1장~5장)
    ├── 1장/             ← 자식 노드 (docs: md 파일들)
    ├── 2장/
    └── ...
         ↓ 스캔
scripts/build-learning-config.mjs
         ↓ 출력
client/src/shared/config/file-structure-sections/learning-info-engineer.ts
```

### 스크립트 동작

1. **scanDir(dirPath, baseRelPath)**: 디렉터리 재귀 순회
   - `.md` 파일 → `{ slug, title, filePath }` (slug = 파일명에서 .md 제거)
   - 하위 디렉터리 → `children` 배열에 `{ id, name, docs?, children? }` 추가
2. **buildNode(nodeId, dirPath)**: NODE_META에서 표시명·설명 조회, scanDir 결과와 병합
3. **출력**: JSON.stringify로 TypeScript 파일 생성

### slug와 filePath

- **slug**: URL 경로 세그먼트. `resolveFileStructurePath`에서 `doc.slug === pathParts[n]`로 매칭
- **filePath**: fetch URL용. `basePath + "/" + filePath` → `/learnings/정처기/01_소프트웨어설계/파일명.md`
- 파일명에 공백·괄호가 있어도 그대로 사용 (브라우저가 URL 인코딩)

### 실행

```bash
npm run build:learning-config
```

## 참고

- error-fixes/0001: 관련 오류(4, 5번) 및 수정 내역
- docs/plans/2026-02-23-learning-info-engineer.md: 학습자료 페이지 계획
- DB 연동 시: seed.sql과 이 config 구조가 일치하도록 설계됨
