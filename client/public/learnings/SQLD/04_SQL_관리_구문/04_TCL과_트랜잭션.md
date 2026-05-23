날짜: 2026-05-19
태그: [SQLD, TCL, 트랜잭션, ACID, COMMIT, ROLLBACK, SAVEPOINT, AUTOCOMMIT, 격리수준, 3과목]
주제: TCL·ACID·격리 수준·SAVEPOINT·자동커밋
중요도: 상
---

# TCL과 트랜잭션

## 핵심 요약

**TCL**(트랜잭션 제어언어)은 **COMMIT**(영구 반영)·**ROLLBACK**(되돌리기)·**SAVEPOINT**(부분 되돌릴 지점)로 **트랜잭션**을 제어한다. **AUTOCOMMIT**은 DBMS마다 다르다 — **Oracle**은 **DDL 무조건 자동커밋**, **DML**은 모드에 따라 롤백 가능(기본 **OFF**). **SQL Server**는 **DDL·DML 모두** AUTOCOMMIT 설정에 따르며 기본 **ON**. **격리 수준**↑ → **일관성↑·성능↓**.

## 왜 중요한가

- DML 변경은 **COMMIT 전**까지 확정되지 않는다.
- **격리 수준 표**와 **SAVEPOINT 롤백**은 3과목 **계산·서술**에 자주 나온다.
- 1과목 [트랜잭션·NULL](../01_데이터_모델링의_이해/13_트랜잭션과_NULL.md)과 **연결**해 보면 좋다.

> 이전: [03_MERGE](./03_MERGE.md) · DML: [01~03](./01_DML과_INSERT.md)

---

## 1. 트랜잭션과 TCL

| 항목 | 내용 |
|------|------|
| **트랜잭션** | DB에서 **하나의 논리적 작업 단위** |
| **TCL** | Transaction Control Language — **트랜잭션 제어** 구문 |

---

## 2. ACID — 트랜잭션 4대 특성

| 특성 | 영문 | 의미 |
|------|------|------|
| **원자성** | Atomicity | **전부 수행**되거나 **전혀 수행되지 않음** (All or Nothing) |
| **일관성** | Consistency | 트랜잭션 **전·후** DB가 **일관된 상태** |
| **고립성** | Isolation | 실행 중 트랜잭션끼리 **서로 간섭하지 않음** |
| **지속성** | Durability | **COMMIT** 후 결과는 **영구 저장** (장애 후에도 유지) |

> 암기: **원일고지** 또는 **ACID**

---

## 3. TCL 명령어

| 명령어 | 설명 |
|--------|------|
| **COMMIT** | 변경 내용을 DB에 **영구 반영** |
| **ROLLBACK** | **마지막 COMMIT 이전** 상태로 **되돌림** (전체 취소) |
| **SAVEPOINT** | 이후 **특정 시점까지** 되돌릴 **지점** 지정 |

```sql
SAVEPOINT SV1;
-- … DML …
ROLLBACK TO SV1;   -- SV1 이후만 취소
COMMIT;            -- 확정
```

| 구분 | ROLLBACK | ROLLBACK TO SAVEPOINT |
|------|----------|------------------------|
| **범위** | 트랜잭션 **시작~현재** 전부 | **해당 SAVEPOINT 이후**만 |
| **SAVEPOINT** | 모두 무효화되는 경우 많음 | **지정 시점** 상태로 복귀 |

---

## 4. 격리 수준과 읽기 문제

### 문제 정의

| 문제 | 설명 |
|------|------|
| **Dirty Read** | **아직 COMMIT 안 된** 다른 트랜잭션 데이터를 **읽음** |
| **Non-Repeatable Read** | 같은 트랜잭션에서 **같은 행**을 다시 읽을 때 **값이 바뀜** |
| **Phantom Read** | 같은 조건으로 다시 읽을 때 **행 수(범위)** 가 달라짐 |

### 격리 수준별 발생 여부

| 격리 수준 | Dirty Read | Non-Repeatable Read | Phantom Read |
|-----------|:----------:|:-------------------:|:--------------:|
| **Read Uncommitted** | 발생 | 발생 | 발생 |
| **Read Committed** | **없음** | 발생 | 발생 |
| **Repeatable Read** | 없음 | **없음** | 발생 |
| **Serializable** | 없음 | 없음 | **없음** |

### 트레이드오프

| 방향 | 효과 |
|------|------|
| 격리 수준 **↑** | **일관성 ↑** |
| 격리 수준 **↑** | **성능 ↓** (잠금·대기 증가) |

> **Serializable**이 가장 엄격하고, **Read Uncommitted**가 가장 느슨하다.

---

## 5. SAVEPOINT 예제

### 초기 데이터

| 이름 | 금액 |
|------|------|
| 홍길동 | 5000 |
| 임꺽정 | 10000 |

```sql
-- (1) INSERT 로 위 데이터 삽입 가정

UPDATE … SET 금액 = 금액 - 1000 WHERE 이름 = '홍길동';  -- 홍길동 4000
SAVEPOINT SV1;

UPDATE … SET 금액 = 금액 - 3000 WHERE 이름 = '임꺽정';  -- 임꺽정 7000
SAVEPOINT SV2;

UPDATE … SET 금액 = 금액 - 2000 WHERE 이름 = '홍길동';  -- 홍길동 2000 (미확정)
SAVEPOINT SV3;

ROLLBACK TO SV2;
```

