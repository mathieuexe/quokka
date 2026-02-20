BEGIN;

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(64) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  discount_type VARCHAR(16) NOT NULL CHECK (discount_type IN ('fixed', 'percent', 'free')),
  discount_value INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS promo_codes_code_idx ON promo_codes(code);
CREATE INDEX IF NOT EXISTS promo_codes_user_idx ON promo_codes(user_id);
CREATE INDEX IF NOT EXISTS promo_codes_server_idx ON promo_codes(server_id);

COMMIT;
