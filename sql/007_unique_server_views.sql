CREATE TABLE IF NOT EXISTS server_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_server_views_server_user UNIQUE (server_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_server_views_server_user ON server_views(server_id, user_id);
