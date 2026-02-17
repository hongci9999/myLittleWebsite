# 프로젝트 기초 구조 및 기록 체계

- **날짜**: 2026-02-17
- **상태**: 채택

## 배경 (왜 이 결정이 필요한가)

foundation 원칙(이유 기반, 자기서술, 확장성)을 실제로 유지하려면, 프로젝트 전반에 걸친 규칙과 기록 체계가 필요했다. AI(Cursor)와의 협업에서도 일관된 기준이 있어야 한다.

## 결정 (무엇으로 했는지)

1. **폴더 구조**: `client/`(프론트), `server/`(백엔드), `docs/`(기록)
2. **Cursor 룰**: foundation, git, stack-structure, docs-record
3. **Git 컨벤션**: Conventional Commits, 브랜치 전략, push 전 점검
4. **기록 구조**: CHANGELOG, decisions/(ADR), journal/

## 이유 (다른 선택지를 배제한 이유)

- **분리된 client/server**: 학습·유지보수 용이, 레이어 역할 명확
- **docs/**: 모든 기록을 한 곳에 모아, foundation의 자기서술 요건 충족
- **ADR(decisions/)**: 기술 선택 이유를 남겨 "왜"를 추적 가능
- **journal/**: 일상 작업·학습을 자유롭게 기록

## 결과/참고

- `.cursor/rules/` 내 foundation.mdc, git.mdc, stack-structure.mdc, docs-record.mdc
- `docs/` 폴더 구조 및 CHANGELOG 초기화
