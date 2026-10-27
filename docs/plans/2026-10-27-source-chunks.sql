-- 원문 조각 벡터 검색 (ADR 0033). Supabase SQL Editor에서 실행.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS source_chunks (
  url        text    NOT NULL,
  chunk_idx  int     NOT NULL,
  text       text    NOT NULL,
  embedding  vector(768) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (url, chunk_idx)
);

CREATE INDEX IF NOT EXISTS source_chunks_embedding_idx
  ON source_chunks USING hnsw (embedding vector_cosine_ops);

ALTER TABLE source_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "source_chunks_select_public" ON source_chunks;
DROP POLICY IF EXISTS "source_chunks_write_auth" ON source_chunks;

CREATE POLICY "source_chunks_select_public"
  ON source_chunks FOR SELECT USING (true);
CREATE POLICY "source_chunks_write_auth"
  ON source_chunks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 코사인 유사도 top-k
CREATE OR REPLACE FUNCTION match_source_chunks(query_embedding vector(768), match_count int DEFAULT 8)
RETURNS TABLE (url text, chunk_idx int, text text, similarity float)
LANGUAGE sql STABLE
AS $$
  SELECT c.url, c.chunk_idx, c.text, 1 - (c.embedding <=> query_embedding) AS similarity
  FROM source_chunks c
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
