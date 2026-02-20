-- Ajouter une colonne pour la langue de l'utilisateur
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'fr' NOT NULL;

COMMENT ON COLUMN users.language IS 'Langue préférée de l''utilisateur (fr, en, es, de, etc.)';

-- Mise à jour des utilisateurs existants pour avoir 'fr' par défaut
UPDATE users SET language = 'fr' WHERE language IS NULL OR language = '';
