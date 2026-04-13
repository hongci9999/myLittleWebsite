날짜: 2026-04-13
태그: [강의정리, 정보처리기사, 실기, SQL, DDL]
주제: 테이블 생성·변경·삭제 (CREATE / ALTER / DROP)
---

# [DDL] 테이블 관리 (CREATE / ALTER / DROP)

정보처리기사 **실기**에서는 테이블 정의문을 직접 작성하거나, 실행 결과(성공/오류/객체 상태)를 묻는 문제가 나올 수 있습니다. **개념 → 문법 → 예시 → 실행 결과** 순으로 익힙니다.

---

## 1. 개념

- **DDL(Data Definition Language)**: 스키마(테이블, 인덱스, 뷰 등)를 정의·변경·삭제하는 명령군.
- **CREATE TABLE**: 새 테이블과 컬럼 정의(자료형, NULL 여부 등)를 선언.
- **ALTER TABLE**: 기존 테이블에 컬럼 추가/삭제, 제약·이름 변경 등 구조 변경.
- **DROP TABLE**: 테이블 자체를 제거. 옵션에 따라 참조 관계와 연동됨.

---

## 2. 문법

### CREATE TABLE

```sql
CREATE TABLE 테이블명 (
  컬럼명1 데이터타입 [NOT NULL | NULL] [DEFAULT 기본값],
  컬럼명2 데이터타입,
  ...
  [, 테이블수준제약 ...]
);
```

### ALTER TABLE (자주 쓰는 형태)

```sql
-- 컬럼 추가
ALTER TABLE 테이블명 ADD 컬럼명 데이터타입 [제약];

-- 컬럼 삭제 (DBMS에 따라 문법 차이 가능 — 시험/교재 기준에 맞출 것)
ALTER TABLE 테이블명 DROP COLUMN 컬럼명;

-- 컬럼 이름/타입 변경 등은 제품마다 상이 — 문제에서 제시된 문법을 따름
```

### DROP TABLE

```sql
DROP TABLE 테이블명 [CASCADE | RESTRICT];
```

- **CASCADE**: 이 객체에 **의존하는 객체**까지 함께 제거(또는 영향 전파)하는 쪽으로 해석되는 경우가 많음.
- **RESTRICT**: 다른 객체가 참조 중이면 **삭제 거부**(오류).

> 시험 문제는 **교재·기출에서 쓰는 CASCADE/RESTRICT 정의**를 기준으로 답을 맞추는 것이 안전합니다.

---

## 3. 예시

```sql
CREATE TABLE 부서 (
  부서코드   CHAR(3)  NOT NULL PRIMARY KEY,
  부서명     VARCHAR(30) NOT NULL
);

CREATE TABLE 사원 (
  사원번호   INT       NOT NULL PRIMARY KEY,
  성명       VARCHAR(20) NOT NULL,
  부서코드   CHAR(3),
  FOREIGN KEY (부서코드) REFERENCES 부서(부서코드)
);

ALTER TABLE 사원 ADD 입사일 DATE DEFAULT CURRENT_DATE;

DROP TABLE 사원 RESTRICT;
```

---

## 4. 실행 결과(예시 해석)

| 상황 | 기대 결과 |
|------|-----------|
| `CREATE TABLE 부서` 성공 | `부서` 테이블이 카탈로그에 등록되고, 빈 테이블로 조회 가능 (`SELECT * FROM 부서` → 행 0건). |
| `DROP TABLE 사원 RESTRICT`인데 `사원`을 참조하는 FK가 다른 테이블에 있음 | **오류**로 삭제 실패(RESTRICT). |
| `DROP TABLE 사원 CASCADE`(문제 조건상 허용 시) | 사원 및 그에 따른 의존 객체 처리가 CASCADE 규칙에 따라 진행(문제에서 제시된 결과표를 그대로 선택). |

---

## 5. 실기 전략 체크리스트

- [ ] PRIMARY KEY / FOREIGN KEY / NOT NULL이 **테이블 정의 안에 일관되게** 들어갔는지 확인.
- [ ] `DROP ... CASCADE | RESTRICT`를 **문맥(참조 관계)**과 함께 읽기.
- [ ] 문제가 Oracle/MySQL/ANSI 중 무엇을 전제로 하는지(있으면) 문법 차이 주의.

다음: `02_Constraints.md`에서 제약조건을 세분화해 정리합니다.
