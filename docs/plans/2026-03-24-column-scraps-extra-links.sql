-- 칼럼 스크랩에 추가 링크(JSON 배열) — 이미 테이블을 만든 경우에만 실행
-- Supabase SQL Editor

ALTER TABLE column_scraps
  ADD COLUMN IF NOT EXISTS extra_links JSONB NOT NULL DEFAULT '[]'::jsonb;
