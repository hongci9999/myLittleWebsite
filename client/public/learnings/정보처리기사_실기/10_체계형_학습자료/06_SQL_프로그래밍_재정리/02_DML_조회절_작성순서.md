날짜: 2026-04-14
태그: [강의정리, 정보처리기사, 실기, SQL, DML]
주제: SELECT 문장 골격, WHERE/GROUP BY/HAVING/ORDER BY 사용 위치
중요도: 상
---

# DML 조회절 작성순서

## 핵심 요약

실기 SQL은 조회문의 순서를 틀리면 연쇄적으로 오답이 된다. 따라서 SELECT 절의 고정 골격을 먼저 잡고, WHERE와 HAVING 차이를 확실히 구분해야 한다.

## 기본 골격

```sql
SELECT 컬럼
FROM 테이블
WHERE 조건
GROUP BY 그룹컬럼
HAVING 그룹조건
ORDER BY 정렬컬럼;
```

## 핵심 구분

- WHERE = 행 조건
- GROUP BY = 그룹 생성
- HAVING = 그룹 결과 조건
- ORDER BY = 정렬

## 예제

```sql
SELECT 부서코드, COUNT(*)
FROM 사원
WHERE 급여 >= 3000
GROUP BY 부서코드
HAVING COUNT(*) >= 2
ORDER BY 부서코드;
```

## 함정

- HAVING 대신 WHERE에 집계 조건을 쓰면 안 된다.
- UPDATE/DELETE에서 WHERE가 없으면 전체 행이 대상이 된다.

## 한 페이지 요약

- SELECT 문은 골격을 통째로 외운다.
- WHERE는 행, HAVING은 그룹을 처리한다.
