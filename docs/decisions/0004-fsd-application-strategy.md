# FSD 적용 전략

- **날짜**: 2026-02-23
- **상태**: 채택

## 배경 (왜 이 결정이 필요한가)

Feature-Sliced Design(FSD)을 학습했고, 프로젝트 foundation과 방향성이 맞다. 다만 현재 client는 Vite 기본 템플릿 수준으로 규모가 작아, FSD를 한 번에 전부 적용하면 오버엔지니어링이 될 수 있다. 적용 시점과 규칙을 정해두어야 한다.

## 결정 (무엇으로 했는지)

1. **FSD를 점진적으로 적용**한다.
2. **초기**: `shared/`, `pages/`, `app/`만 먼저 도입한다.
3. **추가 시점**: 비즈니스 도메인(포트폴리오 항목, 블로그 포스트 등)이 생기면 `entities/`, `features/`를 추가한다.
4. **widgets**: UI 블록을 여러 페이지에서 재사용할 필요가 생기면 추가한다.
5. **의존 방향**: 위 레이어 → 아래 레이어만. 공개 API(`index.ts`)를 통해서만 import한다.

## 이유 (다른 선택지를 배제한 이유)

| 선택지 | 배제 이유 |
|--------|-----------|
| **지금 전부 적용** | 페이지·기능이 거의 없을 때 7개 레이어는 과함. 학습 곡선이 있음 |
| **FSD 미적용** | foundation의 "extensible"과 맞지 않음. 나중에 리팩터링 부담 |
| **점진적 적용** | 규모에 맞게 확장. shared부터 시작하면 학습 부담 적음 |

## 결과/참고

- `.cursor/rules/stack-structure.mdc`에 FSD 적용 가이드 추가
- `docs/learnings/0004-feature-sliced-design.md`에 FSD 개념·예시 정리
- myLittleWebsite 목적: 데이터 정리, 포트폴리오, 기술 학습 → 예상 슬라이스: home, about, portfolio, blog(선택)
