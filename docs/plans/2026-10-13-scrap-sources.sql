-- 스크랩 원문 캐시 (MCP get_source용). 섹션 테이블과 독립, url로 연결.
-- 유튜브 자막은 Vercel IP에서 막히므로 로컬 백필(server/scripts/backfill-sources.ts)로 채운다.
CREATE TABLE IF NOT EXISTS scrap_sources (
  url TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('transcript', 'readme', 'page')),
  text TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE scrap_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scrap_sources_select_public" ON scrap_sources;
DROP POLICY IF EXISTS "scrap_sources_write_auth" ON scrap_sources;

CREATE POLICY "scrap_sources_select_public"
  ON scrap_sources FOR SELECT USING (true);
CREATE POLICY "scrap_sources_write_auth"
  ON scrap_sources FOR ALL TO authenticated USING (true) WITH CHECK (true);
