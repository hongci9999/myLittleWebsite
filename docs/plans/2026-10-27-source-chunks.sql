-- 원문·정리 본문 조각 벡터 검색 (ADR 0033). Supabase SQL Editor에서 한 번 실행.

-- 1) scrap_sources: cron이 자막 대신 저장하는 Gemini 영상 요약('digest') 허용
--    로컬 백필은 digest를 진짜 자막으로 교체한다.
ALTER TABLE scrap_sources DROP CONSTRAINT IF EXISTS scrap_sources_kind_check;
ALTER TABLE scrap_sources ADD CONSTRAINT scrap_sources_kind_check
  CHECK (kind IN ('transcript', 'readme', 'page', 'digest'));

-- 2) 조각 테이블
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS source_chunks (
  origin     text NOT NULL CHECK (origin IN ('source', 'body')), -- source = 원문(scrap_sources·부트캠프 기록), body = 사이트 정리 본문(bodyMd)
  ref        text NOT NULL,                                      -- source: 원문 url 또는 /bootcamp/<slug>, body: 스크랩 id
  chunk_idx  int  NOT NULL,
  text       text NOT NULL,
  embedding  vector(768) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (origin, ref, chunk_idx)
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

-- 3) 코사인 유사도 top-k
CREATE OR REPLACE FUNCTION match_source_chunks(query_embedding vector(768), match_count int DEFAULT 8)
RETURNS TABLE (origin text, ref text, chunk_idx int, text text, similarity float)
LANGUAGE sql STABLE
AS $$
  SELECT c.origin, c.ref, c.chunk_idx, c.text, 1 - (c.embedding <=> query_embedding) AS similarity
  FROM source_chunks c
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
