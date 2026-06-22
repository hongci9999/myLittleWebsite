-- game_dev_resources에 표지 이미지 URL 컬럼 추가 (기존 DB용)
-- 테이블·RLS는 이미 만들어 둔 경우 이 파일만 실행하면 됩니다.

ALTER TABLE game_dev_resources
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
