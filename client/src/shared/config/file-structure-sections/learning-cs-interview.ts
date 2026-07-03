/**
 * CS 면접대비 학습 섹션 (자동 생성)
 * scripts/build-learning-config.mjs → public/learnings/CS_면접대비 스캔
 * 수동 수정 시 다음 빌드에서 덮어쓰임
 */
import type { FileStructureSection } from '../file-structure'

const csInterviewSection: FileStructureSection = {
  "sectionId": "cs-interview",
  "sectionLabel": "CS 면접대비",
  "basePath": "/learnings/CS_면접대비",
  "nodes": [
    {
      "id": "00_개요",
      "name": "개요",
      "description": "학습 가이드·문서 형식",
      "docs": [
        {
          "slug": "01_학습_가이드",
          "title": "01_학습_가이드",
          "filePath": "00_개요/01_학습_가이드.md"
        }
      ]
    },
    {
      "id": "01_운영체제",
      "name": "운영체제",
      "description": "프로세스, 동기화, 메모리, 스케줄링",
      "docs": [
        {
          "slug": "01_면접_QA",
          "title": "01_면접_QA",
          "filePath": "01_운영체제/01_면접_QA.md"
        }
      ]
    },
    {
      "id": "02_컴퓨터네트워크",
      "name": "컴퓨터 네트워크",
      "description": "TCP/IP, HTTP, DNS, CORS, CAN",
      "docs": [
        {
          "slug": "01_면접_QA",
          "title": "01_면접_QA",
          "filePath": "02_컴퓨터네트워크/01_면접_QA.md"
        }
      ]
    },
    {
      "id": "03_자료구조_알고리즘",
      "name": "자료구조 및 알고리즘",
      "description": "DS, 정렬, 탐색, DP, 공간 인덱스",
      "docs": [
        {
          "slug": "01_면접_QA",
          "title": "01_면접_QA",
          "filePath": "03_자료구조_알고리즘/01_면접_QA.md"
        }
      ]
    },
    {
      "id": "04_데이터베이스",
      "name": "데이터베이스",
      "description": "트랜잭션, 인덱스, 정규화, 스케일링",
      "docs": [
        {
          "slug": "01_면접_QA",
          "title": "01_면접_QA",
          "filePath": "04_데이터베이스/01_면접_QA.md"
        }
      ]
    },
    {
      "id": "05_파이썬_타입스크립트",
      "name": "파이썬 & 타입스크립트",
      "description": "타입, 메모리, 비동기, 내부 동작",
      "docs": [
        {
          "slug": "01_면접_QA",
          "title": "01_면접_QA",
          "filePath": "05_파이썬_타입스크립트/01_면접_QA.md"
        }
      ]
    }
  ]
}

export { csInterviewSection }
