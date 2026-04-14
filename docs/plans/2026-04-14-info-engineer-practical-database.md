# 정보처리기사 실기 데이터베이스 단원 개편 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 데이터베이스 단원을 실기 시험용 강의 교안 수준의 세부 문서 8개로 재작성하고 기존 탐색 구조와 호환되도록 반영한다.

**Architecture:** 기존 `10_체계형_학습자료/02_데이터베이스`의 요약형 문서 2개를 제거하고, DB 기본 개념, 키/무결성, SQL, 정규화, 트랜잭션, 기타 DB 객체를 세부 주제로 나눈 Markdown 문서 8개를 새로 만든다. 문서 구조는 메타 정보, 개념 설명, 비교표, 예제, 함정, 요약으로 통일하고, `build-learning-config`를 다시 실행해 학습자료 탐색 설정을 재생성한다.

**Tech Stack:** Markdown 문서, Node 스크립트 `scripts/build-learning-config.mjs`, generated TS config

---

### Task 1: 기존 데이터베이스 요약 문서 제거

**Files:**
- Delete: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/02_데이터베이스/01_SQL_핵심정리.md`
- Delete: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/02_데이터베이스/02_정규화_트랜잭션_병행제어.md`

**Step 1: 삭제 대상 확인**
- 기존 데이터베이스 폴더의 얇은 요약 파일 2개만 제거 대상인지 확인한다.

**Step 2: 파일 삭제**
- 세부 문서 구조로 교체할 수 있도록 기존 요약 파일을 제거한다.

---

### Task 2: DB 기본 개념과 키 문서 작성

**Files:**
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/02_데이터베이스/01_DB시스템과_관계형모델.md`
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/02_데이터베이스/02_키_무결성_스키마.md`

**Step 1: 메타 정보와 핵심 요약 작성**
- 날짜, 태그, 주제, 중요도를 기존 학습자료 스타일에 맞춰 통일한다.

**Step 2: 상세 개념, 비교표, 시험 포인트 추가**
- DB 시스템 특성, 스키마 3계층, 릴레이션 용어, 키 종류, 무결성을 설명한다.

**Step 3: 차수/카디널리티, 후보키/슈퍼키 비교 예시 포함**
- 용어형 문제와 개념 비교 문제를 동시에 커버한다.

---

### Task 3: SQL 문서 3개 작성

**Files:**
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/02_데이터베이스/03_SQL_DDL과_제약조건.md`
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/02_데이터베이스/04_SQL_DML_조회와_집계.md`
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/02_데이터베이스/05_SQL_조인_서브쿼리_윈도우함수.md`

**Step 1: DDL/제약조건 작성**
- CREATE, ALTER, DROP, TRUNCATE, 제약조건, CASCADE/RESTRICT를 정리한다.

**Step 2: DML/조회/집계 작성**
- SELECT 절 순서, WHERE, GROUP BY, HAVING, ORDER BY, 집계 함수를 정리한다.

**Step 3: 조인/서브쿼리/윈도우 함수 작성**
- JOIN, EXISTS, IN/ANY/ALL, 상관 서브쿼리, RANK 계열 함수를 정리한다.

---

### Task 4: 정규화와 트랜잭션 문서 작성

**Files:**
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/02_데이터베이스/06_정규화와_반정규화.md`
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/02_데이터베이스/07_트랜잭션_병행제어_회복.md`

**Step 1: 정규화 문서 작성**
- 이상 현상, 함수 종속, 1NF~5NF, BCNF, 반정규화를 설명한다.

**Step 2: 트랜잭션/병행제어/회복 문서 작성**
- ACID, 상태 변화, COMMIT/ROLLBACK/SAVEPOINT, 교착상태, UNDO/REDO를 설명한다.

**Step 3: 상태 변화와 회복 유형 표 추가**
- 문제 풀이형 비교가 가능하도록 정리한다.

---

### Task 5: 인덱스/뷰/절차형 SQL 문서 작성

**Files:**
- Create: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/02_데이터베이스/08_인덱스_뷰_절차형SQL.md`

**Step 1: 인덱스와 뷰 작성**
- 인덱스 특징, 장단점, 뷰의 목적과 옵션을 정리한다.

**Step 2: 프로시저/함수/트리거 작성**
- 차이점, 호출 시점, 반환값 여부를 비교표로 정리한다.

---

### Task 6: 구조 호환성 반영

**Files:**
- Modify (generated): `client/src/shared/config/file-structure-sections/learning-info-engineer-practical.ts`

**Step 1: 스크립트 실행**
- Run: `npm run build:learning-config`
- Expected: PASS

**Step 2: 생성 결과 확인**
- 새 문서 8개가 `10_체계형_학습자료/02_데이터베이스` 아래에 반영됐는지 확인한다.

---

### Task 7: 검증

**Files:**
- Check: `client/src/shared/config/file-structure-sections/learning-info-engineer-practical.ts`

**Step 1: 생성 config 검색**
- 새 문서 파일 경로가 config에 모두 포함됐는지 확인한다.

**Step 2: 린트 확인**
- `ReadLints`로 생성된 TS 파일에 문제 없는지 확인한다.

---

Plan complete and saved to `docs/plans/2026-04-14-info-engineer-practical-database.md`.

기본 실행 방식은 **이 세션에서 바로 진행**이다. 별도 요청이 없으면 현재 세션에서 문서 작성과 검증까지 이어서 수행한다.
