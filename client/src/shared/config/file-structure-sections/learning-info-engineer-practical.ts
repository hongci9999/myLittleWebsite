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
            }
          ]
        },
        {
          "id": "99_Practice_Problems",
          "name": "Practice_Problems",
          "docs": [
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
