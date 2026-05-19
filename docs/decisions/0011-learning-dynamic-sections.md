# 학습 기록 동적 섹션 (폴더 스캔)

- **날짜**: 2026-03-07
- **상태**: 채택

## 배경 (왜 이 결정이 필요한가)

학습 기록에 `.md` 파일을 추가할 때마다 `npm run build:learning-config`를 실행해야 목록에 반영되었다. 사용자가 "동적으로 문서를 추가하고 싶다"는 요청에 따라, 빌드 없이 폴더에 넣기만 하면 즉시 목록에 표시되도록 해야 했다. 또한 정보처리기사 외 독후감·데이터베이스기사 등 추가 섹션을 지원해야 한다.

## 결정 (무엇으로 했는지)

1. **런타임 폴더 스캔 API** (1번 방식) 적용
2. **DB 우선, 없으면 config·스캔 폴백**
   - `GET /api/learning/sections`, `GET /api/learning/sections/:sectionId`
   - DB에 데이터 있으면 사용, 없으면 `server/src/config/learning-sections.ts` + 폴더 스캔
3. **다중 섹션 지원**: `learning-sections.ts`에 섹션 등록, `learning/:sectionId/*` 동적 라우팅
4. **향후 3번 방식**: 관리자 UI + CRUD API로 문서 추가 (예정)

### 새 섹션 추가 방법

1. 폴더 생성: `client/public/learnings/{folderName}/`
2. 서버 config: `server/src/config/learning-sections.ts`에 추가
3. `npm run build:learning-config` → `file-structure-sections/learning-*.ts` 생성
4. `file-structure-sections/index.ts` import, `learning-parent.ts`의 `sections`에 등록 (또는 `STUB_SECTIONS`는 nodes 없는 브레드크럼용만)

## 이유 (다른 선택지를 배제한 이유)

| 선택지             | 배제 이유                                                      |
| ------------------ | -------------------------------------------------------------- |
| **DB 동기화 스크립트** | npm run 실행 필요. 사용자 요청은 "빌드 없이" 즉시 반영          |
| **관리자 UI**      | 먼저 1번 방식으로 빠르게 동적 추가, 이후 3번으로 확장          |
| **런타임 폴더 스캔** | 폴더에 넣기만 하면 즉시 반영. DB/배포 없이도 동작 가능          |

## 결과/참고

- `server/src/config/learning-sections.ts` - 섹션 정의
- `server/src/services/learning-scan.ts` - 스캔 로직
- `scripts/build-learning-config.mjs` - 클라이언트 config 생성 (`npm run build:learning-config`)
- **프로덕션(CloudFront + EB 분리)**: EB 번들에 learnings 없음 → 목록·트리는 **클라이언트 config** + API 메타, md 본문은 CloudFront `/learnings/`. [error-fixes/0005](../error-fixes/0005-learning-production-split-hosting.md)
- 섹션 목록 표시 순서: `learning-parent` config 기준 (`mergeLearningSectionSummaries`)
