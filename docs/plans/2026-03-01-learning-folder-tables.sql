-- 학습 폴더 테이블 생성
-- Supabase 대시보드 → SQL Editor에서 실행
-- 실행 후 2026-03-01-learning-folder-seed.sql 실행

-- 1. 섹션 테이블
CREATE TABLE IF NOT EXISTS learning_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  base_path TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 노드 테이블 (주제/폴더)
CREATE TABLE IF NOT EXISTS learning_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES learning_sections(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES learning_nodes(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(section_id, parent_id, node_id)
);

-- 3. 문서 테이블
CREATE TABLE IF NOT EXISTS learning_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES learning_nodes(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(node_id, slug)
);

-- 4. 인덱스 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_learning_nodes_section ON learning_nodes(section_id);
CREATE INDEX IF NOT EXISTS idx_learning_nodes_parent ON learning_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_learning_docs_node ON learning_docs(node_id);
