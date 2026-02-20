-- Ajouter une colonne pour indiquer si l'email est vérifié
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE NOT NULL;

-- Table pour stocker les codes de vérification (inscription)
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index pour email_verification_codes
CREATE INDEX IF NOT EXISTS idx_verification_user_id ON email_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_code ON email_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_expires ON email_verification_codes(expires_at);

-- Table pour stocker les codes 2FA (connexion)
CREATE TABLE IF NOT EXISTS two_factor_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index pour two_factor_codes
CREATE INDEX IF NOT EXISTS idx_2fa_user_id ON two_factor_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_code ON two_factor_codes(code);
CREATE INDEX IF NOT EXISTS idx_2fa_expires ON two_factor_codes(expires_at);

-- Ajouter une colonne pour activer/désactiver la 2FA par utilisateur
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT TRUE NOT NULL;

COMMENT ON TABLE email_verification_codes IS 'Codes de vérification envoyés par email lors de l''inscription';
COMMENT ON TABLE two_factor_codes IS 'Codes 2FA envoyés par email lors de la connexion';
COMMENT ON COLUMN users.email_verified IS 'Indique si l''email de l''utilisateur a été vérifié';
COMMENT ON COLUMN users.two_factor_enabled IS 'Indique si la double authentification est activée pour cet utilisateur';
