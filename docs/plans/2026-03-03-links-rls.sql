-- RLS 정책 (스키마 실행 후 Supabase SQL Editor에서 실행)
-- anon: 읽기만. authenticated: 쓰기 가능.

ALTER TABLE classification_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE classification_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_value_relations ENABLE ROW LEVEL SECURITY;

-- anon: SELECT
CREATE POLICY "anon_read_dimensions" ON classification_dimensions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_values" ON classification_values FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_links" ON links FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_relations" ON link_value_relations FOR SELECT TO anon USING (true);

-- authenticated: SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "auth_all_dimensions" ON classification_dimensions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_values" ON classification_values FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_links" ON links FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_relations" ON link_value_relations FOR ALL TO authenticated USING (true) WITH CHECK (true);
