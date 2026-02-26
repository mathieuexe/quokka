CREATE TABLE IF NOT EXISTS balance_topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_balance_topups_user_id ON balance_topups(user_id);
