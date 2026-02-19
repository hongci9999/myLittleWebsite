# Cursor 에이전트 워크플로우: Superpowers 적용

- **날짜**: 2026-02-20
- **상태**: 채택

## 배경 (왜 이 결정이 필요한가)

Cursor Agent로 개발할 때, 곧바로 코드 작성을 시도하기보다 설계·계획·TDD를 선행하는 워크플로우가 필요하다. foundation 원칙의 "이유 기반 작업", "확장 가능한 상태 유지"와 맞는 체계적 접근이 되도록 하고 싶다.

## 결정 (무엇으로 했는지)

**Superpowers** (https://github.com/obra/superpowers) 플러그인을 Cursor에 설치하여 사용한다.

- 설치: Agent 채팅에서 `/plugin-add superpowers`
- 스킬이 상황에 맞게 자동 트리거됨 (별도 호출 불필요)

## 이유 (다른 선택지를 배제한 이유)

- **없이 진행**: ad-hoc 방식 → 설계·테스트 누락 가능성
- **직접 룰 작성**: 이미 만들어진 워크플로우를 재발명할 필요 없음
- **Superpowers**: brainstorming → plans → subagent-driven-development → TDD가 이미 체계화되어 있고, Cursor 지원

## 결과/참고

- 적용 후 journal·learnings에 실제 사용 경험 기록할 예정
- 효과가 없거나 프로젝트 스타일과 맞지 않으면 폐기 검토 가능
