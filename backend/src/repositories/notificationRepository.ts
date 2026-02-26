import { db } from "../config/db.js";

export type AdminNotificationType = "user_registered" | "server_added" | "ticket_opened" | "ticket_user_replied";

export type AdminNotification = {
  id: string;
  type: AdminNotificationType;
  priority: number;
  title: string;
  message: string | null;
  user_id: string | null;
  server_id: string | null;
  ticket_id: string | null;
  created_at: string;
  read_at: string | null;
};

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
      await db.query(
        `
          CREATE TABLE IF NOT EXISTS admin_notifications (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            type text NOT NULL,
            priority int NOT NULL DEFAULT 5,
            title text NOT NULL,
            message text,
            user_id uuid REFERENCES users(id) ON DELETE SET NULL,
            server_id uuid REFERENCES servers(id) ON DELETE SET NULL,
            ticket_id uuid REFERENCES tickets(id) ON DELETE SET NULL,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            read_at timestamptz,
            CONSTRAINT admin_notifications_type CHECK (type IN ('user_registered','server_added','ticket_opened','ticket_user_replied')),
            CONSTRAINT admin_notifications_priority CHECK (priority BETWEEN 1 AND 9)
          )
        `
      );
      await db.query("CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC)");
      await db.query("CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread ON admin_notifications(read_at) WHERE read_at IS NULL");
      await db.query("CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type)");
    })();
  }
  await schemaReady;
}

export async function insertAdminNotification(input: {
  type: AdminNotificationType;
  priority?: number;
  title: string;
  message?: string | null;
  userId?: string | null;
  serverId?: string | null;
  ticketId?: string | null;
}): Promise<void> {
  await ensureSchema();
  await db.query(
    `
      INSERT INTO admin_notifications (type, priority, title, message, user_id, server_id, ticket_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      input.type,
      input.priority ?? 5,
      input.title,
      input.message ?? null,
      input.userId ?? null,
      input.serverId ?? null,
      input.ticketId ?? null
    ]
  );
}

export async function listAdminNotifications(params?: { onlyUnread?: boolean; limit?: number }): Promise<AdminNotification[]> {
  await ensureSchema();
  const onlyUnread = params?.onlyUnread ?? false;
  const limit = params?.limit ?? 100;
  const where = onlyUnread ? "WHERE read_at IS NULL" : "";
  const result = await db.query<AdminNotification>(
    `
      SELECT id, type, priority, title, message, user_id, server_id, ticket_id, created_at, read_at
      FROM admin_notifications
      ${where}
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [limit]
  );
  return result.rows;
}

export async function markNotificationsRead(params: { ids?: string[]; all?: boolean }): Promise<void> {
  await ensureSchema();
  if (params.all) {
    await db.query("UPDATE admin_notifications SET read_at = NOW() WHERE read_at IS NULL");
    return;
  }
  const ids = params.ids ?? [];
  if (ids.length === 0) return;
  await db.query(
    `
      UPDATE admin_notifications
      SET read_at = NOW()
      WHERE id = ANY($1::uuid[])
    `,
    [ids]
  );
}

export async function countUnreadNotifications(): Promise<number> {
  await ensureSchema();
  const result = await db.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM admin_notifications WHERE read_at IS NULL");
  return Number(result.rows[0]?.count ?? "0");
}

