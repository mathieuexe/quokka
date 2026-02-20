BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pseudo VARCHAR(60) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(60) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  website TEXT,
  country_code VARCHAR(2) NOT NULL,
  ip VARCHAR(255),
  port INTEGER,
  invite_link TEXT,
  banner_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_servers_game_or_community CHECK (
    (
      invite_link IS NOT NULL
      AND ip IS NULL
      AND port IS NULL
    )
    OR (
      invite_link IS NULL
      AND ip IS NOT NULL
      AND port IS NOT NULL
    )
  )
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('quokka_plus', 'essentiel')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  premium_slot INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL UNIQUE REFERENCES servers(id) ON DELETE CASCADE,
  views BIGINT NOT NULL DEFAULT 0,
  likes BIGINT NOT NULL DEFAULT 0,
  visits BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS server_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS server_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_server_views_server_user UNIQUE (server_id, user_id)
);

CREATE TABLE IF NOT EXISTS vote_system_state (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  last_reset_month DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_vote_state_row CHECK (id = 1)
);

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

CREATE TABLE IF NOT EXISTS maintenance_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  message TEXT NOT NULL DEFAULT 'Le site est en maintenance.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_maintenance_row CHECK (id = 1)
);

INSERT INTO maintenance_settings (id, is_enabled, message)
VALUES (1, false, 'Le site est en maintenance.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vote_system_state (id, last_reset_month)
VALUES (1, date_trunc('month', NOW())::date)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_servers_category ON servers(category_id);
CREATE INDEX IF NOT EXISTS idx_servers_user ON servers(user_id);
CREATE INDEX IF NOT EXISTS idx_servers_created ON servers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_server ON subscriptions(server_id);
CREATE INDEX IF NOT EXISTS idx_server_votes_server_user_time ON server_votes(server_id, user_id, voted_at DESC);
CREATE INDEX IF NOT EXISTS idx_server_views_server_user ON server_views(server_id, user_id);

COMMIT;
