날짜: 2026-04-14
태그: [강의정리, 정보처리기사, 실기, SQL, DDL]
주제: CREATE/ALTER/DROP 핵심 문장 패턴과 제약조건 빠른 정리
중요도: 상
---

# DDL 핵심문장과 제약조건

## 핵심 요약

시험 직전 DDL은 "문장 골격"을 통째로 기억하는 것이 가장 빠르다. CREATE, ALTER, DROP의 대표 형태와 기본 제약조건만 정확히 외워도 실전에서 큰 실수를 줄일 수 있다.

## 핵심 문장

```sql
CREATE TABLE 테이블명 (
  컬럼명 데이터형 [NOT NULL],
  ...
  PRIMARY KEY (컬럼명),
  FOREIGN KEY (컬럼명) REFERENCES 참조테이블(컬럼명)
);
```

```sql
ALTER TABLE 테이블명 ADD 컬럼명 데이터형;
ALTER TABLE 테이블명 ADD CONSTRAINT 제약명 PRIMARY KEY (컬럼명);
DROP TABLE 테이블명 [CASCADE | RESTRICT];
```

## 제약조건 한눈정리

- NOT NULL = NULL 금지
- UNIQUE = 중복 금지
- PRIMARY KEY = 중복/NULL 금지
- FOREIGN KEY = 참조 무결성 유지
- CHECK = 조건 제한
- DEFAULT = 기본값

## 함정

- PRIMARY KEY와 UNIQUE를 동일하게 보면 안 된다.
- DROP은 구조 삭제, DELETE는 행 삭제다.

## 한 페이지 요약

- DDL은 구조를 만든다.
- CREATE, ALTER, DROP의 문장 뼈대를 통째로 기억한다.
