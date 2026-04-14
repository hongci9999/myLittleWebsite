날짜: 2026-04-13
태그: [참고, 정보처리기사, 실기, SQL, Oracle, MySQL, ANSI]
주제: 시험·교재별 DBMS 문법 차이 (발췌)
---

# DBMS·실기 문법 참고 (Oracle / MySQL / 공통)

정보처리기사 실기는 **출제 연도·교재**에 따라 Oracle, MySQL, ANSI SQL에 가까운 문법이 섞일 수 있습니다.  
이 문서는 **“문제에 나온 문법을 그대로 따른다”**는 전제 위에서, 자주 엇갈리는 부분만 **발췌**했습니다.  
**사용 중인 교재의 예문이 최종 기준**입니다.

---

## 1. 행 개수 제한 (상위 N건)

| 구분 | 예시 느낌 |
|------|-----------|
| **MySQL 등** | `SELECT … FROM … ORDER BY … LIMIT n` |
| **Oracle (전통)** | `WHERE ROWNUM <= n` (ORDER BY와 같이 쓸 때 순서 주의) 또는 `FETCH FIRST n ROWS ONLY` (버전에 따라) |
| **실기** | 문제에 제시된 형태를 **그대로** 선택 |

---

## 2. 문자열 연결

| 구분 | 예시 |
|------|------|
| **ANSI / MySQL** | `CONCAT(a, b)` 또는 `\|\|` (환경에 따라) |
| **Oracle** | `\|\|` 가 흔함 |

---

## 3. 날짜·시간 리터럴

| 구분 | 비고 |
|------|------|
| **Oracle** | `DATE`, `TIMESTAMP` 리터럴 형식이 문제에 명시되는 경우가 많음. |
| **MySQL** | `'2026-04-13'` 같은 문자 리터럴이 날짜로 해석되는 경우. |
| **공통** | `CURRENT_DATE`, `NOW()` / `SYSDATE` 등 **함수 이름**은 제품별로 다름. |

---

## 4. DDL / 제약 이름

- `CREATE TABLE` 안에 `CONSTRAINT 이름 PRIMARY KEY (…)` 처럼 **이름을 붙이는지**는 문제 스타일에 따름.
- `ON DELETE CASCADE`, `ON UPDATE …`, `SET DEFAULT` 등 **참조 액션** 지원 범위는 **DBMS·버전**에 따라 다름 → **문제 지문** 우선.
- **제약 제거**: `ALTER TABLE … DROP CONSTRAINT 이름`이 일반적이나, **UNIQUE**를 인덱스로 구현한 DB에서는 `DROP INDEX` 형태가 나오기도 함 → 교재·기출 표현을 따른다.

---

## 5. DCL / 권한 객체 표기

- `GRANT SELECT ON 스키마.테이블 TO 사용자` 처럼 **스키마(사용자) 접두사**가 붙는지는 Oracle 스타일 문제에서 자주 등장합니다.
- 문장 **순서**(권한 → 객체 → 대상)는 암기보다 **문제에 나온 템플릿**에 맞추기.
- `REVOKE ... CASCADE | RESTRICT`, `WITH GRANT OPTION`, `TO PUBLIC` 등은 **제품·기출 표현**이 다를 수 있음 → 상세는 `03_DCL_및_트랜잭션/01_Transaction_and_Auth.md`.
- 트랜잭션: `BEGIN`/`START TRANSACTION` 표기, **DDL 후 암묵적 COMMIT** 여부는 DBMS별 → 지문·교재 기준.

---

## 6. 실기에서의 사용법

1. 교재 1권을 정하고, 그 책의 **“실기 환경 안내”** 페이지를 먼저 읽는다.  
2. 이 파일은 **참고용 체크리스트**로만 두고, 충돌하면 **교재·기출**을 덮어쓴다.  
3. 모의고사에서는 **답안지에 나온 키워드**(`LIMIT` vs `FETCH` vs `ROWNUM` 등)를 그대로 익힌다.

---

## 7. 관련 노트

- SQL 개념: `01_DDL`(특히 `01_DDL/02_Constraints.md`), `02_DML`(기본·집계·조인/서브쿼리), `03_DCL_및_트랜잭션`(특히 `01_Transaction_and_Auth.md`), `04_기타/01_Builtin_Functions_and_View.md`
- 손풀이 연습: `99_Practice_Problems/01_Join_서브쿼리_통합예제.md`
