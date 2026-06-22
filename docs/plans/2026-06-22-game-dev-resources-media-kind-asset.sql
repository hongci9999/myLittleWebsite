-- game_dev_resources media_kind에 'asset' 추가 (기존 DB용)
-- Supabase SQL Editor에서 실행

ALTER TABLE game_dev_resources
  DROP CONSTRAINT IF EXISTS game_dev_resources_media_kind_check;

ALTER TABLE game_dev_resources
  ADD CONSTRAINT game_dev_resources_media_kind_check
  CHECK (
    media_kind IN ('youtube', 'article', 'repo', 'blog', 'doc', 'book', 'asset', 'other')
  );
