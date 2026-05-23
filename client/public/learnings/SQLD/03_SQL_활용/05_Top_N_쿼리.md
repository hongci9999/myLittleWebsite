날짜: 2026-05-19
태그: [SQLD, Top N, TOP, LIMIT, ROWNUM, FETCH FIRST, 2과목]
주제: Top N 쿼리, DBMS별 상위 N건 추출
중요도: 상
---

# Top N 쿼리

## 핵심 요약

**Top N**은 정렬 기준 **상위 N건**만 조회한다. **ORDER BY 필수**(없으면 **무의미·비결정적**). **SQL Server** `TOP n`, **MySQL/PostgreSQL** `LIMIT n`, **Oracle 12c+·DB2** `FETCH FIRST n ROWS ONLY`, **Oracle** **`ROWNUM`**(서브쿼리로 **정렬 후** 적용). **ROWNUM**은 `<=N`만, **`>1` 직접 비교 불가**.

## 왜 중요한가

- DBMS마다 **문법이 달라** 시험에서 **제품 구분**이 나온다.
- Oracle **ROWNUM** 함정(인라인 뷰·연산자)은 **빈출**.
- 윈도우 함수·`ROW_NUMBER`와 **목적이 유사**하나 문법은 별도.

> ORDER BY: [08_ORDER_BY절](../02_SQL_기본/08_ORDER_BY절.md) · 윈도우 순위: [04_윈도우_함수](./04_윈도우_함수.md)

---

## 1. Top N 쿼리란

| 항목 | 내용 |
|------|------|
| **정의** | 테이블에서 **정렬 순서**에 따라 **상위 N개** 행만 추출 |
| **전제** | **`ORDER BY`** 로 “상위” 기준을 **반드시** 지정 |
| **없을 때** | 정렬 없이 Top N → **매번 달라질 수 있는** 임의 N건 |

---

## 2. DBMS별 문법

| DBMS | 문법 | 예 |
|------|------|-----|
| **SQL Server** | **`TOP n`** | `SELECT TOP 5 * FROM 판매 ORDER BY 매출 DESC` |
| **MySQL / PostgreSQL** | **`LIMIT n`** | `… ORDER BY 매출 DESC LIMIT 5` |
| **DB2 / Oracle (12c~)** | **`FETCH FIRST n ROWS ONLY`** | `… ORDER BY 매출 DESC FETCH FIRST 5 ROWS ONLY` |
| **Oracle (공통)** | **`ROWNUM`** + **인라인 뷰** | 아래 §4 |

```sql
-- SQL Server
SELECT TOP 5 매장, 매출 FROM 판매 ORDER BY 매출 DESC;

-- MySQL / PostgreSQL
SELECT 매장, 매출 FROM 판매 ORDER BY 매출 DESC LIMIT 5;

-- Oracle 12c+, DB2
SELECT 매장, 매출 FROM 판매 ORDER BY 매출 DESC
 FETCH FIRST 5 ROWS ONLY;
```

---

## 3. 예 — \<판매\> 상위 5개 매장

**원본** (일부): 매장 A~G, **매출** 무작위 순

```sql
SELECT 매장, 매출
  FROM 판매
 ORDER BY 매출 DESC
 LIMIT 5;   /* DBMS에 맞게 TOP / FETCH FIRST 등 */
```

**결과** (매출 **내림차순** 상위 5건)

| 매장 | 매출 |
|------|------|
| F | (1위) |
| E | (2위) |
| D | (3위) |
| B | (4위) |
| C | (5위) |

→ **정렬 후** 앞에서 **5행**만 남김.

---

## 4. Oracle `ROWNUM`

| 항목 | 내용 |
|------|------|
| **성격** | 조회 결과에 **1부터** 붙는 **가상 열(Pseudo Column)** |
| **주의** | **정렬 전**에 번호가 붙을 수 있음 → **Top N은 서브쿼리** 필수 |

```sql
SELECT *
  FROM (
        SELECT 매장, 매출
          FROM 판매
         ORDER BY 매출 DESC
       )
 WHERE ROWNUM <= 5;
```

| 단계 | 설명 |
|------|------|
| **안쪽** | `ORDER BY 매출 DESC` 로 **정렬** |
| **바깥** | `ROWNUM <= 5` 로 **상위 5건** |

### ROWNUM 사용 제약

| 가능 | 불가·주의 |
|------|-----------|
| `ROWNUM = 1` | `ROWNUM = 2` (**2번째 행만** X) |
| `ROWNUM <= N` | `ROWNUM > 1` (**1보다 큰** 비교 X) |

→ ROWNUM은 **할당되는 순간 1부터** — “2번째 행”을 직접 걸러낼 수 없음. **2위~N위**는 **ROW_NUMBER** 등 사용.

---

## 5. SQL Server `TOP` 옵션

| 옵션 | 설명 |
|------|------|
| **TOP n** | 상위 **n건** |
| **TOP n WITH TIES** | **n번째와 동점**이면 **함께** 포함 |

```sql
SELECT TOP 5 WITH TIES 매장, 매출
  FROM 판매
 ORDER BY 매출 DESC;
```

→ 5위와 **같은 매출**인 매장이 더 있으면 **5건 초과** 가능.

---

## 6. Top N vs 윈도우 함수

| 구분 | Top N (TOP/LIMIT/ROWNUM) | `ROW_NUMBER() OVER` |
|------|--------------------------|---------------------|
| **목적** | **상위 N행만** 결과에 남김 | **순번 열** 추가, 필터는 **바깥 WHERE** |
| **결과 행 수** | **최대 N** | 전체 행 + **번호** |

---

## 7. 시험 포인트 / 함정

| 구분 | 내용 |
|------|------|
| ORDER BY | Top N **전제** — 없으면 **의미 없음** |
| SQL Server | **TOP n** |
| MySQL/PG | **LIMIT n** (ORDER BY **뒤**) |
| Oracle 12c+ | **FETCH FIRST n ROWS ONLY** |
| Oracle ROWNUM | **정렬 서브쿼리** + `ROWNUM <= n` |
| ROWNUM | **가상 열**, `<=N` O, **`>1` X** |
| WITH TIES | SQL Server **동점 포함** |
| 함정 | `WHERE ROWNUM = 2` → **불가** |
| 함정 | `SELECT … ROWNUM … ORDER BY` (한 쿼리) → **정렬 전** 번호 |

---

## 8. 연결 노트

- 이전: [04_윈도우_함수](./04_윈도우_함수.md)
- ORDER BY: [08_ORDER_BY절](../02_SQL_기본/08_ORDER_BY절.md)
- 다음: [06_계층형_질의](./06_계층형_질의.md)
