ALTER TABLE users
ADD COLUMN IF NOT EXISTS balance_cents integer NOT NULL DEFAULT 0;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_balance_update timestamptz;
