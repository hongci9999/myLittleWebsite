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

-- 등록일=만료 1년 전(365일 기간) → 연장 반영 시 +1년
INSERT INTO site_domain_settings (id, registered_date, expiry_date)
VALUES (1, '2026-08-16', '2027-08-16')
ON CONFLICT (id) DO NOTHING;

-- 이미 잘못된 값(3개월 주기 등)이 들어간 경우 아래로 현행화:
-- UPDATE site_domain_settings
-- SET registered_date = '2026-08-16', expiry_date = '2027-08-16', updated_at = now()
-- WHERE id = 1;

ALTER TABLE site_domain_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_site_domain_settings"
  ON site_domain_settings FOR SELECT TO anon USING (true);

CREATE POLICY "auth_write_site_domain_settings"
  ON site_domain_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
