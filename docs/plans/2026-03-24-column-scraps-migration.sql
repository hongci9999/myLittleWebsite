-- 칼럼 스크랩 (블로그·기사·README·유튜브 등) — 카드 목록 + 상세 노트
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS column_scraps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK (
    source_kind IN ('blog', 'article', 'readme', 'youtube', 'x', 'other')
  ),
  summary TEXT,
  body_md TEXT,
  cover_image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  extra_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS column_scraps_source_kind_idx ON column_scraps (source_kind);
CREATE INDEX IF NOT EXISTS column_scraps_tags_gin ON column_scraps USING GIN (tags);
CREATE INDEX IF NOT EXISTS column_scraps_updated_idx ON column_scraps (updated_at DESC);

ALTER TABLE column_scraps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "column_scraps_select_public"
  ON column_scraps FOR SELECT
  USING (true);

CREATE POLICY "column_scraps_insert_auth"
  ON column_scraps FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "column_scraps_update_auth"
  ON column_scraps FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "column_scraps_delete_auth"
  ON column_scraps FOR DELETE
  TO authenticated
  USING (true);
