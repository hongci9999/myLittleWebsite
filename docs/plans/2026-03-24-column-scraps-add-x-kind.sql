-- 기존 column_scraps 테이블에 X(트위터) 형식 추가 (이미 마이그레이션을 실행한 경우)
-- Supabase SQL Editor에서 실행

ALTER TABLE column_scraps
  DROP CONSTRAINT IF EXISTS column_scraps_source_kind_check;

ALTER TABLE column_scraps
  ADD CONSTRAINT column_scraps_source_kind_check
  CHECK (
    source_kind IN ('blog', 'article', 'readme', 'youtube', 'x', 'other')
  );
