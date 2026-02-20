CREATE TABLE IF NOT EXISTS stripe_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id TEXT NOT NULL UNIQUE,
  payment_intent_id TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('quokka_plus', 'essentiel')),
  planned_start_date TIMESTAMPTZ,
  duration_days INTEGER,
  duration_hours INTEGER,
  promotion_start_date TIMESTAMPTZ,
  promotion_end_date TIMESTAMPTZ,
  amount_cents INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE stripe_payments ADD COLUMN IF NOT EXISTS promotion_start_date TIMESTAMPTZ;
ALTER TABLE stripe_payments ADD COLUMN IF NOT EXISTS promotion_end_date TIMESTAMPTZ;
