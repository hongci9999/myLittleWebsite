날짜: 2026-05-19
태그: [SQLD, DML, MERGE, INSERT, UPDATE, 3과목]
주제: MERGE — MATCHED·NOT MATCHED
중요도: 상
---

# MERGE

## 핵심 요약

**MERGE**는 **두 테이블**을 **ON 조건**으로 맞춰, **일치하면 UPDATE**, **없으면 INSERT**를 **한 문장**으로 처리한다. `MERGE INTO 대상 USING 원본 ON (…) WHEN MATCHED THEN … WHEN NOT MATCHED THEN …`.

## 왜 중요한가

- **INSERT + UPDATE**를 나누지 않고 **동기화**할 때 쓴다.
- **WHEN MATCHED / NOT MATCHED** 분기가 시험 **구문·결과 예측**에 나온다.
- Oracle 등 DBMS 문법 — SQLD 3과목 **DML** 마무리.

> 이전: [02_UPDATE와_DELETE](./02_UPDATE와_DELETE.md)

---

## 1. MERGE란

| 항목 | 내용 |
|------|------|
| **역할** | 두 테이블을 **조건**에 따라 비교해 **UPDATE·INSERT**를 **한 번에** 수행 |
| **분류** | **DML** (INSERT·UPDATE·DELETE·MERGE 중 하나) |
| **비유** | 원본(`USING`) 데이터로 **대상(`INTO`)** 테이블을 **맞춤(병합)** |

---

## 2. 구문 골격

```sql
MERGE INTO 대상_테이블 [별칭]
     USING 원본_테이블 [별칭]
        ON (조인_조건)
WHEN MATCHED THEN
     UPDATE SET …
WHEN NOT MATCHED THEN
     INSERT (…) VALUES (…);
```

| 절 | 역할 |
|----|------|
| **MERGE INTO A** | **갱신·삽입 대상** 테이블 A |
| **USING B** | 비교·참조 **원본** 테이블 B |
| **ON (조건)** | A와 B **매칭** 기준 |
| **WHEN MATCHED** | 조건 **일치** → 보통 **UPDATE** |
| **WHEN NOT MATCHED** | **불일치** → 보통 **INSERT** |

> **MATCHED**·**NOT MATCHED** 중 **하나만** 쓰는 것도 가능.

---

## 3. 예제 — \<학생\> · \<학생_최신\>

### 대상 — \<학생\> (별칭 `t`)

| 학번 | 이름 | 나이 | 학년 |
|------|------|------|------|
| 1 | 철수 | 21 | 2 |
| 3 | 민수 | 20 | 1 |
| 4 | 우성 | 25 | 3 |
| 5 | 길동 | 23 | 1 |
| 6 | 선영 | 20 | 1 |

### 원본 — \<학생_최신\> (별칭 `s`)

| 학번 | 이름 | 나이 | 학년 |
|------|------|------|------|
| 3 | 민수 | **22** | 1 |
| 11 | 선우 | 24 | 3 |

| 행 | ON(`이름`) 결과 | 동작 |
|----|-----------------|------|
| 민수 | **MATCHED** (이름 같음) | **UPDATE** — 나이 20→**22** |
| 선우 | **NOT MATCHED** | **INSERT** — 새 행 추가 |

---

## 4. SQL 예시

```sql
MERGE INTO 학생 t
     USING 학생_최신 s
        ON (t.이름 = s.이름)
WHEN MATCHED THEN
     UPDATE SET t.이름 = s.이름,
                t.나이 = s.나이,
                t.학년 = s.학년
WHEN NOT MATCHED THEN
     INSERT (학번, 이름, 나이, 학년)
     VALUES (s.학번, s.이름, s.나이, s.학년);
```

| 항목 | 설명 |
|------|------|
| **ON (t.이름 = s.이름)** | **이름**으로 같은 사람인지 판별 |
| **MATCHED** | 민수 — `나이` 등 **갱신** |
| **NOT MATCHED** | 선우 — **새 학번 11** 행 **삽입** |

---

## 5. 쿼리 수행 후 — \<학생\>

| 학번 | 이름 | 나이 | 학년 |
|------|------|------|------|
| 1 | 철수 | 21 | 2 |
| 3 | 민수 | **22** | 1 |
| 4 | 우성 | 25 | 3 |
| 5 | 길동 | 23 | 1 |
| 6 | 선영 | 20 | 1 |
| **11** | **선우** | **24** | **3** |

| 변화 | 내용 |
|------|------|
| 민수 | **UPDATE** (나이 20→22) |
| 선우 | **INSERT** (학번 11) |
| 철수·우성·길동·선영 | 원본에 없음 → **변화 없음** |

---

## 6. MERGE vs INSERT + UPDATE

| 구분 | MERGE | INSERT + UPDATE 따로 |
|------|-------|------------------------|
| **문장 수** | **1개** | 2개 이상 |
| **용도** | 원본·대상 **동기화** | 단계 나눠 처리 |
| **조건** | **ON** + MATCHED 분기 | 각각 WHERE·존재 검사 |

---

## 7. 시험 포인트 / 함정

| 구분 | 내용 |
|------|------|
| DML 4종 | MERGE 포함 |
| INTO / USING | **대상** vs **원본** |
| MATCHED | **UPDATE** |
| NOT MATCHED | **INSERT** |
| ON 절 | **매칭 키** — 시험에서 **결과 행 예측** |
| 함정 | ON에 쓴 컬럼을 UPDATE에서 바꾸면 **제한**되는 DBMS 있음 |
| 함정 | DELETE 분기(`WHEN MATCHED THEN DELETE`)는 **고급**·교재 범위 밖일 수 있음 |

---

## 8. 연결 노트

- 이전: [02_UPDATE와_DELETE](./02_UPDATE와_DELETE.md)
- INSERT: [01_DML과_INSERT](./01_DML과_INSERT.md)
- 다음: [04_TCL과_트랜잭션](./04_TCL과_트랜잭션.md)
