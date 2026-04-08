# 타로 오늘의 운세 위젯 디자인

**날짜:** 2026-04-08  
**관련:** `client/src/widgets`, `docs/decisions/0009-design-rules.md`

**Goal:** 메인 위젯 영역에 메이저 아르카나 3장 기반의 오늘의 운세 위젯을 추가하고, 카드별 개별 연출과 중간 클릭 즉시 오픈 UX를 제공한다.

---

## 1) 요구사항 요약

- 카드 자산: 사용자 제작 타로 카드 앞면 22장(메이저 아르카나) + 뒷면 1장
- 초기 상태: 뒷면 카드 3장이 흐릿하게 보이고, 위에 `운세보기` 버튼 배치
- 버튼 클릭 후 카드 선택 시작
- 뒷면 카드 클릭 시 개별 카드가 회전하고, 정방향/역방향 중 하나로 멈춘 뒤 뒤집혀 앞면 표시
- 카드 3장은 각각 독립적으로 연출
- 애니메이션 중인 카드를 다시 클릭하면 해당 카드만 즉시 앞면 표시

---

## 2) 폴더 구조 결정

위젯 내부 캡슐화 방식을 채택한다.

- `client/src/widgets/TarotDailyWidget/index.ts`
- `client/src/widgets/TarotDailyWidget/TarotDailyWidget.tsx`
- `client/src/widgets/TarotDailyWidget/assets/cards/back.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-00-fool.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-01-magician.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-02-high-priestess.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-03-empress.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-04-emperor.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-05-hierophant.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-06-lovers.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-07-chariot.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-08-strength.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-09-hermit.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-10-wheel-of-fortune.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-11-justice.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-12-hanged-man.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-13-death.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-14-temperance.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-15-devil.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-16-tower.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-17-star.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-18-moon.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-19-sun.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-20-judgement.png`
- `client/src/widgets/TarotDailyWidget/assets/cards/major/major-21-world.png`
- `client/src/widgets/TarotDailyWidget/model/types.ts`
- `client/src/widgets/TarotDailyWidget/model/tarot-major.ts`
- `client/src/widgets/TarotDailyWidget/model/tarot-draw.ts`
- `client/src/widgets/TarotDailyWidget/ui/TarotCard.tsx`
- `client/src/widgets/TarotDailyWidget/ui/TarotSpread.tsx`
- `client/src/widgets/TarotDailyWidget/ui/tarot.css`

---

## 3) 상태/데이터 설계

카드 1장 단위로 상태를 관리한다.

- `idle-back`: 초기 뒷면 상태
- `spinning`: 클릭 후 회전 애니메이션 진행
- `revealing`: 멈춘 후 flip 전환 구간
- `revealed`: 앞면 노출 완료 상태

카드 데이터 필드(권장):

- `slotIndex`: 0~2
- `majorId`: 0~21
- `orientation`: `upright | reversed`
- `state`: 카드 상태
- `isAnimating`: 진행 여부
- `spinToken`: 타이머/프레임 취소를 위한 식별자

---

## 4) 인터랙션 규칙

1. `운세보기` 클릭 전에는 카드 선택 비활성(흐림 + 클릭 차단 또는 안내)
2. 클릭 가능한 카드만 `idle-back`에서 `spinning`으로 전환
3. `spinning` 종료 시 `orientation` 확정 후 `revealing`으로 전환
4. `revealing` 완료 시 `revealed`
5. `spinning/revealing` 중 재클릭 시:
   - 해당 카드의 애니메이션 타이머/프레임 즉시 정리
   - 즉시 `revealed`로 전환
   - 다른 카드 상태에는 영향 없음

---

## 5) 스타일/연출 원칙

- 디자인 룰(절제된 톤) 유지: 과한 글로우 대신 `shadow-sm ~ shadow-md`, `rounded-2xl`, `border-border/60`
- 3D 연출: 카드 컨테이너에 `perspective`, 카드 면에 `backface-visibility`
- 초기 흐림: 카드 자체 `blur` + 살짝 낮은 채도/명도
- 클릭 가능 시점 강조: hover 시 미세한 `translateY`/shadow 변화
- 모션은 카드별 독립 적용, 전체 동기화 애니메이션 금지

---

## 6) 검증 기준

- 3장 중복 없는 추첨이 동작
- 카드별 클릭/연출/완료가 서로 간섭하지 않음
- 애니메이션 중 재클릭 시 즉시 앞면으로 전환
- 모바일/데스크톱에서 카드 비율과 버튼 가독성 유지
- 위젯 미사용 시 기존 메인 위젯 레이아웃에 영향 없음

---

## 7) 결정 기록 점검

이번 작업은 "타로 위젯 내부 폴더 캡슐화 + 카드 상태머신" 채택이라는 구조 선택이 있으므로, 구현 시작 시점 또는 구현 완료 시점에 `docs/decisions/` ADR 추가 여부를 재평가한다.
