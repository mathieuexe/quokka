-- Indexes for performance based on WHERE, JOIN, and ORDER BY clauses in backend repositories

-- Users & Authentication
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_pseudo ON users(LOWER(pseudo));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_internal_note ON users(internal_note);

-- User Badges
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Chat
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_presence_user_id ON chat_presence(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_presence_last_seen ON chat_presence(last_seen DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_banned_ips_ip_address ON banned_ips(ip_address);

-- Stripe / Payments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stripe_payments_user_id ON stripe_payments(user_id);

-- Discord Integration
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_discord_user_id ON users_discord(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_discord_discord_id ON users_discord(discord_id);
