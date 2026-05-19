날짜: 2026-04-14
태그: [강의정리, 정보처리기사, 실기, SQL, JOIN, 서브쿼리]
주제: JOIN, EXISTS, IN, ANY, ALL, NOT IN 함정 정리
중요도: 상
---

# JOIN, 서브쿼리 함정정리

## 핵심 요약

조인과 서브쿼리는 실기 SQL의 킬러 포인트다. 특히 `INNER/LEFT JOIN`, `IN/EXISTS`, `ANY/ALL`, `NOT IN + NULL` 함정을 빠르게 떠올릴 수 있어야 한다.

## 핵심 비교

| 항목 | 의미 |
|---|---|
| INNER JOIN | 일치하는 행만 |
| LEFT JOIN | 왼쪽은 모두 유지 |
| IN | 목록 포함 여부 |
| EXISTS | 결과 존재 여부 |
| ANY | 하나 이상 만족 |
| ALL | 모두 만족 |

## 대표 함정

- JOIN 조건 누락 -> 카테시안 곱
- `NOT IN` + NULL -> 직관과 다른 결과 가능
- `> ANY` 와 `> ALL` 혼동

## 예제

```sql
SELECT *
FROM 고객 c
WHERE EXISTS (
  SELECT 1
  FROM 주문 o
  WHERE o.고객번호 = c.고객번호
);
```

## 한 페이지 요약

- INNER는 교집합, LEFT는 왼쪽 전체 유지다.
- EXISTS는 존재 여부, IN은 값 포함 여부다.
- ANY는 하나, ALL은 전부를 만족해야 한다.
