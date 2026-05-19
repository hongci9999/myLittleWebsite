-- 사이트 도메인 등록·만료일 (메인 알림판, 관리자 연장 반영)
-- Supabase SQL Editor에서 실행
--
-- 관련: decisions/0019-site-domain-expiry-notice.md
--       api-spec.md §9  |  GET /api/site-domain, POST /api/site-domain/renew

CREATE TABLE IF NOT EXISTS site_domain_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  registered_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO site_domain_settings (id, registered_date, expiry_date)
VALUES (1, '2026-05-16', '2026-08-16')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_domain_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_site_domain_settings"
  ON site_domain_settings FOR SELECT TO anon USING (true);

CREATE POLICY "auth_write_site_domain_settings"
  ON site_domain_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
