-- custom(태그) 축에 있는 태그를 종류(medium)로 이동
-- Supabase SQL Editor에서 실행

-- 0. 현재 custom 축 태그 확인 (실행 전 참고)
-- SELECT id, slug, label FROM classification_values
-- WHERE dimension_id = (SELECT id FROM classification_dimensions WHERE slug = 'custom' LIMIT 1);

-- 1. custom 축의 모든 태그를 종류(medium)로 이동
UPDATE classification_values cv
SET dimension_id = (SELECT id FROM classification_dimensions WHERE slug = 'medium' LIMIT 1),
    parent_id = NULL,
    sort_order = 999
WHERE cv.dimension_id = (SELECT id FROM classification_dimensions WHERE slug = 'custom' LIMIT 1);