### 단계별 금액

| 단계 | 홍길동 | 임꺽정 | 비고 |
|------|--------|--------|------|
| INSERT 후 | 5000 | 10000 | |
| -1000 | **4000** | 10000 | |
| SV1 | 4000 | 10000 | |
| -3000 | 4000 | **7000** | |
| SV2 | 4000 | 7000 | ← **여기로 복귀** |
| -2000 (SV3 전) | 2000 | 7000 | **ROLLBACK TO SV2 로 취소** |

### ROLLBACK TO SV2 이후 (COMMIT 전 가정)

| 이름 | 금액 |
|------|------|
| **홍길동** | **4000** |
| **임꺽정** | **7000** |

| 항목 | 내용 |
|------|------|
| **유지** | SV2 **이전·시점**까지의 UPDATE (−1000, −3000) |
| **취소** | SV2 **이후** UPDATE (−2000) |
| **SV3** | 설정했어도 **SV2로 롤백**하면 그 이후 작업은 무효 |

> **COMMIT** 하기 전까지는 다른 세션에 **반영되지 않을 수 있음**(격리 수준·DBMS에 따름).

---

## 6. 자동커밋 (AUTOCOMMIT)

**AUTOCOMMIT**이 **ON**이면 문장 실행 직후 **자동으로 COMMIT**된다. **OFF**이면 **명시적 COMMIT·ROLLBACK** 전까지 변경을 **되돌릴 수 있다**(DML, DBMS·설정에 따름).

### Oracle

| 구분 | AUTOCOMMIT 동작 |
|------|-----------------|
| **DDL** | **무조건 자동커밋** (CREATE·ALTER·DROP 등 실행 시 **암시적 COMMIT**) |
| **DML** | **AUTOCOMMIT 모드 ON/OFF**에 따라 다름 — **OFF**면 **ROLLBACK 가능** |
| **기본값** | **AUTOCOMMIT OFF** |

| 항목 | 내용 |
|------|------|
| DDL 후 DML | DDL이 **이미 커밋**되므로, 그 전 DML은 **별도 트랜잭션**이었어야 롤백 가능 |
| 시험 | Oracle **DDL = 항상 자동커밋** |

### SQL Server

| 구분 | AUTOCOMMIT 동작 |
|------|-----------------|
| **DDL·DML** | **AUTOCOMMIT ON/OFF** 설정에 따라 **둘 다** 동작 |
| **기본값** | **AUTOCOMMIT ON** (문장마다 즉시 커밋, `BEGIN TRAN` 없으면) |

### Oracle vs SQL Server 요약

| 항목 | Oracle | SQL Server |
|------|--------|------------|
| **DDL 자동커밋** | **항상** | AUTOCOMMIT 설정 따름 |
| **DML 롤백** | AUTOCOMMIT **OFF** 시 가능 | AUTOCOMMIT **OFF** 시 가능 |
| **기본 AUTOCOMMIT** | **OFF** | **ON** |

> 교재 요약: **Oracle 기본 OFF** / **SQL Server 기본 ON**.

---

## 7. SQL 4분류에서 TCL 위치

| 분류 | 예 |
|------|-----|
| **DML** | INSERT, UPDATE, DELETE, MERGE |
| **DDL** | CREATE, ALTER, DROP … |
| **DCL** | GRANT, REVOKE |
| **TCL** | **COMMIT, ROLLBACK, SAVEPOINT** |

---

## 8. 시험 포인트 / 함정

| 구분 | 내용 |
|------|------|
| TCL 3종 | COMMIT·ROLLBACK·SAVEPOINT |
| ACID | 원일고지 |
| 격리 수준 | **표 암기** — Serializable만 Phantom 없음 |
| 트레이드오프 | 수준 ↑ → 일관성↑ 성능↓ |
| SAVEPOINT | `ROLLBACK TO` 이름 — **그 시점 이후만** 취소 |
| AUTOCOMMIT | Oracle **DDL 무조건** / DML은 모드 |
| AUTOCOMMIT 기본 | Oracle **OFF**, SQL Server **ON** |
| 함정 | ROLLBACK(전체) vs ROLLBACK TO |
| 함정 | Oracle에서 **DDL 실행 = 암시적 COMMIT** |
| 함정 | TRUNCATE·DDL 롤백은 DBMS·설정에 따라 다름 |
| 1과목 연결 | Dirty·Phantom 정의: [13_트랜잭션과_NULL](../01_데이터_모델링의_이해/13_트랜잭션과_NULL.md) |

---

## 9. 연결 노트

- 이전: [03_MERGE](./03_MERGE.md)
- 1과목: [13_트랜잭션과_NULL](../01_데이터_모델링의_이해/13_트랜잭션과_NULL.md)
- DML·롤백: [02_UPDATE와_DELETE](./02_UPDATE와_DELETE.md) (DELETE vs TRUNCATE)
- 다음: [05_DDL과_CREATE](./05_DDL과_CREATE.md)
