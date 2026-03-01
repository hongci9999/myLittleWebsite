-- 학습 폴더 시드 데이터 (정처기 5개 주제 + 99_노트)
-- 실행 순서: 1) 테이블 생성 SQL 실행 2) 이 파일 실행

-- 1. 섹션 삽입
INSERT INTO learning_sections (section_id, label, base_path, sort_order)
VALUES ('info-engineer', '정보처리기사', '/learnings/정처기', 0)
ON CONFLICT (section_id) DO NOTHING;

-- 2. 노드 삽입 (섹션 id를 서브쿼리로 조회)
INSERT INTO learning_nodes (section_id, parent_id, node_id, name, description, sort_order)
SELECT id, NULL, '01_소프트웨어설계', '소프트웨어 설계', 'SDLC, UML, 요구공학 등', 1 FROM learning_sections WHERE section_id = 'info-engineer' LIMIT 1
UNION ALL SELECT id, NULL, '02_소프트웨어개발', '소프트웨어 개발', '자료구조, 알고리즘, 테스트 등', 2 FROM learning_sections WHERE section_id = 'info-engineer' LIMIT 1
UNION ALL SELECT id, NULL, '03_데이터베이스구축', '데이터베이스 구축', 'ERD, SQL, 정규화 등', 3 FROM learning_sections WHERE section_id = 'info-engineer' LIMIT 1
UNION ALL SELECT id, NULL, '04_프로그래밍언어활용', '프로그래밍 언어 활용', 'C, Python, 객체지향 등', 4 FROM learning_sections WHERE section_id = 'info-engineer' LIMIT 1
UNION ALL SELECT id, NULL, '05_정보시스템구축관리', '정보시스템 구축관리', '통신, 보안, 프로토콜 등', 5 FROM learning_sections WHERE section_id = 'info-engineer' LIMIT 1
UNION ALL SELECT id, NULL, '99_노트', '노트', '기출·복습 노트', 6 FROM learning_sections WHERE section_id = 'info-engineer' LIMIT 1;

-- 3. 문서 삽입 (노드 id를 서브쿼리로 조회)
-- 01_소프트웨어설계
INSERT INTO learning_docs (node_id, slug, title, file_path, sort_order)
SELECT n.id, 'sdlc', '소프트웨어 개발 생명주기(SDLC) 및 방법론', '01_소프트웨어설계/01_소프트웨어 개발 생명주기(SDLC) 및 방법론.md', 1
FROM learning_nodes n JOIN learning_sections s ON n.section_id = s.id WHERE s.section_id = 'info-engineer' AND n.node_id = '01_소프트웨어설계';
INSERT INTO learning_docs (node_id, slug, title, file_path, sort_order)
SELECT n.id, 'uml', 'UML', '01_소프트웨어설계/05_UML.md', 2
FROM learning_nodes n JOIN learning_sections s ON n.section_id = s.id WHERE s.section_id = 'info-engineer' AND n.node_id = '01_소프트웨어설계';
INSERT INTO learning_docs (node_id, slug, title, file_path, sort_order)
SELECT n.id, 'req-eng', '요구공학', '01_소프트웨어설계/04_요구공학 (Requirements Engineering).md', 3
FROM learning_nodes n JOIN learning_sections s ON n.section_id = s.id WHERE s.section_id = 'info-engineer' AND n.node_id = '01_소프트웨어설계';

-- 02_소프트웨어개발
INSERT INTO learning_docs (node_id, slug, title, file_path, sort_order)
SELECT n.id, 'data-structure', '자료구조 및 알고리즘', '02_소프트웨어개발/01(중요)_자료구조 및 알고리즘.md', 1
FROM learning_nodes n JOIN learning_sections s ON n.section_id = s.id WHERE s.section_id = 'info-engineer' AND n.node_id = '02_소프트웨어개발';
INSERT INTO learning_docs (node_id, slug, title, file_path, sort_order)
SELECT n.id, 'search', '탐색', '02_소프트웨어개발/02_탐색.md', 2
FROM learning_nodes n JOIN learning_sections s ON n.section_id = s.id WHERE s.section_id = 'info-engineer' AND n.node_id = '02_소프트웨어개발';
INSERT INTO learning_docs (node_id, slug, title, file_path, sort_order)
SELECT n.id, 'sort', '정렬 알고리즘', '02_소프트웨어개발/03_정렬 알고리즘.md', 3
FROM learning_nodes n JOIN learning_sections s ON n.section_id = s.id WHERE s.section_id = 'info-engineer' AND n.node_id = '02_소프트웨어개발';

