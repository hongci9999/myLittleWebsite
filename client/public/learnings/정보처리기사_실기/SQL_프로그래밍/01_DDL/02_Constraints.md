날짜: 2026-04-13
태그: [강의정리, 정보처리기사, 실기, SQL, DDL, 제약조건]
주제: PRIMARY KEY, FOREIGN KEY, CHECK, UNIQUE, 참조 무결성
---

# [DDL] 제약조건 (Constraints)

실기에서 **CREATE TABLE 문 완성**, **제약 이름 고르기**, **FK 동작(ON DELETE/UPDATE)** 이어 붙이기 유형이 자주 나옵니다.

---

## 1. 개념

| 제약 | 의미 |
|------|------|
| **PRIMARY KEY** | 행을 유일하게 식별. NULL 불가. 테이블당 하나(복합키는 컬럼 묶음 하나). |
| **UNIQUE** | 값 중복 불가. NULL 허용 여부는 DBMS마다 다를 수 있음(실기는 문제 기준). |
| **NOT NULL** | 해당 컬럼은 NULL 저장 불가. |
| **FOREIGN KEY** | 다른 테이블의 기본키(또는 UNIQUE)를 참조. 참조 무결성 유지. |
| **CHECK** | 도메인 조건 (`IN`, 범위, 식 등). |

**참조 무결성 옵션(예시)**

- `ON DELETE CASCADE`: 부모 행 삭제 시 자식 행도 삭제(또는 연쇄 처리).
- `ON DELETE SET NULL`: 부모 삭제 시 자식 FK를 NULL로.
- `ON UPDATE ...`: 부모 키 변경 시 자식 쪽 갱신 규칙.

---

## 2. 문법

### 컬럼 수준

```sql
CREATE TABLE 주문 (
  주문번호 INT NOT NULL PRIMARY KEY,
  고객번호 INT NOT NULL REFERENCES 고객(고객번호),
  금액     INT CHECK (금액 >= 0)
);
```

### 테이블 수준 (복합 기본키, 복합 FK 등)

```sql
CREATE TABLE 수강 (
  학번   CHAR(10),
  과목코드 CHAR(8),
  점수   INT,
  PRIMARY KEY (학번, 과목코드),
  FOREIGN KEY (학번) REFERENCES 학생(학번),
  FOREIGN KEY (과목코드) REFERENCES 과목(과목코드)
);
```

### FOREIGN KEY + ON DELETE / ON UPDATE

```sql
CREATE TABLE 주문상세 (
  주문번호 INT,
  상품코드 CHAR(5),
  수량     INT,
  PRIMARY KEY (주문번호, 상품코드),
  FOREIGN KEY (주문번호) REFERENCES 주문(주문번호)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
```

---

## 3. 예시

```sql
CREATE TABLE 상품 (
  상품코드 CHAR(5) PRIMARY KEY,
  단가     INT NOT NULL CHECK (단가 > 0)
);

CREATE TABLE 재고 (
  창고코드 CHAR(3),
  상품코드 CHAR(5),
  수량     INT NOT NULL DEFAULT 0,
  PRIMARY KEY (창고코드, 상품코드),
  FOREIGN KEY (상품코드) REFERENCES 상품(상품코드)
    ON DELETE RESTRICT
);
```

---

## 4. 실행 결과(예시 해석)

| 상황 | 결과 |
|------|------|
| `상품`에 없는 `상품코드`를 `재고`에 INSERT | FK 위반 → **오류**, 삽입 실패. |
| `ON DELETE RESTRICT`인데 `상품` 행을 참조하는 `재고`가 있을 때 `상품` 삭제 시도 | **오류**, 삭제 실패. |
| `CHECK (단가 > 0)`인데 `단가 = 0` INSERT | **오류**. |

---

## 5. 실기 팁

- 제약은 **이름을 붙이는 문법**(`CONSTRAINT 이름 ...`)이 나오면 문제지의 표기를 그대로 따라 쓰기.
- ERD에서 1:N 관계면 FK는 보통 **N측**에 둡니다.

이전: `01_Table_Management.md` / 다음: `02_DML/01_Select_Basics.md`
