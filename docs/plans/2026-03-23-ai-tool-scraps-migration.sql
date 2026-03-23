-- AI 개발 도구 스크랩북 (MCP·스킬·Rules·레포 등 URL + 긴 메모)
-- Supabase SQL Editor에서 실행 후 RLS가 적용되는지 확인

CREATE TABLE IF NOT EXISTS ai_tool_scraps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK (
    source_kind IN ('mcp', 'skill', 'rules', 'cli', 'doc', 'repo', 'other')
  ),
  summary TEXT,
  body_md TEXT,
  extra_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_tool_scraps_source_kind_idx ON ai_tool_scraps (source_kind);
CREATE INDEX IF NOT EXISTS ai_tool_scraps_tags_gin ON ai_tool_scraps USING GIN (tags);
CREATE INDEX IF NOT EXISTS ai_tool_scraps_updated_idx ON ai_tool_scraps (updated_at DESC);

ALTER TABLE ai_tool_scraps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_tool_scraps_select_public"
  ON ai_tool_scraps FOR SELECT
  USING (true);

CREATE POLICY "ai_tool_scraps_insert_auth"
  ON ai_tool_scraps FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "ai_tool_scraps_update_auth"
  ON ai_tool_scraps FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "ai_tool_scraps_delete_auth"
  ON ai_tool_scraps FOR DELETE
  TO authenticated
  USING (true);
