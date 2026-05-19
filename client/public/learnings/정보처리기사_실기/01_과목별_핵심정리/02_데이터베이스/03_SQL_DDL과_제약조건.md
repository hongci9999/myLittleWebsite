날짜: 2026-04-14
태그: [강의정리, 정보처리기사, 실기, 데이터베이스, SQL, DDL]
주제: DDL 문법, CREATE/ALTER/DROP/TRUNCATE, 제약조건, 참조 무결성 옵션
중요도: 상
---

# SQL DDL과 제약조건

## 핵심 요약

DDL은 데이터 구조를 정의하고 바꾸는 언어다. 실기에서는 `CREATE TABLE`, `ALTER TABLE`, `DROP`, 제약조건 작성, `CASCADE`/`RESTRICT` 해석이 자주 출제된다.

## 왜 중요한가

- DDL 문제는 문장을 직접 완성하게 하거나, 실행 결과를 묻는 형태로 나온다.
- 제약조건은 무결성 파트와 연결되며, SQL 작성 문제에서 실수하기 쉽다.
- DBMS마다 세부 문법 차이가 있으므로 "문제에 제시된 문법을 우선"하는 원칙이 중요하다.

## 1. DDL의 종류

| 명령어 | 목적 |
|---|---|
| `CREATE` | 객체 생성 |
| `ALTER` | 객체 구조 변경 |
| `DROP` | 객체 삭제 |
| `TRUNCATE` | 테이블 구조 유지, 데이터만 전체 삭제 |

## 2. CREATE TABLE

```sql
CREATE TABLE 학생 (
  학번 INT NOT NULL,
  이름 VARCHAR(20) NOT NULL,
  학과코드 CHAR(3),
  PRIMARY KEY (학번)
);
```

### 자주 쓰는 자료형

- `INT`
- `CHAR`
- `VARCHAR`
- `DATE`
- `NUMBER`

## 3. 제약조건

| 제약조건 | 의미 |
|---|---|
| `NOT NULL` | NULL 허용 안 함 |
| `UNIQUE` | 중복 허용 안 함 |
| `PRIMARY KEY` | 기본키, 중복/NULL 불가 |
| `FOREIGN KEY` | 다른 테이블 기본키 참조 |
| `CHECK` | 조건에 맞는 값만 허용 |
| `DEFAULT` | 기본값 지정 |

### 외래키 예시

```sql
CREATE TABLE 사원 (
  사원번호 INT PRIMARY KEY,
  성명 VARCHAR(20),
  부서코드 CHAR(3),
  FOREIGN KEY (부서코드) REFERENCES 부서(부서코드)
);
```

## 4. ALTER TABLE

```sql
ALTER TABLE 학생 ADD 주소 VARCHAR(50);
ALTER TABLE 학생 DROP COLUMN 주소;
ALTER TABLE 학생 ADD CONSTRAINT UQ_학생이름 UNIQUE(이름);
```

실기에서는 보통 다음 두 방향이 자주 나온다.

- 컬럼 추가/삭제
- 제약조건 추가/삭제

## 5. DROP과 TRUNCATE

### DROP

- 객체 자체를 없앤다.
- 테이블 구조도 사라진다.

### TRUNCATE

- 테이블 구조는 유지한다.
- 내부 데이터만 전체 삭제한다.

## 6. CASCADE와 RESTRICT

| 옵션 | 의미 |
|---|---|
| `CASCADE` | 의존 관계에 영향 전파 또는 연쇄 처리 |
| `RESTRICT` | 참조 관계가 있으면 거부 |

실기에서는 보통:

- 참조 중이면 `RESTRICT` 는 실패
- `CASCADE` 는 연쇄 반영

으로 이해하면 된다. 다만 최종 답은 문제에서 제시한 DBMS/교재 기준을 따른다.

## 7. 예제

### 예제 1: 테이블 생성

```sql
CREATE TABLE 부서 (
  부서코드 CHAR(3) PRIMARY KEY,
  부서명 VARCHAR(20) NOT NULL
);
```

### 예제 2: 제약 추가

```sql
ALTER TABLE 사원
ADD CONSTRAINT FK_사원_부서
FOREIGN KEY (부서코드) REFERENCES 부서(부서코드);
```

### 예제 3: DROP 해석

```sql
DROP TABLE 부서 RESTRICT;
```

- 다른 테이블이 `부서`를 참조하고 있으면 삭제 실패 가능

## 8. 자주 틀리는 함정

### 8.1 `PRIMARY KEY` 와 `UNIQUE` 동일시

- 둘 다 중복은 허용하지 않지만
- `PRIMARY KEY` 는 NULL도 허용하지 않는다.

### 8.2 `DROP` 과 `TRUNCATE` 혼동

- `DROP` 은 구조까지 삭제
- `TRUNCATE` 는 데이터만 삭제

### 8.3 외래키는 참조 대상이 기본키여야 함

- 보통 참조 대상은 다른 릴레이션의 기본키다.

## 9. 시험장에서 푸는 순서

1. 구조 생성인지 변경인지 삭제인지 먼저 구분한다.
2. 컬럼 정의와 제약조건을 나눠 읽는다.
3. 기본키/외래키/NULL 허용 여부를 확인한다.
4. `CASCADE`, `RESTRICT` 옵션이 있으면 참조 관계를 먼저 본다.
5. DBMS 문법 차이가 있으면 문제 지문 기준으로 쓴다.

## 한 페이지 요약

- DDL은 구조를 정의/변경/삭제하는 언어다.
- `CREATE`, `ALTER`, `DROP`, `TRUNCATE` 역할을 구분해야 한다.
- 제약조건은 `NOT NULL`, `UNIQUE`, `PRIMARY KEY`, `FOREIGN KEY`, `CHECK`, `DEFAULT` 가 핵심이다.
- `DROP` 은 구조까지 삭제, `TRUNCATE` 는 데이터만 삭제다.
- `CASCADE` 와 `RESTRICT` 는 참조 관계 해석 문제에서 자주 출제된다.
