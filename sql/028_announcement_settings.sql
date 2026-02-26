CREATE TABLE IF NOT EXISTS announcement_settings (
  id int PRIMARY KEY,
  is_enabled boolean NOT NULL DEFAULT FALSE,
  text text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '',
  cta_label text NOT NULL DEFAULT '',
  cta_url text NOT NULL DEFAULT '',
  countdown_target text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

INSERT INTO announcement_settings (id, is_enabled, text, icon, cta_label, cta_url, countdown_target)
VALUES (1, FALSE, '', '', '', '', '')
ON CONFLICT (id) DO NOTHING;
