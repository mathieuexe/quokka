-- Table pour les bannissements
CREATE TABLE IF NOT EXISTS chat_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS chat_bans_user_id_idx ON chat_bans (user_id);
CREATE INDEX IF NOT EXISTS chat_bans_active_idx ON chat_bans (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS chat_bans_expires_at_idx ON chat_bans (expires_at);

-- Table pour les mutes
CREATE TABLE IF NOT EXISTS chat_mutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS chat_mutes_user_id_idx ON chat_mutes (user_id);
CREATE INDEX IF NOT EXISTS chat_mutes_active_idx ON chat_mutes (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS chat_mutes_expires_at_idx ON chat_mutes (expires_at);

-- Table pour les avertissements
CREATE TABLE IF NOT EXISTS chat_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_warnings_user_id_idx ON chat_warnings (user_id);
CREATE INDEX IF NOT EXISTS chat_warnings_created_at_idx ON chat_warnings (created_at DESC);

-- Fonction pour nettoyer les anciens bannissements expirés
CREATE OR REPLACE FUNCTION cleanup_expired_chat_bans()
RETURNS INTEGER AS $$
BEGIN
  UPDATE chat_bans
  SET is_active = FALSE
  WHERE is_active = TRUE 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  RETURN (SELECT COUNT(*) FROM chat_bans WHERE is_active = FALSE AND expires_at < NOW());
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciens mutes expirés
CREATE OR REPLACE FUNCTION cleanup_expired_chat_mutes()
RETURNS INTEGER AS $$
BEGIN
  UPDATE chat_mutes
  SET is_active = FALSE
  WHERE is_active = TRUE 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  RETURN (SELECT COUNT(*) FROM chat_mutes WHERE is_active = FALSE AND expires_at < NOW());
END;
$$ LANGUAGE plpgsql;

-- Vues pour faciliter les requêtes
CREATE OR REPLACE VIEW active_chat_bans AS
SELECT * FROM chat_bans 
WHERE is_active = TRUE 
  AND (expires_at IS NULL OR expires_at > NOW());

CREATE OR REPLACE VIEW active_chat_mutes AS
SELECT * FROM chat_mutes 
WHERE is_active = TRUE 
  AND (expires_at IS NULL OR expires_at > NOW());