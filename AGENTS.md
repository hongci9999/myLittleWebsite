# AGENTS.md

## 링크 대량 등록 (`server/scripts/bulk-youtube.ts`)

사용자가 유튜브 링크를 여러 개 주면 이 순서로 진행한다. 저장 즉시 사이트에 공개되므로(초안 없음) 검토 없이 save 금지.

1. 링크를 `.omc/bulk/<name>.txt`에 저장 → `npm run bulk-youtube -w server -- prepare ../.omc/bulk/<name>.txt` (DB 쓰기 없음, `<name>.preview.json` 생성)
2. 의심 항목을 WebSearch + GitHub API로 직접 검증해 preview.json 수정
   - `check`(이름 검색으로 찾은 레포): 동명 무관 레포가 자주 잡힘 — 영상 내용과 레포 설명 대조
   - 링크 못 찾음 / 비공식 레포 / 논문 링크 → 공식 레포로 교체
   - 시연 수단으로만 나온 도구(예: Codex)는 `include: false`
3. url을 고친 항목은 `data`를 지우고 `include: true` → `refill ../.omc/bulk/<name>.preview.json` (그 항목만 AI 재채움)
4. 사용자에게 표로 보고: 저장 예정 목록, 고친 것(✏️), 불확실(❓), 제외(중복·시연 도구)
5. 사용자 승인 후 `save ../.omc/bulk/<name>.preview.json` (server/.env의 BULK_EMAIL/BULK_PASSWORD 사용) → 섹션별로 DB 한 건씩 조회해 확인 → `npm run backfill-sources -w server` (새 항목의 유튜브 자막·README 원문을 MCP `get_source`용으로 저장, 로컬에서만 자막 수신 가능)

제약: 중복 검사는 세 섹션 통합 linkKey 기준 → 같은 URL을 두 섹션에 넣으면 두 번째는 스킵된다. 두 섹션에 다 넣을 땐 한쪽은 영상 URL을 메인으로.

## 섹션 분류 관례

- **AI 개발 도구**: 메인 링크 = 도구의 GitHub 레포(우선) 또는 공식 사이트, 영상은 「소개 영상」 추가 링크. AI 도구·모델을 주제로 소개하는 영상은 칼럼이 아니라 여기.
- **칼럼**: 도구 소개가 아닌 활용 팁·생각·개념 설명. 도구 목록 영상에 섞인 강좌·가이드 레포도 칼럼(메인 = 레포, 영상은 「소개 영상」).
- **게임 개발**: 게임 개발 자료(영상이 메인 링크). AI 도구를 써도 목적이 게임 제작(엔진 프로젝트·에셋 제작 과정)이면 여기.
- 경계: AI 3D·모션 생성 툴(Kimodo, Hi3D)·에이전트 관리 도구(Buzz)는 AI 개발 도구, 웹 표준·브라우저 API(HTML in Canvas)는 칼럼.
- **유용한 링크**(원클릭 저장만): 글·영상이 아닌 써먹는 사이트 자체(웹 도구·리소스 모음·레퍼런스).
