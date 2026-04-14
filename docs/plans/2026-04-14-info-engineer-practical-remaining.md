# 정보처리기사 실기 남은 단원 개편 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 남은 단원(`인프라 및 네트워크`, `소프트웨어공학 및 테스트`, `용어사전`, `SQL 프로그래밍 재정리`)을 실기 시험용 강의 교안 수준으로 재작성하고 기존 탐색 구조와 호환되도록 반영한다.

**Architecture:** 기존 요약형 문서를 제거하고 각 단원을 세부 주제별 Markdown 문서로 분리한다. 앞서 개편한 다른 단원과 동일한 문서 구조를 적용하고, 마지막에 `build-learning-config`를 다시 실행해 generated config를 갱신한다.

**Tech Stack:** Markdown 문서, Node 스크립트 `scripts/build-learning-config.mjs`, generated TS config

---

### Task 1: 기존 요약 문서 제거

**Files:**
- Delete: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/03_인프라_및_네트워크/01_운영체제_네트워크_핵심.md`
- Delete: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/04_소프트웨어공학_및_테스트/01_테스트_결함_형상관리.md`
- Delete: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/05_용어사전/01_핵심용어_약어.md`
- Delete: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/06_SQL_프로그래밍_재정리/01_DDL_DML_DCL_한눈정리.md`
- Delete: `client/public/learnings/정보처리기사_실기/10_체계형_학습자료/06_SQL_프로그래밍_재정리/02_실기_SQL_빈출패턴.md`

### Task 2: 인프라 및 네트워크 문서 6개 작성

**Files:**
- Create: `.../03_인프라_및_네트워크/01_운영체제_기초와_프로세스.md`
- Create: `.../03_인프라_및_네트워크/02_CPU스케줄링과_메모리관리.md`
- Create: `.../03_인프라_및_네트워크/03_리눅스_명령어와_쉘스크립트.md`
- Create: `.../03_인프라_및_네트워크/04_OSI7계층과_TCPIP.md`
- Create: `.../03_인프라_및_네트워크/05_네트워크_프로토콜과_포트.md`
- Create: `.../03_인프라_및_네트워크/06_IP주소_서브네팅_라우팅.md`

### Task 3: 소프트웨어공학 및 테스트 문서 6개 작성

**Files:**
- Create: `.../04_소프트웨어공학_및_테스트/01_테스트_기본원칙과_프로세스.md`
- Create: `.../04_소프트웨어공학_및_테스트/02_화이트박스와_블랙박스_테스트.md`
- Create: `.../04_소프트웨어공학_및_테스트/03_테스트_오라클_검증_확인.md`
- Create: `.../04_소프트웨어공학_및_테스트/04_결함관리와_품질지표.md`
- Create: `.../04_소프트웨어공학_및_테스트/05_형상관리와_버전관리.md`
- Create: `.../04_소프트웨어공학_및_테스트/06_개발방법론과_보안기초.md`

### Task 4: 용어사전 문서 4개 작성

**Files:**
- Create: `.../05_용어사전/01_DB_SQL_핵심용어.md`
- Create: `.../05_용어사전/02_운영체제_네트워크_핵심용어.md`
- Create: `.../05_용어사전/03_소프트웨어공학_보안_핵심용어.md`
- Create: `.../05_용어사전/04_영문약어_빈출정리.md`

### Task 5: SQL 재정리 문서 4개 작성

**Files:**
- Create: `.../06_SQL_프로그래밍_재정리/01_DDL_핵심문장과_제약조건.md`
- Create: `.../06_SQL_프로그래밍_재정리/02_DML_조회절_작성순서.md`
- Create: `.../06_SQL_프로그래밍_재정리/03_JOIN_서브쿼리_함정정리.md`
- Create: `.../06_SQL_프로그래밍_재정리/04_함수_뷰_트랜잭션_체크포인트.md`

### Task 6: 구조 호환성 반영 및 검증

**Files:**
- Modify (generated): `client/src/shared/config/file-structure-sections/learning-info-engineer-practical.ts`

**Step 1: 스크립트 실행**
- Run: `npm run build:learning-config`
- Expected: PASS

**Step 2: 생성 결과 확인**
- 새 문서 경로가 config에 모두 포함됐는지 검색한다.

**Step 3: 린트 확인**
- `ReadLints` 로 generated TS 파일 이상 여부를 확인한다.

---

Plan complete and saved to `docs/plans/2026-04-14-info-engineer-practical-remaining.md`.
