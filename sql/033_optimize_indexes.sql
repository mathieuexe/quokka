-- Index for server queries
CREATE INDEX IF NOT EXISTS idx_servers_is_visible ON servers(is_visible);
CREATE INDEX IF NOT EXISTS idx_servers_user_id ON servers(user_id);
CREATE INDEX IF NOT EXISTS idx_servers_category_id ON servers(category_id);
CREATE INDEX IF NOT EXISTS idx_servers_created_at ON servers(created_at DESC);

-- Index for stats sorting
CREATE INDEX IF NOT EXISTS idx_stats_server_id ON stats(server_id);
CREATE INDEX IF NOT EXISTS idx_stats_likes_views_visits ON stats(likes DESC, views DESC, visits DESC);

-- Index for subscriptions active check
CREATE INDEX IF NOT EXISTS idx_subscriptions_server_id_end_date ON subscriptions(server_id, end_date DESC);
