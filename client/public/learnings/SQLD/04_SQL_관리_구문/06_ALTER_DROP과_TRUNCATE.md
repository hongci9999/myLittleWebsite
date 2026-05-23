날짜: 2026-05-19
태그: [SQLD, DDL, ALTER, DROP, TRUNCATE, 3과목]
주제: ALTER·DROP·TRUNCATE
중요도: 상
---

# ALTER·DROP·TRUNCATE

## 핵심 요약

**ALTER**는 **테이블 구조**를 바꾼다(열 추가·수정·삭제·이름 변경). **DROP**은 **테이블 자체**를 삭제한다 — 다른 테이블이 **참조(FK)** 하면 삭제가 **막힐 수** 있고, **CASCADE CONSTRAINTS**로 참조 FK를 함께 제거할 수 있다. **TRUNCATE**는 **모든 행 데이터**만 지우고 **구조(스키마)는 유지**한다. **DELETE(DML)** 와 달리 **ROLLBACK 불가**인 경우가 많다.

## 왜 중요한가

- **DDL**은 CREATE 다음 **구조 변경·삭제**의 핵심이다.
- **DROP vs TRUNCATE vs DELETE** 구분은 3과목 **빈출**.
- Oracle **DDL 암시적 COMMIT**·TRUNCATE 롤백: [04_TCL](./04_TCL과_트랜잭션.md), [02_UPDATE와_DELETE](./02_UPDATE와_DELETE.md)

> 이전: [05_DDL과_CREATE](./05_DDL과_CREATE.md)

---

## 1. DDL 명령 비교

| 구문 | 대상 | 구조(스키마) | 데이터(행) |
|------|------|:------------:|:----------:|
| **ALTER** | 테이블 | **변경** | 유지 |
| **DROP** | 테이블 | **삭제** | 함께 삭제 |
| **TRUNCATE** | 테이블 | **유지** | **전부 삭제** |
| **DELETE** (DML) | 테이블 | 유지 | 조건·전체 삭제 |

---

## 2. ALTER — 테이블 구조 변경

| 항목 | 내용 |
|------|------|
| **역할** | 기존 테이블의 **열·제약** 등 **구조** 변경 |

### 예시 — \<학생\> 테이블

```sql
-- 열 추가
ALTER TABLE 학생 ADD 학년 INT;

-- 열 타입·크기 변경
ALTER TABLE 학생 MODIFY 이름 VARCHAR(30);

-- 열 삭제
ALTER TABLE 학생 DROP COLUMN 주소;

-- 열 이름 변경
ALTER TABLE 학생 RENAME COLUMN 학번 TO ID;
```

| 구문 | 설명 |
|------|------|
| **ADD** | **새 열** 추가 (`학년 INT`) |
| **MODIFY** | 열 **정의 변경** (`이름` → VARCHAR(30)) |
| **DROP COLUMN** | **열 삭제** (`주소`) |
| **RENAME COLUMN** | **열 이름** 변경 (`학번` → `ID`) |

> DBMS마다 `ALTER` 하위 문법 이름이 다를 수 있음(Oracle **MODIFY**, SQL Server **ALTER COLUMN** 등). **시험·교재 표현**을 따른다.

---

## 3. DROP — 테이블 삭제

| 항목 | 내용 |
|------|------|
| **역할** | **테이블 객체** 자체를 DB에서 **제거** |

```sql
DROP TABLE 학생;
```

| 항목 | 내용 |
|------|------|
| **결과** | `학생` 테이블 **삭제** |
| **제약** | **다른 테이블이 이 테이블을 FK로 참조**하면 **삭제 불가**할 수 있음 |

### CASCADE CONSTRAINTS

```sql
DROP TABLE 학생 CASCADE CONSTRAINTS;
```

| 항목 | 내용 |
|------|------|
| **역할** | `학생` 삭제 + 이 테이블을 **참조하는 FK 제약**도 **함께 삭제** |
| **주의** | **데이터·구조** 영향이 크므로 실무·시험에서 **의미**만 정확히 |

---

## 4. TRUNCATE — 데이터만 전부 삭제

| 항목 | 내용 |
|------|------|
| **역할** | 테이블 **안의 모든 데이터** 삭제 |
| **구조** | **테이블·열 정의(스키마)는 유지** |

```sql
TRUNCATE TABLE 학생;
```

| 항목 | 내용 |
|------|------|
| **Before** | `학생`에 행 여러 개 |
| **After** | **0행**, 테이블·열은 **그대로** |

### TRUNCATE vs DELETE

| 구분 | **TRUNCATE** | **DELETE** |
|------|--------------|------------|
| **분류** | **DDL** | **DML** |
| **범위** | 보통 **전체 행** | `WHERE`로 **일부·전체** |
| **구조** | 유지 | 유지 |
| **ROLLBACK** | **불가**인 경우 많음(교재: 저장소에서 바로 삭제) | 트랜잭션 내 **가능**(일반적) |
| **속도** | 대량 시 **빠른** 편 | 행 단위 |

> 교재: **TRUNCATE**는 **DELETE**와 달리 기억장치에서 바로 지워져 **ROLLBACK 불가**.

---

## 5. 삭제·비우기 한눈에 보기

```text
DROP TABLE     →  테이블 + 데이터  (객체 삭제)
TRUNCATE TABLE →  데이터만 전부    (빈 테이블 유지)
DELETE FROM    →  행 삭제 (DML)    (조건 가능, 롤백 가능)
```

---

## 6. 시험 포인트 / 함정

| 구분 | 내용 |
|------|------|
| ALTER | ADD·MODIFY·DROP COLUMN·RENAME |
| DROP | 테이블 **삭제**, FK 참조 시 **실패** 가능 |
| CASCADE CONSTRAINTS | 참조 **FK 제약** 함께 제거 |
| TRUNCATE | **데이터만** 전부, **스키마 유지** |
| TRUNCATE vs DELETE | DDL vs DML, **ROLLBACK** 함정 |
| 함정 | DROP ≠ TRUNCATE ≠ DELETE |
| 함정 | Oracle **DDL → 암시적 COMMIT** |
| 연결 | [02_UPDATE와_DELETE](./02_UPDATE와_DELETE.md) §4 |

---

## 7. 연결 노트

- 이전: [05_DDL과_CREATE](./05_DDL과_CREATE.md)
- DELETE·TRUNCATE: [02_UPDATE와_DELETE](./02_UPDATE와_DELETE.md)
- TCL·DDL 커밋: [04_TCL과_트랜잭션](./04_TCL과_트랜잭션.md)
- 다음: [07_DCL과_권한](./07_DCL과_권한.md)
