-- 즐겨찾기 링크 DB 전환: links 테이블에 메인 추천 컬럼 추가
-- Supabase SQL Editor에서 실행

ALTER TABLE links
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_sort_order INT DEFAULT 0;
