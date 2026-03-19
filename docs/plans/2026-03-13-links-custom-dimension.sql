-- AI가 제안하는 새 태그용 custom dimension
-- Supabase SQL Editor에서 실행

INSERT INTO classification_dimensions (slug, label, allow_hierarchy, sort_order)
VALUES ('custom', '태그', false, 99)
ON CONFLICT (slug) DO NOTHING;
