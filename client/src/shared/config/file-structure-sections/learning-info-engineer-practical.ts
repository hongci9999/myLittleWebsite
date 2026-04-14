/**
 * 정보처리기사 실기 학습 섹션 (자동 생성)
 * scripts/build-learning-config.mjs → public/learnings/정보처리기사_실기 스캔
 * 수동 수정 시 다음 빌드에서 덮어쓰임
 */
import type { FileStructureSection } from '../file-structure'

const infoEngineerPracticalSection: FileStructureSection = {
  "sectionId": "info-engineer-practical",
  "sectionLabel": "정보처리기사 실기",
  "basePath": "/learnings/정보처리기사_실기",
  "nodes": [
    {
      "id": "00_안내",
      "name": "안내",
      "description": "실기 폴더 구조 안내",
      "docs": [
        {
          "slug": "이_폴더에_실기_노트를_추가하세요",
          "title": "이_폴더에_실기_노트를_추가하세요",
          "filePath": "00_안내/이_폴더에_실기_노트를_추가하세요.md"
        }
      ]
    },
    {
      "id": "10_체계형_학습자료",
      "name": "10_체계형_학습자료",
      "children": [
        {
          "id": "00_개요",
          "name": "개요",
          "docs": [
            {
              "slug": "01_학습자료_구성_가이드",
              "title": "01_학습자료_구성_가이드",
              "filePath": "10_체계형_학습자료/00_개요/01_학습자료_구성_가이드.md"
            }
          ]
        },
        {
          "id": "01_프로그래밍_및_알고리즘",
          "name": "프로그래밍_및_알고리즘",
          "docs": [
            {
              "slug": "01_C언어_기초와_입출력",
              "title": "01_C언어_기초와_입출력",
              "filePath": "10_체계형_학습자료/01_프로그래밍_및_알고리즘/01_C언어_기초와_입출력.md"
            },
            {
              "slug": "02_C언어_제어문과_연산자",
              "title": "02_C언어_제어문과_연산자",
              "filePath": "10_체계형_학습자료/01_프로그래밍_및_알고리즘/02_C언어_제어문과_연산자.md"
            },
            {
              "slug": "03_C언어_배열_포인터_구조체",
              "title": "03_C언어_배열_포인터_구조체",
              "filePath": "10_체계형_학습자료/01_프로그래밍_및_알고리즘/03_C언어_배열_포인터_구조체.md"
            },
            {
              "slug": "04_Java_객체지향_핵심",
              "title": "04_Java_객체지향_핵심",
              "filePath": "10_체계형_학습자료/01_프로그래밍_및_알고리즘/04_Java_객체지향_핵심.md"
            },
            {
              "slug": "05_Python_핵심문법과_객체지향",
              "title": "05_Python_핵심문법과_객체지향",
              "filePath": "10_체계형_학습자료/01_프로그래밍_및_알고리즘/05_Python_핵심문법과_객체지향.md"
            },
            {
              "slug": "06_알고리즘_기초와_시간복잡도",
              "title": "06_알고리즘_기초와_시간복잡도",
              "filePath": "10_체계형_학습자료/01_프로그래밍_및_알고리즘/06_알고리즘_기초와_시간복잡도.md"
            },
            {
              "slug": "07_정렬_알고리즘",
              "title": "07_정렬_알고리즘",
              "filePath": "10_체계형_학습자료/01_프로그래밍_및_알고리즘/07_정렬_알고리즘.md"
            },
            {
              "slug": "08_탐색과_구현형_문제",
              "title": "08_탐색과_구현형_문제",
              "filePath": "10_체계형_학습자료/01_프로그래밍_및_알고리즘/08_탐색과_구현형_문제.md"
            }
          ]
        },
        {
          "id": "02_데이터베이스",
          "name": "데이터베이스",
          "docs": [
            {
              "slug": "01_DB시스템과_관계형모델",
              "title": "01_DB시스템과_관계형모델",
              "filePath": "10_체계형_학습자료/02_데이터베이스/01_DB시스템과_관계형모델.md"
            },
            {
              "slug": "02_키_무결성_스키마",
              "title": "02_키_무결성_스키마",
              "filePath": "10_체계형_학습자료/02_데이터베이스/02_키_무결성_스키마.md"
            },
            {
              "slug": "03_SQL_DDL과_제약조건",
              "title": "03_SQL_DDL과_제약조건",
              "filePath": "10_체계형_학습자료/02_데이터베이스/03_SQL_DDL과_제약조건.md"
            },
            {
              "slug": "04_SQL_DML_조회와_집계",
              "title": "04_SQL_DML_조회와_집계",
              "filePath": "10_체계형_학습자료/02_데이터베이스/04_SQL_DML_조회와_집계.md"
            },
            {
              "slug": "05_SQL_조인_서브쿼리_윈도우함수",
              "title": "05_SQL_조인_서브쿼리_윈도우함수",
              "filePath": "10_체계형_학습자료/02_데이터베이스/05_SQL_조인_서브쿼리_윈도우함수.md"
            },
            {
              "slug": "06_정규화와_반정규화",
              "title": "06_정규화와_반정규화",
              "filePath": "10_체계형_학습자료/02_데이터베이스/06_정규화와_반정규화.md"
            },
            {
              "slug": "07_트랜잭션_병행제어_회복",
              "title": "07_트랜잭션_병행제어_회복",
              "filePath": "10_체계형_학습자료/02_데이터베이스/07_트랜잭션_병행제어_회복.md"
            },
            {
              "slug": "08_인덱스_뷰_절차형SQL",
              "title": "08_인덱스_뷰_절차형SQL",
              "filePath": "10_체계형_학습자료/02_데이터베이스/08_인덱스_뷰_절차형SQL.md"
            }
          ]
        },
        {
          "id": "03_인프라_및_네트워크",
          "name": "인프라_및_네트워크",
          "docs": [
            {
              "slug": "01_운영체제_기초와_프로세스",
              "title": "01_운영체제_기초와_프로세스",
              "filePath": "10_체계형_학습자료/03_인프라_및_네트워크/01_운영체제_기초와_프로세스.md"
            },
            {
              "slug": "02_CPU스케줄링과_메모리관리",
              "title": "02_CPU스케줄링과_메모리관리",
              "filePath": "10_체계형_학습자료/03_인프라_및_네트워크/02_CPU스케줄링과_메모리관리.md"
            },
            {
              "slug": "03_리눅스_명령어와_쉘스크립트",
              "title": "03_리눅스_명령어와_쉘스크립트",
              "filePath": "10_체계형_학습자료/03_인프라_및_네트워크/03_리눅스_명령어와_쉘스크립트.md"
            },
            {
              "slug": "04_OSI7계층과_TCPIP",
              "title": "04_OSI7계층과_TCPIP",
              "filePath": "10_체계형_학습자료/03_인프라_및_네트워크/04_OSI7계층과_TCPIP.md"
            },
            {
              "slug": "05_네트워크_프로토콜과_포트",
              "title": "05_네트워크_프로토콜과_포트",
              "filePath": "10_체계형_학습자료/03_인프라_및_네트워크/05_네트워크_프로토콜과_포트.md"
            },
            {
              "slug": "06_IP주소_서브네팅_라우팅",
              "title": "06_IP주소_서브네팅_라우팅",
              "filePath": "10_체계형_학습자료/03_인프라_및_네트워크/06_IP주소_서브네팅_라우팅.md"
            }
          ]
        },
        {
          "id": "04_소프트웨어공학_및_테스트",
          "name": "소프트웨어공학_및_테스트",
          "docs": [
            {
              "slug": "01_테스트_기본원칙과_프로세스",
              "title": "01_테스트_기본원칙과_프로세스",
              "filePath": "10_체계형_학습자료/04_소프트웨어공학_및_테스트/01_테스트_기본원칙과_프로세스.md"
            },
            {
              "slug": "02_화이트박스와_블랙박스_테스트",
              "title": "02_화이트박스와_블랙박스_테스트",
              "filePath": "10_체계형_학습자료/04_소프트웨어공학_및_테스트/02_화이트박스와_블랙박스_테스트.md"
            },
            {
              "slug": "03_테스트_오라클_검증_확인",
              "title": "03_테스트_오라클_검증_확인",
              "filePath": "10_체계형_학습자료/04_소프트웨어공학_및_테스트/03_테스트_오라클_검증_확인.md"
            },
            {
              "slug": "04_결함관리와_품질지표",
              "title": "04_결함관리와_품질지표",
              "filePath": "10_체계형_학습자료/04_소프트웨어공학_및_테스트/04_결함관리와_품질지표.md"
            },
            {
              "slug": "05_형상관리와_버전관리",
              "title": "05_형상관리와_버전관리",
              "filePath": "10_체계형_학습자료/04_소프트웨어공학_및_테스트/05_형상관리와_버전관리.md"
            },
            {
              "slug": "06_개발방법론과_보안기초",
              "title": "06_개발방법론과_보안기초",
              "filePath": "10_체계형_학습자료/04_소프트웨어공학_및_테스트/06_개발방법론과_보안기초.md"
            }
          ]
        },
        {
          "id": "05_용어사전",
          "name": "용어사전",
          "docs": [
            {
              "slug": "01_DB_SQL_핵심용어",
              "title": "01_DB_SQL_핵심용어",
              "filePath": "10_체계형_학습자료/05_용어사전/01_DB_SQL_핵심용어.md"
            },
            {
              "slug": "02_운영체제_네트워크_핵심용어",
              "title": "02_운영체제_네트워크_핵심용어",
              "filePath": "10_체계형_학습자료/05_용어사전/02_운영체제_네트워크_핵심용어.md"
            },
            {
              "slug": "03_소프트웨어공학_보안_핵심용어",
              "title": "03_소프트웨어공학_보안_핵심용어",
              "filePath": "10_체계형_학습자료/05_용어사전/03_소프트웨어공학_보안_핵심용어.md"
            },
            {
              "slug": "04_영문약어_빈출정리",
              "title": "04_영문약어_빈출정리",
              "filePath": "10_체계형_학습자료/05_용어사전/04_영문약어_빈출정리.md"
            }
          ]
        },
        {
          "id": "06_SQL_프로그래밍_재정리",
          "name": "SQL_프로그래밍_재정리",
          "docs": [
            {
              "slug": "01_DDL_핵심문장과_제약조건",
              "title": "01_DDL_핵심문장과_제약조건",
              "filePath": "10_체계형_학습자료/06_SQL_프로그래밍_재정리/01_DDL_핵심문장과_제약조건.md"
            },
            {
              "slug": "02_DML_조회절_작성순서",
              "title": "02_DML_조회절_작성순서",
              "filePath": "10_체계형_학습자료/06_SQL_프로그래밍_재정리/02_DML_조회절_작성순서.md"
            },
            {
              "slug": "03_JOIN_서브쿼리_함정정리",
              "title": "03_JOIN_서브쿼리_함정정리",
              "filePath": "10_체계형_학습자료/06_SQL_프로그래밍_재정리/03_JOIN_서브쿼리_함정정리.md"
            },
            {
              "slug": "04_함수_뷰_트랜잭션_체크포인트",
              "title": "04_함수_뷰_트랜잭션_체크포인트",
              "filePath": "10_체계형_학습자료/06_SQL_프로그래밍_재정리/04_함수_뷰_트랜잭션_체크포인트.md"
            }
          ]
        }
      ],
      "docs": [
        {
          "slug": "README",
          "title": "README",
          "filePath": "10_체계형_학습자료/README.md"
        }
      ]
    },
    {
      "id": "SQL_프로그래밍",
      "name": "SQL 프로그래밍",
      "description": "실기 SQL·DDL/DML/DCL·연습",
      "children": [
        {
          "id": "01_DDL",
          "name": "DDL",
          "docs": [
            {
              "slug": "01_Table_Management",
              "title": "01_Table_Management",
              "filePath": "SQL_프로그래밍/01_DDL/01_Table_Management.md"
            },
            {
              "slug": "02_Constraints",
              "title": "02_Constraints",
              "filePath": "SQL_프로그래밍/01_DDL/02_Constraints.md"
            }
          ]
        },
        {
          "id": "02_DML",
          "name": "DML",
          "docs": [
            {
              "slug": "01_Select_Basics",
              "title": "01_Select_Basics",
              "filePath": "SQL_프로그래밍/02_DML/01_Select_Basics.md"
            },
            {
              "slug": "02_Functions_and_GroupBy",
              "title": "02_Functions_and_GroupBy",
              "filePath": "SQL_프로그래밍/02_DML/02_Functions_and_GroupBy.md"
            },
            {
              "slug": "03_Join_and_Subquery",
              "title": "03_Join_and_Subquery",
              "filePath": "SQL_프로그래밍/02_DML/03_Join_and_Subquery.md"
            }
          ]
        },
        {
          "id": "03_DCL_및_트랜잭션",
          "name": "DCL_및_트랜잭션",
          "docs": [
            {
              "slug": "01_Transaction_and_Auth",
              "title": "01_Transaction_and_Auth",
              "filePath": "SQL_프로그래밍/03_DCL_및_트랜잭션/01_Transaction_and_Auth.md"
            }
          ]
        },
        {
          "id": "04_기타",
          "name": "기타",
          "docs": [
            {
              "slug": "01_Builtin_Functions_and_View",
              "title": "01_Builtin_Functions_and_View",
              "filePath": "SQL_프로그래밍/04_기타/01_Builtin_Functions_and_View.md"
            },
            {
              "slug": "02_DBMS_및_실기_문법_참고",
              "title": "02_DBMS_및_실기_문법_참고",
              "filePath": "SQL_프로그래밍/04_기타/02_DBMS_및_실기_문법_참고.md"
            }
          ]
        },
        {
          "id": "99_Practice_Problems",
          "name": "Practice_Problems",
          "docs": [
            {
              "slug": "01_Join_서브쿼리_통합예제",
              "title": "01_Join_서브쿼리_통합예제",
              "filePath": "SQL_프로그래밍/99_Practice_Problems/01_Join_서브쿼리_통합예제.md"
            },
            {
              "slug": "2024_Past_Exam_SQL",
              "title": "2024_Past_Exam_SQL",
              "filePath": "SQL_프로그래밍/99_Practice_Problems/2024_Past_Exam_SQL.md"
            },
            {
              "slug": "My_Wrong_Answers",
              "title": "My_Wrong_Answers",
              "filePath": "SQL_프로그래밍/99_Practice_Problems/My_Wrong_Answers.md"
            }
          ]
        }
      ]
    },
    {
      "id": "Templates",
      "name": "템플릿",
      "description": "Obsidian·노트용 SQL 템플릿",
      "docs": [
        {
          "slug": "SQL_Note_Template",
          "title": "SQL_Note_Template",
          "filePath": "Templates/SQL_Note_Template.md"
        }
      ]
    }
  ]
}

export { infoEngineerPracticalSection }
