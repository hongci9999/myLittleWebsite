날짜: 2026-04-13
태그: [강의정리, 정보처리기사, 실기, SQL, DCL, 트랜잭션]
주제: GRANT·REVOKE, COMMIT·ROLLBACK, CASCADE/RESTRICT 맥락
---

# [DCL] 권한 부여·회수 및 트랜잭션 제어

실기에서는 **권한 문장 완성**, **트랜잭션 후 데이터 상태**를 묻는 문제가 나올 수 있습니다. (출제 DBMS·교재에 따라 문법 디테일이 다를 수 있어, **문제에 제시된 키워드**를 우선합니다.)

---

## 1. 개념

### DCL (Data Control Language)

- **GRANT**: 사용자/역할에 객체에 대한 권한 부여.
- **REVOKE**: 부여했던 권한 회수.
- **CASCADE / RESTRICT**: REVOKE(또는 DROP) 시 **파생 권한**을 어떻게 할지에 대한 옵션으로 자주 등장.
- **PUBLIC**: “모든 사용자”에게 주는 식으로 지문에 나올 수 있음 → `TO PUBLIC` / `FROM PUBLIC` (교재 표기 따름).

### 트랜잭션 제어 (TCL에 가깝지만 실기 목차에서는 DCL과 함께 묶어 학습)

- **COMMIT**: 트랜잭션에서 수행한 변경을 **확정**.
- **ROLLBACK**: 트랜잭션을 **취소**하고 이전 확정 상태로 되돌림(또는 세이브포인트까지).
- **SAVEPOINT**: 트랜잭션 안에서 **되돌림 지점**을 이름 붙여 둠. `ROLLBACK TO SAVEPOINT 이름`은 그 지점 **이후**만 취소(이전 `UPDATE` 등은 유지 — 지문·DBMS 정의 확인).

**실기 함정: DDL과 트랜잭션**

- 많은 환경에서 **DDL**(CREATE/ALTER/DROP 등) 실행 시 **암묵적 COMMIT**이 일어난다고 가정하는 문제가 나옵니다. “DDL 직후 ROLLBACK”이 **이미 확정된 DDL**을 되돌리지 못하는 유형에 주의.

---

## 2. 문법 (일반적인 형태)

### GRANT / REVOKE

```sql
GRANT SELECT, INSERT ON 테이블명 TO 사용자명;

REVOKE INSERT ON 테이블명 FROM 사용자명;
```

- 객체가 스키마를 포함하면 `스키마.테이블` 형태로 제시되기도 함.
- `WITH GRANT OPTION`: 부여받은 사용자가 **다른 사용자에게 재부여**할 수 있게 함(문제에서 자주 언급).
- `GRANT ALL PRIVILEGES ON ...` / 여러 권한 나열은 **지문에 나온 키워드** 그대로.
- 일부 DBMS·기출: `UPDATE (컬럼목록)` 처럼 **열 단위 권한**이 나올 수 있음.

```sql
REVOKE INSERT ON 테이블명 FROM 사용자명 CASCADE;
REVOKE INSERT ON 테이블명 FROM 사용자명 RESTRICT;
```

- **CASCADE**: 재부여까지 포함해 **연쇄 회수**로 읽는 문제가 많음.
- **RESTRICT**(또는 동일 취지 키워드): 파생 권한이 있으면 **회수 실패·오류** 유형.

### COMMIT / ROLLBACK

```sql
COMMIT;
ROLLBACK;
-- 또는
ROLLBACK TO SAVEPOINT 이름;
```

```sql
SAVEPOINT sp1;
-- DML ...
ROLLBACK TO SAVEPOINT sp1;
-- sp1 이후만 취소, sp1 이전 변경은 트랜잭션 내에서 유지(일반적 이해)
```

---

## 3. 예시

```sql
-- 읽기만 허용
GRANT SELECT ON 사원 TO 인사팀;

-- 삽입까지 허용 + 다른 사람에게 넘길 수 있음(문제 조건에 따라)
GRANT INSERT ON 사원 TO 팀장 WITH GRANT OPTION;

-- 회수
REVOKE INSERT ON 사원 FROM 팀장 CASCADE;
```

**트랜잭션 흐름(개념)**

```sql
BEGIN;          -- 또는 자동 트랜잭션 시작(DB마다 다름)
UPDATE 사원 SET 급여 = 급여 + 10 WHERE 부서코드 = '10';
-- 아직 COMMIT 전이면 다른 세션에서 보이는 값은 격리 수준에 따름
ROLLBACK;       -- UPDATE 무효

UPDATE 사원 SET 급여 = 급여 + 10 WHERE 부서코드 = '10';
COMMIT;         -- 확정
```

**SAVEPOINT 예시(손풀이용)**

```sql
BEGIN;
UPDATE 사원 SET 급여 = 100 WHERE 사원번호 = 1;  -- 가정: 성공
SAVEPOINT after_first;
UPDATE 사원 SET 급여 = 200 WHERE 사원번호 = 2;
ROLLBACK TO SAVEPOINT after_first;
-- 사원 1 급여 100은 유지, 사원 2 변경은 취소(일반적 모델)
COMMIT;
```

---

## 4. 실행 결과(예시 해석)

| 상황 | 해석 |
|------|------|
| `UPDATE` 후 `ROLLBACK` | 해당 세션의 변경은 **폐기**. 확정된 이전 데이터 유지. |
| `UPDATE` 후 `COMMIT` | 변경 **확정**. 이후 ROLLBACK으로 취소 불가(일반 모델). |
| `SAVEPOINT` 후 일부만 `ROLLBACK TO SAVEPOINT` | **세이브포인트 이후** 작업만 취소. 그 전 DML은 같은 트랜잭션 안에 남음(최종은 `COMMIT`/`ROLLBACK`으로 마무리). |
| DDL 직후 `ROLLBACK` (암묵적 COMMIT 전제 문제) | 이미 **확정된 DDL**은 되돌리지 못한다고 보는 유형이 많음. |
| `REVOKE ... CASCADE` | 그 권한으로부터 파생된 권한까지 **연쇄 회수**로 이해하는 문제가 많음. |
| `REVOKE ... RESTRICT` | 파생 권한이 있으면 **회수 거부(오류)** 로 나오는 유형. |

---

## 5. 실기 체크

- [ ] `GRANT` 뒤에 오는 권한 목록·객체·대상 사용자 순서 맞추기.
- [ ] `WITH GRANT OPTION` 유무가 **REVOKE 파급**과 연결되는지 문장으로 읽기.
- [ ] 트랜잭션 문제는 **타임라인(실행 순서)** 을 표로 그린 뒤 최종 테이블 상태 적기.
- [ ] `TO PUBLIC`, `ALL PRIVILEGES`, **열 단위 GRANT**가 나오면 지문 표기 그대로 옮기기.
- [ ] 문법·키워드가 Oracle/MySQL/ANSI 중 무엇에 가깝는지 애매하면 `../04_기타/02_DBMS_및_실기_문법_참고.md` + **교재·기출** 우선.

이전: `../02_DML/03_Join_and_Subquery.md` · 다음: `../04_기타/01_Builtin_Functions_and_View.md`
