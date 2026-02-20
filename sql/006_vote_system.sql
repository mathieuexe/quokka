CREATE TABLE IF NOT EXISTS server_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vote_system_state (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  last_reset_month DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_vote_state_row CHECK (id = 1)
);

INSERT INTO vote_system_state (id, last_reset_month)
VALUES (1, date_trunc('month', NOW())::date)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_server_votes_server_user_time ON server_votes(server_id, user_id, voted_at DESC);
