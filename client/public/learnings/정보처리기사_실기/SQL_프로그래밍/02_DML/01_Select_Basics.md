날짜: 2026-04-13
태그: [강의정리, 정보처리기사, 실기, SQL, DML, SELECT]
주제: SELECT 기본, WHERE, 연산자, ORDER BY, INSERT/UPDATE/DELETE
---

# [DML-1] 기본 데이터 조작 (SELECT · INSERT · UPDATE · DELETE)

실기 SQL 배점 구간에서 **단답형·결과 작성**은 대부분 SELECT와 행 변경문이 중심입니다.

---

## 1. 개념

- **SELECT**: 집합(테이블/뷰)에서 조건에 맞는 행·열을 **질의**.
- **WHERE**: 행 필터. `BETWEEN`, `IN`, `LIKE`, `IS NULL` 등과 조합.
- **ORDER BY**: 정렬. `ASC` 기본, `DESC` 명시.
- **INSERT / UPDATE / DELETE**: 데이터 변경. WHERE 누락 시 전체 행에 영향(시험에서 함정으로 자주 등장).

---

## 2. 문법

### SELECT 기본

```sql
SELECT [DISTINCT] 컬럼목록
FROM   테이블 [별칭]
[WHERE  조건]
[ORDER BY 컬럼 [ASC|DESC], ...];
```

### WHERE에서 자주 쓰는 패턴

```sql
WHERE 컬럼 BETWEEN A AND B
WHERE 컬럼 IN (값1, 값2, ...)
WHERE 컬럼 LIKE '패턴%'   -- % 임의 길이, _ 한 글자
WHERE 컬럼 IS NULL
WHERE 컬럼 IS NOT NULL
```

### INSERT

```sql
INSERT INTO 테이블 (컬1, 컬2) VALUES (값1, 값2);
INSERT INTO 테이블 SELECT ... ;
```

### UPDATE / DELETE

```sql
UPDATE 테이블 SET 컬1 = 식 [, ...] [WHERE 조건];
DELETE FROM 테이블 [WHERE 조건];
```

---

## 3. 예시

**테이블 `사원(사원번호, 성명, 급여, 부서코드)`**

```sql
-- 급여 300 이상 500 이하
SELECT 성명, 급여
FROM 사원
WHERE 급여 BETWEEN 300 AND 500
ORDER BY 급여 DESC;

-- 부서코드가 10 또는 20
SELECT *
FROM 사원
WHERE 부서코드 IN ('10', '20');

-- 성이 김씨
SELECT *
FROM 사원
WHERE 성명 LIKE '김%';

-- 부서 미배정
SELECT *
FROM 사원
WHERE 부서코드 IS NULL;
```

```sql
UPDATE 사원
SET 급여 = 급여 * 1.1
WHERE 부서코드 = '10';

DELETE FROM 사원
WHERE 급여 < 200;
```

---

## 4. 실행 결과(예시)

**사원 데이터**

| 사원번호 | 성명 | 급여 | 부서코드 |
|---------|------|------|----------|
| 1 | 김철수 | 400 | 10 |
| 2 | 이영희 | 250 | 20 |
| 3 | 박민수 | 500 | 10 |

- `WHERE 급여 BETWEEN 300 AND 500` → 행 **1, 3** (2행).
- `WHERE 성명 LIKE '김%'` → 행 **1**만.
- `UPDATE ... WHERE 부서코드='10'` → **2행** 갱신(1, 3).
- `DELETE ... WHERE 급여 < 200` → **0행** 삭제.

---

## 5. 실기 체크

- [ ] `WHERE` 없는 `UPDATE`/`DELETE`가 **전체 행**을 바꾼다는 점 인지.
- [ ] `NULL` 비교는 `= NULL`이 아니라 **`IS NULL`**.
- [ ] 문자열 리터럴은 작은따옴표 `'...'`.

다음: `02_Functions_and_GroupBy.md`
