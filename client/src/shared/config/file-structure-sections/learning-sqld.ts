/**
 * SQLD 학습 섹션 (자동 생성)
 * scripts/build-learning-config.mjs → public/learnings/SQLD 스캔
 * 수동 수정 시 다음 빌드에서 덮어쓰임
 */
import type { FileStructureSection } from '../file-structure'

const sqldSection: FileStructureSection = {
  "sectionId": "sqld",
  "sectionLabel": "SQLD",
  "basePath": "/learnings/SQLD",
  "nodes": [
    {
      "id": "01_데이터_모델링의_이해",
      "name": "데이터 모델링의 이해",
      "description": "ERD, 정규화, 식별자 등 (1과목)",
      "docs": [
        {
          "slug": "01_모델링_개념과_단계",
          "title": "01_모델링_개념과_단계",
          "filePath": "01_데이터_모델링의_이해/01_모델링_개념과_단계.md"
        },
        {
          "slug": "02_ERD_표기와_작성순서_ANSI_SPARC",
          "title": "02_ERD_표기와_작성순서_ANSI_SPARC",
          "filePath": "01_데이터_모델링의_이해/02_ERD_표기와_작성순서_ANSI_SPARC.md"
        },
        {
          "slug": "03_엔터티_정의와_분류",
          "title": "03_엔터티_정의와_분류",
          "filePath": "01_데이터_모델링의_이해/03_엔터티_정의와_분류.md"
        },
        {
          "slug": "04_엔터티_분류_유무형과_발생시점",
          "title": "04_엔터티_분류_유무형과_발생시점",
          "filePath": "01_데이터_모델링의_이해/04_엔터티_분류_유무형과_발생시점.md"
        },
        {
          "slug": "05_속성_정의와_분류",
          "title": "05_속성_정의와_분류",
          "filePath": "01_데이터_모델링의_이해/05_속성_정의와_분류.md"
        },
        {
          "slug": "06_도메인과_관계",
          "title": "06_도메인과_관계",
          "filePath": "01_데이터_모델링의_이해/06_도메인과_관계.md"
        },
        {
          "slug": "07_교차_엔터티와_관계_체크사항",
          "title": "07_교차_엔터티와_관계_체크사항",
          "filePath": "01_데이터_모델링의_이해/07_교차_엔터티와_관계_체크사항.md"
        },
        {
          "slug": "08_식별자_정의와_분류",
          "title": "08_식별자_정의와_분류",
          "filePath": "01_데이터_모델링의_이해/08_식별자_정의와_분류.md"
        },
        {
          "slug": "09_식별_비식별_관계와_키",
          "title": "09_식별_비식별_관계와_키",
          "filePath": "01_데이터_모델링의_이해/09_식별_비식별_관계와_키.md"
        },
        {
          "slug": "10_정규화_이상현상과_함수적_종속",
          "title": "10_정규화_이상현상과_함수적_종속",
          "filePath": "01_데이터_모델링의_이해/10_정규화_이상현상과_함수적_종속.md"
        },
        {
          "slug": "11_정규화_단계_1NF부터_5NF",
          "title": "11_정규화_단계_1NF부터_5NF",
          "filePath": "01_데이터_모델링의_이해/11_정규화_단계_1NF부터_5NF.md"
        },
        {
          "slug": "12_관계와_조인_계층_상호배타",
          "title": "12_관계와_조인_계층_상호배타",
          "filePath": "01_데이터_모델링의_이해/12_관계와_조인_계층_상호배타.md"
        },
        {
          "slug": "13_트랜잭션과_NULL",
          "title": "13_트랜잭션과_NULL",
          "filePath": "01_데이터_모델링의_이해/13_트랜잭션과_NULL.md"
        },
        {
          "slug": "14_본질식별자와_인조식별자",
          "title": "14_본질식별자와_인조식별자",
          "filePath": "01_데이터_모델링의_이해/14_본질식별자와_인조식별자.md"
        }
      ]
    },
    {
      "id": "02_SQL_기본",
      "name": "SQL 기본",
      "description": "SELECT, JOIN, 함수 등 (2과목)",
      "docs": [
        {
          "slug": "01_RDBMS와_SQL_개요",
          "title": "01_RDBMS와_SQL_개요",
          "filePath": "02_SQL_기본/01_RDBMS와_SQL_개요.md"
        },
        {
          "slug": "02_관계대수_연산자",
          "title": "02_관계대수_연산자",
          "filePath": "02_SQL_기본/02_관계대수_연산자.md"
        },
        {
          "slug": "03_SELECT_문_구조와_실행순서",
          "title": "03_SELECT_문_구조와_실행순서",
          "filePath": "02_SQL_기본/03_SELECT_문_구조와_실행순서.md"
        },
        {
          "slug": "04_SELECT_기본_문법",
          "title": "04_SELECT_기본_문법",
          "filePath": "02_SQL_기본/04_SELECT_기본_문법.md"
        },
        {
          "slug": "05_SQL_함수_문자함수",
          "title": "05_SQL_함수_문자함수",
          "filePath": "02_SQL_기본/05_SQL_함수_문자함수.md"
        },
        {
          "slug": "06_WHERE_절과_비교연산자",
          "title": "06_WHERE_절과_비교연산자",
          "filePath": "02_SQL_기본/06_WHERE_절과_비교연산자.md"
        },
        {
          "slug": "07_GROUP_BY와_HAVING",
          "title": "07_GROUP_BY와_HAVING",
          "filePath": "02_SQL_기본/07_GROUP_BY와_HAVING.md"
        },
        {
          "slug": "08_ORDER_BY절",
          "title": "08_ORDER_BY절",
          "filePath": "02_SQL_기본/08_ORDER_BY절.md"
        },
        {
          "slug": "09_조인_개요",
          "title": "09_조인_개요",
          "filePath": "02_SQL_기본/09_조인_개요.md"
        },
        {
          "slug": "10_INNER_JOIN",
          "title": "10_INNER_JOIN",
          "filePath": "02_SQL_기본/10_INNER_JOIN.md"
        },
        {
          "slug": "11_NATURAL_JOIN과_CROSS_JOIN",
          "title": "11_NATURAL_JOIN과_CROSS_JOIN",
          "filePath": "02_SQL_기본/11_NATURAL_JOIN과_CROSS_JOIN.md"
        },
        {
          "slug": "README",
          "title": "README",
          "filePath": "02_SQL_기본/README.md"
        }
      ]
    },
    {
      "id": "03_SQL_활용",
      "name": "SQL 활용",
      "description": "서브쿼리, 윈도우, PIVOT 등 (2과목)",
      "docs": [
        {
          "slug": "01_서브쿼리",
          "title": "01_서브쿼리",
          "filePath": "03_SQL_활용/01_서브쿼리.md"
        },
        {
          "slug": "02_집합_연산자",
          "title": "02_집합_연산자",
          "filePath": "03_SQL_활용/02_집합_연산자.md"
        },
        {
          "slug": "03_ROLLUP과_CUBE",
          "title": "03_ROLLUP과_CUBE",
          "filePath": "03_SQL_활용/03_ROLLUP과_CUBE.md"
        },
        {
          "slug": "04_윈도우_함수",
          "title": "04_윈도우_함수",
          "filePath": "03_SQL_활용/04_윈도우_함수.md"
        },
        {
          "slug": "05_Top_N_쿼리",
          "title": "05_Top_N_쿼리",
          "filePath": "03_SQL_활용/05_Top_N_쿼리.md"
        },
        {
          "slug": "06_계층형_질의",
          "title": "06_계층형_질의",
          "filePath": "03_SQL_활용/06_계층형_질의.md"
        },
        {
          "slug": "07_PIVOT과_UNPIVOT",
          "title": "07_PIVOT과_UNPIVOT",
          "filePath": "03_SQL_활용/07_PIVOT과_UNPIVOT.md"
        },
        {
          "slug": "08_정규표현식",
          "title": "08_정규표현식",
          "filePath": "03_SQL_활용/08_정규표현식.md"
        },
        {
          "slug": "README",
          "title": "README",
          "filePath": "03_SQL_활용/README.md"
        }
      ]
    },
    {
      "id": "04_SQL_관리_구문",
      "name": "SQL 관리 구문",
      "description": "DML, DDL, DCL, TCL (3과목)",
      "docs": [
        {
          "slug": "01_DML과_INSERT",
          "title": "01_DML과_INSERT",
          "filePath": "04_SQL_관리_구문/01_DML과_INSERT.md"
        },
        {
          "slug": "02_UPDATE와_DELETE",
          "title": "02_UPDATE와_DELETE",
          "filePath": "04_SQL_관리_구문/02_UPDATE와_DELETE.md"
        },
        {
          "slug": "03_MERGE",
          "title": "03_MERGE",
          "filePath": "04_SQL_관리_구문/03_MERGE.md"
        },
        {
          "slug": "04_TCL과_트랜잭션",
          "title": "04_TCL과_트랜잭션",
          "filePath": "04_SQL_관리_구문/04_TCL과_트랜잭션.md"
        },
        {
          "slug": "05_DDL과_CREATE",
          "title": "05_DDL과_CREATE",
          "filePath": "04_SQL_관리_구문/05_DDL과_CREATE.md"
        },
        {
          "slug": "06_ALTER_DROP과_TRUNCATE",
          "title": "06_ALTER_DROP과_TRUNCATE",
          "filePath": "04_SQL_관리_구문/06_ALTER_DROP과_TRUNCATE.md"
        },
        {
          "slug": "07_DCL과_권한",
          "title": "07_DCL과_권한",
          "filePath": "04_SQL_관리_구문/07_DCL과_권한.md"
        },
        {
          "slug": "README",
          "title": "README",
          "filePath": "04_SQL_관리_구문/README.md"
        }
      ]
    }
  ]
}

export { sqldSection }
