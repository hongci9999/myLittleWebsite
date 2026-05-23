# SQLD 2과목 — SQL 기본 및 활용

날짜: 2026-05-19  
태그: [SQLD, SQL, 2과목]

---

## 목적

- SQLD 필기 **2과목(40문항)** 대비
- DDL·DML·조인·함수·그룹·서브쿼리 등 **SQL 문법·활용** 정리

## 1과목과의 연결

| 1과목 (모델링) | 2과목 (SQL) |
|----------------|-------------|
| 엔터티 = 테이블 = 릴레이션 | RDBMS 테이블·튜플 |
| PK·FK·식별자 | 제약·조인 조건 |
| 정규화·분해 | SELECT·JOIN으로 재결합 |
| 트랜잭션·ACID | TCL (COMMIT, ROLLBACK) |

→ 1과목: [../01_데이터_모델링의_이해/](../01_데이터_모델링의_이해/)

## 문서 목록

| 번호 | 파일 | 주제 |
|------|------|------|
| 01 | [01_RDBMS와_SQL_개요](./01_RDBMS와_SQL_개요.md) | RDBMS, 테이블 용어, SQL 4분류 |
| 02 | [02_관계대수_연산자](./02_관계대수_연산자.md) | σ·π·∪·∩·−·×·⋈, SQL 대응 |
| 03 | [03_SELECT_문_구조와_실행순서](./03_SELECT_문_구조와_실행순서.md) | 절 구성, FWGHSO 실행 순서 |
| 04 | [04_SELECT_기본_문법](./04_SELECT_기본_문법.md) | *, DISTINCT, WHERE, AS |
| 05 | [05_SQL_함수_문자함수](./05_SQL_함수_문자함수.md) | 집계·NULL·CASE/DECODE·변환 |
| 06 | [06_WHERE_절과_비교연산자](./06_WHERE_절과_비교연산자.md) | 비교·IN/BETWEEN·우선순위·LIKE·IS NULL |
| 07 | [07_GROUP_BY와_HAVING](./07_GROUP_BY와_HAVING.md) | GROUP BY, HAVING, WHERE 혼합 |
| 08 | [08_ORDER_BY절](./08_ORDER_BY절.md) | ASC/DESC, GROUP BY 연동, NULL 정렬 |
| 09 | [09_조인_개요](./09_조인_개요.md) | EQUI·NON EQUI·표준조인 |
| 10 | [10_INNER_JOIN](./10_INNER_JOIN.md) | INNER JOIN, USING·ON |
| 11 | [11_NATURAL_JOIN과_CROSS_JOIN](./11_NATURAL_JOIN과_CROSS_JOIN.md) | NATURAL·CROSS·OUTER JOIN |

→ **SQL 활용**: [../02_SQL_활용/](../02_SQL_활용/) (서브쿼리 등)
