ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'user';

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS system_actor_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE chat_messages
  ALTER COLUMN user_id DROP NOT NULL;

