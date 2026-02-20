CREATE TABLE IF NOT EXISTS chat_presence (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_presence_last_seen_idx ON chat_presence (last_seen_at DESC);

