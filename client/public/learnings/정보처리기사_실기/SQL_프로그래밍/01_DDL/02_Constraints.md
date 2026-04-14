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
| **DEFAULT** | 삽입 시 값이 없으면 기본값 사용(제약이라기보다 컬럼 정의 옵션이지만 실기 지문에 자주 붙음). |

**CHECK와 NULL (실수 포인트)**

- `CHECK (단가 > 0)`만 있을 때 **`단가`에 NULL을 넣으면** 대부분 DB에서 **조건을 “통과”**로 본다(“알 수 없음”은 참도 거짓도 아님).
- “0도 안 되고 NULL도 안 된다”면 **`NOT NULL`**을 **같이** 걸어야 한다.

**참조 무결성 옵션(ON DELETE / ON UPDATE)**

| 키워드 | 느낌(문제 지문 기준) |
|--------|----------------------|
| **CASCADE** | 부모 변경·삭제가 자식 행까지 연쇄 반영. |
| **SET NULL** | 부모 삭제(또는 키 변경) 시 자식 FK를 NULL로(컬럼이 NULL 허용이어야 함). |
| **SET DEFAULT** | 부모 삭제 등 시 자식 FK를 **미리 정한 기본값**으로(지문에 `DEFAULT`·규칙이 같이 나올 때). |
| **RESTRICT** / **NO ACTION** | 참조하는 자식이 있으면 부모 삭제·키 변경을 **막음**. 제품마다 미세한 정의 차이가 있으나 **실기는 지문 표현을 그대로** 선택. |

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

### CONSTRAINT 이름 붙이기 (실기 빈칸·선택형)

문제에 `PK_주문`, `FK_주문_고객` 같은 이름이 주어지면 **표기 그대로** 붙인다.

```sql
CREATE TABLE 주문 (
  주문번호 INT NOT NULL,
  고객번호 INT NOT NULL,
  금액     INT NOT NULL,
  CONSTRAINT PK_주문 PRIMARY KEY (주문번호),
  CONSTRAINT FK_주문_고객 FOREIGN KEY (고객번호) REFERENCES 고객(고객번호),
  CONSTRAINT CK_주문_금액 CHECK (금액 >= 0)
);
```

### ALTER TABLE로 제약 추가·삭제 (기존 테이블 유형)

```sql
-- 이름 있는 제약 추가
ALTER TABLE 사원
  ADD CONSTRAINT FK_사원_부서
  FOREIGN KEY (부서코드) REFERENCES 부서(부서코드);

ALTER TABLE 사원
  ADD CONSTRAINT CK_사원_급여 CHECK (급여 >= 0);

-- 제약 삭제 (이름을 아는 경우)
ALTER TABLE 사원 DROP CONSTRAINT FK_사원_부서;
```

> `DROP CONSTRAINT` 문법·UNIQUE 제약 제거 시 `DROP INDEX`가 나오는지 등은 **DBMS·교재**마다 다를 수 있음 → `04_기타/02_DBMS_및_실기_문법_참고.md`와 **문제 지문** 우선.

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
| `단가`에 `NOT NULL` 없이 `CHECK (단가 > 0)`만 있을 때 `단가 = NULL` INSERT | 보통 **성공**(CHECK는 NULL을 막지 않음). “NULL 불가”면 `NOT NULL` 필요. |

---

## 5. 실기 팁

- 제약은 **이름을 붙이는 문법**(`CONSTRAINT 이름 ...`)이 나오면 문제지의 표기를 그대로 따라 쓰기.
- ERD에서 1:N 관계면 FK는 보통 **N측**에 둡니다.
- **이미 만든 테이블**에 FK·CHECK를 넣는 문장은 `ALTER TABLE … ADD CONSTRAINT` 패턴으로 출제되는 경우가 많다.
- `ON DELETE SET NULL`이 나오면 자식 FK 컬럼이 **NULL 허용**인지 지문·ERD와 맞는지 확인.

이전: `01_Table_Management.md` / 다음: `02_DML/01_Select_Basics.md` · 참고: `04_기타/02_DBMS_및_실기_문법_참고.md`
