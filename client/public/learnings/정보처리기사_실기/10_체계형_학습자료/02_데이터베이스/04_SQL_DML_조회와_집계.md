날짜: 2026-04-14
태그: [강의정리, 정보처리기사, 실기, 데이터베이스, SQL, DML]
주제: SELECT, INSERT, UPDATE, DELETE, WHERE, GROUP BY, HAVING, ORDER BY, 집계 함수
중요도: 상
---

# SQL DML, 조회와 집계

## 핵심 요약

DML은 실제 데이터를 조회하고 조작하는 언어다. 실기에서는 `SELECT` 절의 사용 위치, `WHERE` 와 `HAVING` 차이, 집계 함수, `INSERT`/`UPDATE`/`DELETE` 의 결과를 정확히 아는 것이 중요하다.

## 왜 중요한가

- 실기 SQL 문제의 가장 큰 비중은 조회문 해석과 작성이다.
- `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY` 를 섞어서 출제하는 경우가 많다.
- DML은 문법을 외우는 것보다 "언제 어떤 절을 쓰는가"를 이해해야 한다.

## 1. DML의 종류

| 명령어 | 목적 |
|---|---|
| `SELECT` | 조회 |
| `INSERT` | 삽입 |
| `UPDATE` | 수정 |
| `DELETE` | 삭제 |

## 2. SELECT 기본 구조

```sql
SELECT 컬럼명
FROM 테이블명
WHERE 조건식
GROUP BY 그룹컬럼
HAVING 그룹조건
ORDER BY 정렬컬럼;
```

### 읽는 순서와 쓰는 순서

- 문장은 `SELECT -> FROM -> WHERE -> GROUP BY -> HAVING -> ORDER BY` 형태로 쓴다.
- 문제를 풀 때는 보통 `FROM/WHERE` 조건부터 읽고, 그 다음 그룹화와 정렬을 해석하면 편하다.

## 3. 조건식

### 자주 쓰는 조건

- `=`, `<>`, `>`, `<`, `>=`, `<=`
- `BETWEEN A AND B`
- `IN (...)`
- `LIKE`
- `IS NULL`

### 예시

```sql
SELECT *
FROM 학생
WHERE 점수 >= 80
  AND 학과 = '컴공';
```

## 4. 집계 함수

| 함수 | 의미 |
|---|---|
| `COUNT()` | 개수 |
| `SUM()` | 합계 |
| `AVG()` | 평균 |
| `MAX()` | 최대값 |
| `MIN()` | 최소값 |

## 5. GROUP BY와 HAVING

- `GROUP BY` : 그룹을 만든다.
- `HAVING` : 그룹 결과에 조건을 건다.

```sql
SELECT 학과, COUNT(*) AS 인원수
FROM 학생
GROUP BY 학과
HAVING COUNT(*) >= 2;
```

## 6. ORDER BY

- 기본은 오름차순 `ASC`
- 내림차순은 `DESC`

```sql
SELECT 이름, 점수
FROM 학생
ORDER BY 점수 DESC, 이름 ASC;
```

## 7. INSERT, UPDATE, DELETE

### INSERT

```sql
INSERT INTO 학생 (학번, 이름, 학과)
VALUES (1001, '김민수', '컴공');
```

### UPDATE

```sql
UPDATE 학생
SET 점수 = 95
WHERE 학번 = 1001;
```

### DELETE

```sql
DELETE FROM 학생
WHERE 학번 = 1001;
```

## 8. 코드 추적 예제

### 예제 1: WHERE vs HAVING

```sql
SELECT 부서코드, COUNT(*) AS 인원수
FROM 사원
WHERE 급여 >= 3000
GROUP BY 부서코드
HAVING COUNT(*) >= 2;
```

해석:

1. 급여가 3000 이상인 사원만 먼저 추린다.
2. 그 결과를 부서별로 그룹화한다.
3. 그룹별 인원수가 2명 이상인 부서만 남긴다.

### 예제 2: UPDATE 결과 해석

```sql
UPDATE 사원
SET 급여 = 급여 + 100
WHERE 부서코드 = 'D10';
```

- 부서코드가 `D10` 인 사원의 급여만 100 증가
- `WHERE` 가 없으면 전체 행이 수정된다는 점이 함정

## 9. 자주 틀리는 함정

### 9.1 `WHERE` 와 `HAVING` 혼동

- `WHERE` 는 개별 행 조건
- `HAVING` 은 그룹 결과 조건

### 9.2 `DELETE` 와 `DROP` 혼동

- `DELETE` 는 행 삭제
- `DROP` 은 객체 삭제

### 9.3 `UPDATE` 에서 `WHERE` 누락

- 전체 행이 수정될 수 있다.

### 9.4 집계 함수와 일반 컬럼 혼용

- `GROUP BY` 없이 집계 함수와 일반 컬럼을 함께 쓰면 오류가 날 수 있다.

## 10. 시험장에서 푸는 순서

1. 조회인지 삽입/수정/삭제인지 먼저 구분한다.
2. 조회문이면 FROM 대상과 WHERE 조건을 먼저 읽는다.
3. GROUP BY 유무를 본 뒤 HAVING 을 해석한다.
4. 마지막에 ORDER BY 로 정렬 방향을 확인한다.
5. UPDATE/DELETE는 WHERE 누락 여부를 반드시 체크한다.

## 한 페이지 요약

- DML은 SELECT, INSERT, UPDATE, DELETE다.
- `WHERE` 는 행 조건, `HAVING` 은 그룹 조건이다.
- 집계 함수는 COUNT, SUM, AVG, MAX, MIN이 핵심이다.
- `ORDER BY` 는 정렬, 기본은 ASC다.
- UPDATE/DELETE 에서 WHERE가 빠지면 전체 행이 대상이 될 수 있다.
