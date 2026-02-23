CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL,
  priority int NOT NULL,
  category text NOT NULL,
  subcategory text,
  server_id uuid REFERENCES servers(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  server_url text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  last_message_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT tickets_priority_range CHECK (priority BETWEEN 1 AND 9),
  CONSTRAINT tickets_status_allowed CHECK (status IN ('En attente d’attribution', 'Ouvert', 'En attente utilisateur', 'En cours', 'En investigation', 'Résolu', 'Clôturé'))
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  admin_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  author_role text NOT NULL,
  message text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT ticket_messages_author_role CHECK (author_role IN ('user', 'admin'))
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_admin ON tickets(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_tickets_last_message ON tickets(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at ASC);
