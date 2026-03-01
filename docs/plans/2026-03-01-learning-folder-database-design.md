# 학습 폴더 데이터베이스 설계

날짜: 2026-03-01

정처기 학습 폴더 구조(5개 주제 + 노트)를 데이터베이스에 저장하는 설계.

---

## 1. 목표

- **현재**: `learning-info-engineer.ts` config에 하드코딩된 구조
- **목표**: Supabase(PostgreSQL)에 저장, 서버 API로 조회
- **범위**: 정보처리기사 5개 주제(01~05) + 99_노트, 각 주제별 문서 목록

---

## 2. 데이터 구조 (현재 config 기준)

```
학습자료 (parent)
└── 정보처리기사 (section: info-engineer)
    ├── 01_소프트웨어설계 (node) — docs: sdlc, uml, ...
    ├── 02_소프트웨어개발 (node) — docs: ...
    ├── 03_데이터베이스구축 (node)
    ├── 04_프로그래밍언어활용 (node)
    ├── 05_정보시스템구축관리 (node)
    └── 99_노트 (node) — children: 1장, 2장, ...
```

---

## 3. 테이블 설계

### 3.1 learning_sections (섹션)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 자동 생성 |
| section_id | text (unique) | 예: info-engineer |
| label | text | 표시명: 정보처리기사 |
| base_path | text | md fetch 경로: /learnings/정처기 |
| sort_order | int | 정렬 순서 |

### 3.2 learning_nodes (주제/폴더)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 자동 생성 |
| section_id | uuid (FK) | learning_sections.id |
| parent_id | uuid (FK, nullable) | 부모 노드 (99_노트 > 1장 등) |
| node_id | text | 예: 01_소프트웨어설계 |
| name | text | 표시명: 소프트웨어 설계 |
| description | text (nullable) | 부가 설명 |
| sort_order | int | 정렬 순서 |

### 3.3 learning_docs (문서)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 자동 생성 |
| node_id | uuid (FK) | learning_nodes.id |
| slug | text | URL용: sdlc |
| title | text | 표시명 |
| file_path | text | public 기준 경로: 01_소프트웨어설계/sdlc.md |
| sort_order | int | 정렬 순서 |

---

## 4. API 설계

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/learning/sections | 섹션 목록 (정보처리기사 등) |
| GET | /api/learning/sections/:sectionId | 섹션 상세 + 최상위 노드 목록 |
| GET | /api/learning/sections/:sectionId/nodes/:nodeId | 노드 상세 (children 또는 docs) |

응답 형식은 기존 `FileStructureSection`, `FileStructureNode`, `FileStructureDoc` 타입과 호환되도록 한다.

---

## 5. 마이그레이션 전략

1. **Phase 1**: DB 테이블 생성, 시드 데이터 삽입 (정처기 5개 주제 + 99_노트)
2. **Phase 2**: 서버 API 구현, 클라이언트에서 API 호출로 전환
3. **Phase 3**: config 제거, DB만 사용 (선택)

초기에는 config와 DB 병행 가능. API 실패 시 config fallback 등으로 점진 전환.

---

## 6. 참고

- 학습 자료: `learnings/0015-backend-database-basics.md`
- 기존 타입: `client/src/shared/config/file-structure.ts`
- 기존 config: `client/src/shared/config/file-structure-sections/learning-info-engineer.ts`
