-- 유용한 링크 페이지 DB 스키마 및 시드
-- Supabase SQL Editor에서 실행

-- classification_dimensions (분류 축)
CREATE TABLE IF NOT EXISTS classification_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  allow_hierarchy BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0
);

-- classification_values (분류 값, 계층 지원)
CREATE TABLE IF NOT EXISTS classification_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id UUID NOT NULL REFERENCES classification_dimensions(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES classification_values(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  UNIQUE(dimension_id, slug)
);

-- links (링크)
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- link_value_relations (링크 ↔ 분류 값)
CREATE TABLE IF NOT EXISTS link_value_relations (
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  value_id UUID NOT NULL REFERENCES classification_values(id) ON DELETE CASCADE,
  PRIMARY KEY (link_id, value_id)
);

-- 시드: 분류 축 (목적, 종류)
INSERT INTO classification_dimensions (slug, label, allow_hierarchy, sort_order)
VALUES ('purpose', '목적', true, 1), ('medium', '종류', false, 2)
ON CONFLICT (slug) DO NOTHING;

-- 시드: 목적(purpose) 값 - 계층
-- 1단계: 상위 (디자인, 개발)
INSERT INTO classification_values (dimension_id, parent_id, slug, label, sort_order)
SELECT d.id, NULL, v.slug, v.label, v.ord
FROM classification_dimensions d,
  (VALUES ('design', '디자인', 1), ('dev', '개발', 2)) AS v(slug, label, ord)
WHERE d.slug = 'purpose'
ON CONFLICT (dimension_id, slug) DO NOTHING;

-- 2단계: 디자인 하위 (이미지 생성, 3D 모델, 비디오)
INSERT INTO classification_values (dimension_id, parent_id, slug, label, sort_order)
SELECT d.id, p.id, v.slug, v.label, v.ord
FROM classification_dimensions d
JOIN classification_values p ON p.dimension_id = d.id AND p.slug = 'design' AND p.parent_id IS NULL
CROSS JOIN (VALUES ('image-gen', '이미지 생성', 1), ('3d-model', '3D 모델 생성', 2), ('video-gen', '비디오 생성', 3)) AS v(slug, label, ord)
WHERE d.slug = 'purpose'
ON CONFLICT (dimension_id, slug) DO NOTHING;

-- 2단계: 개발 하위 (프론트엔드, 백엔드, LLM)
INSERT INTO classification_values (dimension_id, parent_id, slug, label, sort_order)
SELECT d.id, p.id, v.slug, v.label, v.ord
FROM classification_dimensions d
JOIN classification_values p ON p.dimension_id = d.id AND p.slug = 'dev' AND p.parent_id IS NULL
CROSS JOIN (VALUES ('frontend', '프론트엔드', 1), ('backend', '백엔드', 2), ('llm', 'LLM', 3)) AS v(slug, label, ord)
WHERE d.slug = 'purpose'
ON CONFLICT (dimension_id, slug) DO NOTHING;

-- 시드: 종류(medium) 값 - 평면
INSERT INTO classification_values (dimension_id, parent_id, slug, label, sort_order)
SELECT d.id, NULL, v.slug, v.label, v.ord
FROM classification_dimensions d,
  (VALUES ('web', '웹 서비스', 1), ('api', 'API', 2), ('desktop', '데스크탑 앱', 3), ('cli', 'CLI', 4), ('extension', '브라우저 확장', 5)) AS v(slug, label, ord)
WHERE d.slug = 'medium'
ON CONFLICT (dimension_id, slug) DO NOTHING;
