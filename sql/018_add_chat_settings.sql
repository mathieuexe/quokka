CREATE TABLE IF NOT EXISTS chat_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  maintenance_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_chat_settings_row CHECK (id = 1)
);

INSERT INTO chat_settings (id, maintenance_enabled)
VALUES (1, FALSE)
ON CONFLICT (id) DO NOTHING;

