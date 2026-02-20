BEGIN;

CREATE TABLE IF NOT EXISTS stripe_payment_promos (
  checkout_session_id TEXT PRIMARY KEY REFERENCES stripe_payments(checkout_session_id) ON DELETE CASCADE,
  base_amount_cents INTEGER NOT NULL,
  promo_code VARCHAR(64),
  promo_discount_type VARCHAR(16) CHECK (promo_discount_type IN ('fixed', 'percent', 'free')),
  promo_discount_value INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
