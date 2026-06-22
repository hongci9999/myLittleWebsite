-- 게임 개발 도서관 (유튜브·기사·저장소·블로그 등 URL + 메모)
-- Supabase SQL Editor에서 실행 후 RLS 적용 확인

CREATE TABLE IF NOT EXISTS game_dev_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  media_kind TEXT NOT NULL CHECK (
    media_kind IN ('youtube', 'article', 'repo', 'blog', 'doc', 'book', 'asset', 'other')
  ),
  category TEXT NOT NULL DEFAULT 'graphics' CHECK (
    category IN ('graphics', 'physics', 'ai', 'gameplay', 'engine', 'network', 'sound', 'optimization', 'etc')
  ),
  summary TEXT,
  body_md TEXT,
  cover_image_url TEXT,
  extra_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS game_dev_resources_media_kind_idx ON game_dev_resources (media_kind);
CREATE INDEX IF NOT EXISTS game_dev_resources_category_idx ON game_dev_resources (category);
CREATE INDEX IF NOT EXISTS game_dev_resources_tags_gin ON game_dev_resources USING GIN (tags);
CREATE INDEX IF NOT EXISTS game_dev_resources_updated_idx ON game_dev_resources (updated_at DESC);

ALTER TABLE game_dev_resources ENABLE ROW LEVEL SECURITY;

-- 정책은 IF NOT EXISTS가 없어 재실행 시 DROP 후 생성
DROP POLICY IF EXISTS "game_dev_resources_select_public" ON game_dev_resources;
DROP POLICY IF EXISTS "game_dev_resources_insert_auth" ON game_dev_resources;
DROP POLICY IF EXISTS "game_dev_resources_update_auth" ON game_dev_resources;
DROP POLICY IF EXISTS "game_dev_resources_delete_auth" ON game_dev_resources;

CREATE POLICY "game_dev_resources_select_public"
  ON game_dev_resources FOR SELECT USING (true);
CREATE POLICY "game_dev_resources_insert_auth"
  ON game_dev_resources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "game_dev_resources_update_auth"
  ON game_dev_resources FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "game_dev_resources_delete_auth"
  ON game_dev_resources FOR DELETE TO authenticated USING (true);