-- 03_데이터베이스구축
INSERT INTO learning_docs (node_id, slug, title, file_path, sort_order)
SELECT n.id, 'db-system', '데이터베이스 시스템', '03_데이터베이스구축/01_데이터베이스 시스템.md', 1
FROM learning_nodes n JOIN learning_sections s ON n.section_id = s.id WHERE s.section_id = 'info-engineer' AND n.node_id = '03_데이터베이스구축';
INSERT INTO learning_docs (node_id, slug, title, file_path, sort_order)
SELECT n.id, 'sql', 'SQL', '03_데이터베이스구축/06_SQL.md', 2
FROM learning_nodes n JOIN learning_sections s ON n.section_id = s.id WHERE s.section_id = 'info-engineer' AND n.node_id = '03_데이터베이스구축';
INSERT INTO learning_docs (node_id, slug, title, file_path, sort_order)
SELECT n.id, 'normalization', '데이터베이스 정규화', '03_데이터베이스구축/04_데이터베이스 정규화.md', 3
FROM learning_nodes n JOIN learning_sections s ON n.section_id = s.id WHERE s.section_id = 'info-engineer' AND n.node_id = '03_데이터베이스구축';

-- 04_프로그래밍언어활용
INSERT INTO learning_docs (node_id, slug, title, file_path, sort_order)
SELECT n.id, 'c-lang', 'C언어', '04_프로그래밍언어활용/01_C언어.md', 1
FROM learning_nodes n JOIN learning_sections s ON n.section_id = s.id WHERE s.section_id = 'info-engineer' AND n.node_id = '04_프로그래밍언어활용';
INSERT INTO learning_docs (node_id, slug, title, file_path, sort_order)
SELECT n.id, 'python-oop', '파이썬 객체지향', '04_프로그래밍언어활용/06_파이썬 객체지향.md', 2
FROM learning_nodes n JOIN learning_sections s ON n.section_id = s.id WHERE s.section_id = 'info-engineer' AND n.node_id = '04_프로그래밍언어활용';
INSERT INTO learning_docs (node_id, slug, title, file_path, sort_order)
SELECT n.id, 'os', '운영체제', '04_프로그래밍언어활용/07_운영체제.md', 3
FROM learning_nodes n JOIN learning_sections s ON n.section_id = s.id WHERE s.section_id = 'info-engineer' AND n.node_id = '04_프로그래밍언어활용';

-- 05_정보시스템구축관리
INSERT INTO learning_docs (node_id, slug, title, file_path, sort_order)
SELECT n.id, 'communication', '통신 시스템 및 신호 변환', '05_정보시스템구축관리/01_통신 시스템 및 신호 변환.md', 1
FROM learning_nodes n JOIN learning_sections s ON n.section_id = s.id WHERE s.section_id = 'info-engineer' AND n.node_id = '05_정보시스템구축관리';
INSERT INTO learning_docs (node_id, slug, title, file_path, sort_order)
SELECT n.id, 'routing', '라우팅 프로토콜', '05_정보시스템구축관리/02_라우팅 프로토콜.md', 2
FROM learning_nodes n JOIN learning_sections s ON n.section_id = s.id WHERE s.section_id = 'info-engineer' AND n.node_id = '05_정보시스템구축관리';
INSERT INTO learning_docs (node_id, slug, title, file_path, sort_order)
SELECT n.id, 'security', '보안 설계 및 구현', '05_정보시스템구축관리/04_보안 설계 및 구현.md', 3
FROM learning_nodes n JOIN learning_sections s ON n.section_id = s.id WHERE s.section_id = 'info-engineer' AND n.node_id = '05_정보시스템구축관리';
