-- 링크 파비콘 URL 저장 (페이지 저장 시 서버가 HTML에서 추출)
-- Supabase SQL Editor에서 실행

ALTER TABLE links
  ADD COLUMN IF NOT EXISTS favicon_url TEXT;

COMMENT ON COLUMN links.favicon_url IS '사이트 파비콘 절대 URL (저장 시 fetch-website에서 추출)';
