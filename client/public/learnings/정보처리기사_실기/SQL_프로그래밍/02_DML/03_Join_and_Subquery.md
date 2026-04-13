날짜: 2026-04-13
태그: [강의정리, 정보처리기사, 실기, SQL, DML, JOIN, 서브쿼리]
주제: 조인(INNER/OUTER) 및 서브쿼리(IN, ANY, ALL, EXISTS)
---

# [DML-3] 조인(JOIN) 및 서브쿼리(Subquery)

다중 테이블 **결과 집합**을 손으로 그리는 연습이 실기 고득점에 직결됩니다.

---

## 1. 개념

### 조인

- **INNER JOIN**: 양쪽에 **매칭되는 행만** 결과에 포함.
- **LEFT OUTER JOIN**: 왼쪽 테이블 행은 **전부** 유지, 오른쪽에 매칭 없으면 NULL.
- **RIGHT OUTER JOIN**: 오른쪽 기준(문제에서 드물게 명시).
- **FULL OUTER JOIN**: 양쪽 모두 유지(DB/교재에 따라 생략 가능).

### 서브쿼리

- **스칼라 서브쿼리**: 단일 값(한 행 한 열).
- **IN (서브쿼리)**: 서브쿼리 결과 집합에 **값이 포함**되면 참.
- **비교 연산자 + ANY | ALL**: 스칼라와 집합의 비교.
- **EXISTS (서브쿼리)**: 서브쿼리가 **한 행이라도** 반환하면 참(존재 여부).

---

## 2. 문법

### INNER JOIN

```sql
SELECT A.컬럼, B.컬럼
FROM   테이블A A
JOIN   테이블B B ON A.키 = B.키;
```

### LEFT OUTER JOIN

```sql
SELECT A.컬럼, B.컬럼
FROM   테이블A A
LEFT JOIN 테이블B B ON A.키 = B.키;
```

### 서브쿼리

```sql
WHERE 컬럼 IN (SELECT ...);

WHERE 컬럼 > ANY (SELECT ...);
WHERE 컬럼 > ALL (SELECT ...);

WHERE EXISTS (SELECT 1 FROM ... WHERE 상관조건);
```

---

## 3. IN vs ANY vs ALL (정리)

> **IMPORTANT**
>
> - **IN**: 서브쿼리 결과 **하나라도 일치**하면 참( `= 값1 OR = 값2 ...` 와 유사).
> - **ANY**: `> ANY`면 결과 중 **최소 하나보다 크면** 참(예: `5 > ANY(3,7,9)` → 참).
> - **ALL**: `> ALL`면 결과 **모든 값보다 커야** 참(예: `10 > ALL(3,7,9)` → 거짓).

---

## 4. 예시

**사원(사원번호, 성명, 부서코드)**, **부서(부서코드, 부서명)**

```sql
SELECT s.성명, d.부서명
FROM   사원 s
JOIN   부서 d ON s.부서코드 = d.부서코드;
```

```sql
-- 부서가 배정되지 않은 사원까지(부서코드 NULL 또는 매칭 실패 케이스는 데이터에 따라)
SELECT s.성명, d.부서명
FROM   사원 s
LEFT JOIN 부서 d ON s.부서코드 = d.부서코드;
```

```sql
-- 급여가 부서 10 평균보다 큰 사원
SELECT *
FROM   사원
WHERE  급여 > (SELECT AVG(급여) FROM 사원 WHERE 부서코드 = '10');
```

```sql
-- 주문을 한 적 있는 고객만
SELECT *
FROM   고객 c
WHERE  EXISTS (
  SELECT 1 FROM 주문 o WHERE o.고객번호 = c.고객번호
);
```

---

## 5. 실행 결과(예시)

**사원**

| 사원번호 | 성명 | 부서코드 |
|---------|------|----------|
| 1 | 김 | 10 |
| 2 | 이 | 20 |
| 3 | 박 | NULL |

**부서**

| 부서코드 | 부서명 |
|---------|--------|
| 10 | 개발 |
| 20 | 영업 |

- **INNER JOIN** `사원·부서` → **2행**(박 제외).
- **LEFT JOIN** → **3행**, 박의 부서명은 **NULL**.

---

## 6. 실기 팁

- 조인 조건 누락 → **카테시안 곱**(행 폭발). 문제에서 의도한지 확인.
- **상관 서브쿼리**는 바깥 행마다 안쪽이 다시 평가된다는 점으로 EXISTS 의미를 기억.

다음: `03_DCL_및_트랜잭션/01_Transaction_and_Auth.md`
