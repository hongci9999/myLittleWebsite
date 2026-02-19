# Superpowers – 에이전트 워크플로우와 스킬 시스템

날짜: 2026-02-20

## 요약

Superpowers는 Cursor·Claude Code 같은 코딩 에이전트에 설계 선행·TDD·체계적 구현을 강제하는 "스킬" 모음이다. 플러그인 설치 후, 에이전트가 상황을 감지해 자동으로 해당 스킬을 실행한다. 사용자는 별도 명령 없이 평소처럼 요청하면 된다.

## 핵심 개념

| 용어 | 의미 |
|------|------|
| **스킬 (Skill)** | 특정 상황에서 실행되는 워크플로우 지침·절차 |
| **자동 트리거** | 에이전트가 맥락을 보고, 해당 스킬이 필요하다고 판단하면 자동 실행 |
| **brainstorming** | 코드 작성 전 질문으로 요구사항을 정리하고 설계를 나눠 검증 |
| **writing-plans** | 승인된 설계를 2~5분 단위 태스크로 분해한 구현 계획 작성 |
| **subagent-driven-development** | 태스크마다 서브에이전트를 띄워 실행하고, 2단계 리뷰(스펙·품질) 후 진행 |
| **RED-GREEN-REFACTOR** | TDD 사이클: 실패 테스트 → 통과할 최소 코드 → 리팩터링 |

## 상세 설명 (이해한 내용)

### 1. 동작 원리: "스킬이 먼저, 코드는 나중"

일반적인 에이전트는 "이거 만들어줘"라고 하면 바로 구현을 시도한다. Superpowers를 쓰면 에이전트는 우선 **"뭘 만들고 있는지"**를 묻고, 설계를 단계적으로 검증한 뒤 **계획**을 세운 다음 그 계획대로 구현한다.

### 2. 워크플로우 순서 (기본)

```
요청 → brainstorming (설계 정리·검증)
     → 설계 승인
     → using-git-worktrees (새 브랜치·격리 작업 공간)
     → writing-plans (태스크별 구현 계획)
     → 계획 승인
     → subagent-driven-development / executing-plans (계획 실행)
        ↳ 구현 중 test-driven-development (TDD)
        ↳ 태스크 사이 requesting-code-review (리뷰)
     → finishing-a-development-branch (머지/PR 결정)
```

각 단계는 "권장"이 아니라 **필수**에 가깝다. 에이전트가 작업 전에 해당 스킬을 확인한다.

### 3. 스킬 종류 (요약)

| 영역 | 스킬 | 역할 |
|------|------|------|
| 설계 | brainstorming | 요구사항 질문, 설계 분할 제시, 설계 문서 저장 |
| 작업 공간 | using-git-worktrees | 새 브랜치에 worktree 생성, 프로젝트 세팅, 테스트 베이스라인 확인 |
| 계획 | writing-plans | 2~5분 단위 태스크, 파일 경로·코드·검증 절차 명시 |
| 실행 | subagent-driven-development | 태스크별 서브에이전트, 스펙→품질 2단계 리뷰 |
| 실행 | executing-plans | 계획 배치 실행, 사람 체크포인트 |
| 테스트 | test-driven-development | RED-GREEN-REFACTOR, 테스트 전 코드 삭제 |
| 협업 | requesting-code-review | 계획 대비 검토, 심각도별 이슈 보고 |
| 협업 | finishing-a-development-branch | 테스트 확인, 머지/PR/유지/버림 결정 |

### 4. TDD (test-driven-development)

- 실패하는 테스트를 먼저 쓴다.
- 테스트가 실패하는지 확인한다.
- 최소한의 코드로 통과시킨다.
- 통과한 뒤 리팩터링한다.
- 테스트 없이 만든 코드는 삭제한다.

### 5. 철학

- **테스트 우선**: 항상 테스트부터 작성
- **체계 vs 추측**: ad-hoc 대신 프로세스 기반 디버깅
- **단순함 우선**: 복잡도 최소화
- **증거 기반**: "된다"고 말하기 전에 실제로 검증

### 6. Cursor에서 사용

**방법 A: 플러그인 마켓플레이스 (권장)**

```
/plugin-add superpowers   # Agent 채팅에서 설치
```

설치 후에는 새 세션에서 "이 기능 계획해줘", "이 버그 디버깅해줘" 등 요청만 하면 관련 스킬이 자동으로 실행된다.

**방법 B: 수동 설치 (마켓플레이스 미지원 시 대안)**

`/plugin-add`가 동작하지 않거나 마켓플레이스가 없을 때 사용. [SOY4RIAS Gist](https://gist.github.com/SOY4RIAS/b7acafb1e61827c17ecf755de008e8fd) 기준.

1. **저장소 클론**
   ```bash
   mkdir -p ~/.cursor/skills
   git clone https://github.com/obra/superpowers.git ~/.cursor/skills/superpowers
   ```

2. **Bootstrap 룰 생성**: `~/.cursor/rules/superpowers-bootstrap.mdc` 파일 생성
   - 스킬 접근 경로: `Read ~/.cursor/skills/superpowers/skills/{skill-name}/SKILL.md`
   - 도구 매핑: Skill→Read, Bash→Shell, Task→mcp_task 등
   - "using-superpowers" 규칙: 스킬 적용 가능성 1%라도 있으면 반드시 해당 스킬 먼저 읽고 따라야 함

3. **확인**
   - Cursor 재시작 또는 새 대화 시작
   - Agent에게 "do you have superpowers?" 질문 → 예라고 응답하면 정상

4. **업데이트**: `cd ~/.cursor/skills/superpowers && git pull`

**Windows 경로**: `~`는 `C:\Users\{사용자명}\`으로 대체. `mkdir -p`는 PowerShell에서 `New-Item -ItemType Directory -Force`로 대체 가능.

### 7. Bootstrap의 역할

수동 설치 시 Bootstrap 룰이 에이전트에게 다음을 알려준다.

| 항목 | 내용 |
|------|------|
| 스킬 파일 위치 | `~/.cursor/skills/superpowers/skills/{skill-name}/SKILL.md` |
| 도구 매핑 | Skill→Read, Bash→Shell, TodoWrite→TodoWrite |
| 규칙 | 적용 가능성 1%라도 있으면 스킬을 먼저 읽고 따라야 함 |
| Red Flags | "간단한 질문이야", "컨텍스트부터" 같은 합리화 방지 |
| 스킬 우선순위 | brainstorming·debugging 먼저 → 구현 스킬 나중 |

## 참고

- [Superpowers GitHub](https://github.com/obra/superpowers)
- [Superpowers for Claude Code (블로그)](https://blog.fsck.com/2025/10/09/superpowers/)
- [Installing Superpowers for Cursor (SOY4RIAS Gist)](https://gist.github.com/SOY4RIAS/b7acafb1e61827c17ecf755de008e8fd) - 수동 설치 가이드
- 이 프로젝트 의사결정: `docs/decisions/0003-superpowers.md`
