# 정보처리기사 실기 프로그래밍·알고리즘 단원 개편 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 프로그래밍·알고리즘 단원을 실기 시험용 강의 교안 수준의 세부 문서 8개로 재작성하고 기존 탐색 구조와 호환되도록 반영한다.

**Architecture:** 기존 `10_체계형_학습자료/01_프로그래밍_및_알고리즘`의 요약형 문서 2개를 제거하고, C/Java/Python/알고리즘을 세부 주제로 분해한 Markdown 문서 8개를 새로 만든다. 문서 구조는 메타 정보, 개념 설명, 비교표, 예제, 함정, 요약으로 통일하고, `build-learning-config`를 다시 실행해 학습자료 탐색 설정을 재생성한다.

**Tech Stack:** Markdown 문서, Node 스크립트 `scripts/build-learning-config.mjs`, generated TS config

---

### Task 1: 기존 프로그래밍·알고리즘 요약 문서 제거

**Files:**
- Delete: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/01_프로그래밍_및_알고리즘/01_프로그래밍_언어_핵심정리.md`
- Delete: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/01_프로그래밍_및_알고리즘/02_알고리즘_빈출유형.md`

**Step 1: 현재 범위 확인**
- 삭제 대상이 해당 폴더의 기존 간단 요약 파일 2개뿐인지 확인한다.

**Step 2: 파일 삭제**
- 요약형 파일을 제거해 세부 문서 구조로 교체할 준비를 한다.

---

### Task 2: C언어 강의노트 3개 작성

**Files:**
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/01_프로그래밍_및_알고리즘/01_C언어_기초와_입출력.md`
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/01_프로그래밍_및_알고리즘/02_C언어_제어문과_연산자.md`
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/01_프로그래밍_및_알고리즘/03_C언어_배열_포인터_구조체.md`

**Step 1: 메타 정보와 핵심 요약 작성**
- 날짜, 태그, 주제, 중요도를 기존 학습자료 스타일에 맞춰 통일한다.

**Step 2: 시험 포인트/상세 개념/코드 추적/함정 섹션 작성**
- 입출력, 자료형, 연산자, 제어문, 배열, 포인터, 구조체를 실기 중심으로 상세화한다.

**Step 3: 코드 예제 2개 이상씩 포함**
- 전치/후치, 포인터 연산, 배열 추적, 구조체 접근 예제를 넣는다.

---

### Task 3: Java/Python 강의노트 2개 작성

**Files:**
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/01_프로그래밍_및_알고리즘/04_Java_객체지향_핵심.md`
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/01_프로그래밍_및_알고리즘/05_Python_핵심문법과_객체지향.md`

**Step 1: 객체지향 핵심 개념 정리**
- 클래스, 객체, 인스턴스, 상속, 다형성, 오버로딩/오버라이딩을 중심으로 구성한다.

**Step 2: 언어별 문법 차이와 시험 함정 추가**
- Java 생성자, `super`, 추상화
- Python `self`, `__init__`, 컴프리헨션, 슬라이싱, `super()`

**Step 3: 코드 추적 예제 작성**
- 생성자 호출 순서, 오버라이딩 동작, 슬라이싱 결과를 설명한다.

---

### Task 4: 알고리즘 강의노트 3개 작성

**Files:**
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/01_프로그래밍_및_알고리즘/06_알고리즘_기초와_시간복잡도.md`
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/01_프로그래밍_및_알고리즘/07_정렬_알고리즘.md`
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/01_프로그래밍_및_알고리즘/08_탐색과_구현형_문제.md`

**Step 1: 기본 개념 작성**
- 알고리즘 정의, 시간복잡도, 공간복잡도, 빅오 표기 설명.

**Step 2: 정렬/탐색/구현형 세부화**
- 각 정렬 특징, 안정성, 복잡도, 추적 순서를 포함한다.
- 선형/이진 탐색과 구현형 문제 풀이 절차를 정리한다.

**Step 3: 추적 예제와 함정 추가**
- 배열 상태 변화를 단계별로 적고, 비교 횟수/반복 흐름 해설을 넣는다.

---

### Task 5: 구조 호환성 반영

**Files:**
- Modify (generated): `client/src/shared/config/file-structure-sections/learning-info-engineer-practical.ts`

**Step 1: 스크립트 실행**
- Run: `npm run build:learning-config`
- Expected: PASS

**Step 2: 생성 결과 확인**
- 새 문서 8개가 `10_체계형_학습자료/01_프로그래밍_및_알고리즘` 아래에 반영됐는지 확인한다.

---

### Task 6: 검증

**Files:**
- Check: `client/src/shared/config/file-structure-sections/learning-info-engineer-practical.ts`

**Step 1: 생성 config 검색**
- 새 문서 파일 경로가 config에 모두 포함됐는지 확인한다.

**Step 2: 린트 확인**
- `ReadLints`로 생성된 TS 파일에 문제 없는지 확인한다.

---

Plan complete and saved to `docs/plans/2026-04-14-info-engineer-practical-programming.md`.

기본 실행 방식은 **이 세션에서 바로 진행**이다. 별도 요청이 없으면 현재 세션에서 문서 작성과 검증까지 이어서 수행한다.
