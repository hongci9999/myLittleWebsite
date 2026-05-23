날짜: 2026-05-19
태그: [SQLD, DCL, GRANT, REVOKE, WITH_GRANT_OPTION, WITH_ADMIN_OPTION, 3과목]
주제: DCL·GRANT·REVOKE·권한 옵션
중요도: 상
---

# DCL과 권한

## 핵심 요약

**DCL**(데이터 제어언어)은 **사용자 권한**을 관리한다. **GRANT**로 부여, **REVOKE**로 회수한다. **객체 권한**(SELECT·INSERT 등)에 **WITH GRANT OPTION**을 주면 받은 사람이 **다른 사용자에게 재부여**할 수 있고, **원권한자가 회수하면 연쇄 회수**된다. **시스템 권한**에 **WITH ADMIN OPTION**을 주면 재부여 가능하지만, **중간 사용자 권한을 회수해도 그가 준 권한은 유지**된다.

## 왜 중요한가

- **GRANT OPTION vs ADMIN OPTION** 의 **회수 차이**는 3과목 **필수 함정**이다.
- **GRANT OPTION vs ADMIN OPTION** 회수 차이는 필기 **필수** 구분이다.

> 이전: [06_ALTER_DROP과_TRUNCATE](./06_ALTER_DROP과_TRUNCATE.md)

---

## 1. DCL (Data Control Language)

| 항목 | 내용 |
|------|------|
| **한글** | 데이터 **제어**언어 |
| **역할** | **사용자·역할**의 DB **권한** 부여·회수 |
| **대표 구문** | **GRANT**, **REVOKE** |

| SQL 4분류 | 예 |
|-----------|-----|
| DML | INSERT, UPDATE … |
| DDL | CREATE, ALTER … |
| **DCL** | **GRANT, REVOKE** |
| TCL | COMMIT, ROLLBACK … |

---

## 2. 권한의 종류

| 구분 | 대상 | 예 |
|------|------|-----|
| **객체 권한** | 테이블·뷰 등 **특정 객체** | SELECT, INSERT, UPDATE, DELETE |
| **시스템 권한** | DB **전역** 작업 | CREATE TABLE, DROP ANY TABLE, DBA 역할 |

---

## 3. GRANT — 권한 부여

```sql
GRANT SELECT, INSERT ON 학생 TO user1;
```

| 항목 | 내용 |
|------|------|
| **권한** | `SELECT`, `INSERT` |
| **객체** | `학생` 테이블 |
| **수신자** | `user1` |

### 자주 쓰는 객체 권한

| 권한 | 역할 |
|------|------|
| **SELECT** | 조회 |
| **INSERT** | 삽입 |
| **UPDATE** | 수정 |
| **DELETE** | 삭제 |
| **ALL PRIVILEGES** | 해당 객체에 대한 **모든** 권한 |

---

## 4. REVOKE — 권한 회수

```sql
REVOKE INSERT ON 학생 FROM user1;
```

| 항목 | 내용 |
|------|------|
| **역할** | `user1`에게 줬던 `학생` 테이블 **INSERT** 권한 **회수** |
| **형태** | `REVOKE 권한 ON 객체 FROM 사용자` |

> GRANT와 **대칭** — `TO` ↔ `FROM`.

---

## 5. WITH GRANT OPTION — 객체 권한

**객체 권한** 부여 시 사용 (SELECT, INSERT, UPDATE, DELETE 등).

```sql
GRANT SELECT ON 학생 TO user1 WITH GRANT OPTION;
```

| 항목 | 내용 |
|------|------|
| **의미** | `user1`이 받은 **SELECT** 권한을 **다른 사용자에게도 부여** 가능 |
| **예** | `user1` → `user2`에게 `SELECT` 재부여 |

### 연쇄 회수 (Cascading Revoke)

```text
관리자 --GRANT+GRANT OPTION--> user1 --GRANT--> user2
```

| 상황 | 결과 |
|------|------|
| 관리자가 **user1** 권한 **REVOKE** | **user2**에게 준 권한도 **함께 회수** |

> **GRANT OPTION**: 위에서 권한을 **뺏으면** 아래로 **연쇄 회수**.

---

## 6. WITH ADMIN OPTION — 시스템 권한

**시스템 권한** 부여 시 사용 (CREATE TABLE, DROP TABLE, **DBA** 역할 등).

```sql
GRANT dba TO user1 WITH ADMIN OPTION;
```

| 항목 | 내용 |
|------|------|
| **의미** | `user1`이 **DBA(또는 해당 시스템 권한)** 를 **다른 사용자에게 부여·회수** 가능 |
| **대상** | **시스템** 권한 — 객체 하나가 아님 |

### 회수 시 — 연쇄 없음

```text
관리자 --GRANT+ADMIN OPTION--> user1 --GRANT dba--> user2
```

| 상황 | 결과 |
|------|------|
| 관리자가 **user1** 권한 **REVOKE** | **user2** 권한은 **유지** (회수되지 않음) |

> **ADMIN OPTION**: 중간 사용자 권한을 회수해도, 그가 **이미 준 권한은 남는다**.

---

## 7. GRANT OPTION vs ADMIN OPTION

| 구분 | **WITH GRANT OPTION** | **WITH ADMIN OPTION** |
|------|------------------------|------------------------|
| **대상** | **객체** 권한 | **시스템** 권한 |
| **예** | SELECT ON 학생 | CREATE TABLE, DBA |
| **재부여** | 가능 | 가능 |
| **원권한자가 중간인 회수** | **연쇄 회수** (하위도 사라짐) | **연쇄 없음** (하위 **유지**) |

```mermaid
flowchart TB
  subgraph grant_option [WITH GRANT OPTION]
    A1[관리자] -->|REVOKE user1| X1[user2 권한도 회수]
  end
  subgraph admin_option [WITH ADMIN OPTION]
    A2[관리자] -->|REVOKE user1| O2[user2 권한 유지]
  end
```

---

## 8. 시험 포인트 / 함정

| 구분 | 내용 |
|------|------|
| DCL | GRANT·REVOKE |
| GRANT | `ON 객체 TO 사용자` |
| REVOKE | `ON 객체 FROM 사용자` |
| GRANT OPTION | **객체** 권한, **연쇄 회수 O** |
| ADMIN OPTION | **시스템** 권한, **연쇄 회수 X** |
| 함정 | GRANT OPTION ↔ ADMIN OPTION **회수 동작** 반대 |
| 함정 | ALL PRIVILEGES = 해당 **객체** 전 권한 |

---

## 9. 연결 노트

- 이전: [06_ALTER_DROP과_TRUNCATE](./06_ALTER_DROP과_TRUNCATE.md)
- DDL·객체: [05_DDL과_CREATE](./05_DDL과_CREATE.md)
- 목차: [04_SQL_관리_구문 README](./README.md) (3과목 01~07)
