import { db } from "../config/db.js";
import type { ChatMessage } from "../types/chat.js";

let chatSchemaReady: Promise<void> | null = null;

async function ensureChatSchema(): Promise<void> {
  if (!chatSchemaReady) {
    chatSchemaReady = (async () => {
      try {
        await db.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
      } catch (error) {
        console.error("pgcrypto extension unavailable:", error instanceof Error ? error.message : error);
      }
      await db.query(
        `
          CREATE TABLE IF NOT EXISTS chat_settings (
            id int PRIMARY KEY,
            maintenance_enabled boolean NOT NULL DEFAULT FALSE
          )
        `
      );
      await db.query(
        `
          INSERT INTO chat_settings (id, maintenance_enabled)
          VALUES (1, FALSE)
          ON CONFLICT (id) DO NOTHING
        `
      );
      await db.query(
        `
          CREATE TABLE IF NOT EXISTS chat_messages (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES users(id) ON DELETE SET NULL,
            user_pseudo text,
            message_type text NOT NULL DEFAULT 'user',
            message text NOT NULL,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            reply_to_message_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL
          )
        `
      );
      await db.query("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS user_pseudo text");
      await db.query(
        "ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to_message_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL"
      );
      await db.query("CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages(reply_to_message_id)");
      await db.query(
        `
          CREATE TABLE IF NOT EXISTS chat_presence (
            user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            last_seen timestamptz NOT NULL DEFAULT NOW()
          )
        `
      );
      await db.query(
        `
          CREATE TABLE IF NOT EXISTS chat_guest_presence (
            guest_pseudo text PRIMARY KEY,
            last_seen timestamptz NOT NULL DEFAULT NOW()
          )
        `
      );
      await db.query(
        `
          CREATE TABLE IF NOT EXISTS banned_ips (
            ip_address text PRIMARY KEY,
            created_at timestamptz NOT NULL DEFAULT NOW()
          )
        `
      );
    })();
  }
  await chatSchemaReady;
}

// Fonctions de modération d'IP
export async function banIp(ipAddress: string): Promise<void> {
  await ensureChatSchema();
  await db.query("INSERT INTO banned_ips (ip_address) VALUES ($1) ON CONFLICT (ip_address) DO NOTHING", [ipAddress]);
}

export async function isIpBanned(ipAddress: string): Promise<boolean> {
  await ensureChatSchema();
  const result = await db.query("SELECT 1 FROM banned_ips WHERE ip_address = $1", [ipAddress]);
  return (result.rowCount ?? 0) > 0;
}

// Fonctions de tchat
export async function getChatSettings(): Promise<{ maintenance_enabled: boolean }> {
  await ensureChatSchema();
  const result = await db.query("SELECT maintenance_enabled FROM chat_settings WHERE id = 1");
  return result.rows[0] ?? { maintenance_enabled: false };
}

export async function listRecentChatMessages(limit: number): Promise<ChatMessage[]> {
  await ensureChatSchema();
  const result = await db.query<ChatMessage>(
    `
      SELECT
        cm.id,
        cm.user_id,
        u.pseudo as user_pseudo,
        u.avatar_url as user_avatar_url,
        u.role as user_role,
        cm.message_type,
        cm.message,
        cm.created_at,
        rcm.id as reply_to_message_id,
        rcm.message as reply_to_message,
        ru.id as reply_to_user_id,
        ru.pseudo as reply_to_user_pseudo
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
      LEFT JOIN chat_messages rcm ON cm.reply_to_message_id = rcm.id
      LEFT JOIN users ru ON rcm.user_id = ru.id
      ORDER BY cm.created_at DESC
      LIMIT $1
    `,
    [limit]
  );
  return result.rows.reverse();
}

export async function listChatMessagesAfter(after: string, limit: number): Promise<ChatMessage[]> {
  await ensureChatSchema();
  const result = await db.query<ChatMessage>(
    `
      SELECT
        cm.id,
        cm.user_id,
        u.pseudo as user_pseudo,
        u.avatar_url as user_avatar_url,
        u.role as user_role,
        cm.message_type,
        cm.message,
        cm.created_at,
        rcm.id as reply_to_message_id,
        rcm.message as reply_to_message,
        ru.id as reply_to_user_id,
        ru.pseudo as reply_to_user_pseudo
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
      LEFT JOIN chat_messages rcm ON cm.reply_to_message_id = rcm.id
      LEFT JOIN users ru ON rcm.user_id = ru.id
      WHERE cm.created_at > $1
      ORDER BY cm.created_at ASC
      LIMIT $2
    `,
    [after, limit]
  );
  return result.rows;
}

export async function getChatMessageById(messageId: string): Promise<ChatMessage | null> {
  await ensureChatSchema();
  const result = await db.query<ChatMessage>(
    `
      SELECT
        cm.id,
        cm.user_id,
        u.pseudo as user_pseudo,
        u.avatar_url as user_avatar_url,
        u.role as user_role,
        cm.message_type,
        cm.message,
        cm.created_at,
        rcm.id as reply_to_message_id,
        rcm.message as reply_to_message,
        ru.id as reply_to_user_id,
        ru.pseudo as reply_to_user_pseudo
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
      LEFT JOIN chat_messages rcm ON cm.reply_to_message_id = rcm.id
      LEFT JOIN users ru ON rcm.user_id = ru.id
      WHERE cm.id = $1
    `,
    [messageId]
  );
  return result.rows[0] ?? null;
}

export async function createChatMessage(
  userId: string,
  message: string,
  replyToMessageId: string | null
): Promise<ChatMessage | null> {
  await ensureChatSchema();
  // Anti-spam simple
  const lastMessage = await db.query("SELECT created_at FROM chat_messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [userId]);
  if (lastMessage.rows.length > 0) {
    const lastMessageTime = new Date(lastMessage.rows[0].created_at).getTime();
    if (Date.now() - lastMessageTime < 5000) {
      return null;
    }
  }

  const result = await db.query(
    "INSERT INTO chat_messages (user_id, message, reply_to_message_id, message_type) VALUES ($1, $2, $3, 'user') RETURNING id",
    [userId, message, replyToMessageId]
  );
  return getChatMessageById(result.rows[0].id);
}

export async function createGuestChatMessage(
  guestPseudo: string,
  message: string,
  replyToMessageId: string | null
): Promise<ChatMessage | null> {
  await ensureChatSchema();
  // Pour les invités, l'anti-spam est basé sur l'IP, mais nous ne l'avons pas ici.
  // On va donc se contenter d'un cooldown global pour les invités.
  // Cette logique est simplifiée et devrait être améliorée.
  const result = await db.query(
    "INSERT INTO chat_messages (user_pseudo, message, reply_to_message_id, message_type) VALUES ($1, $2, $3, 'guest') RETURNING id",
    [guestPseudo, message, replyToMessageId]
  );
  return getChatMessageById(result.rows[0].id);
}

export async function createSystemMessage(adminUserId: string, message: string): Promise<ChatMessage> {
  await ensureChatSchema();
  const result = await db.query(
    "INSERT INTO chat_messages (user_id, message, message_type) VALUES ($1, $2, 'system') RETURNING id",
    [adminUserId, message]
  );
  const newMessage = await getChatMessageById(result.rows[0].id);
  if (!newMessage) throw new Error("Failed to create system message");
  return newMessage;
}

export async function deleteChatMessageById(messageId: string): Promise<void> {
  await ensureChatSchema();
  await db.query("DELETE FROM chat_messages WHERE id = $1", [messageId]);
}

export async function clearChatMessagesAndCreateSystemMessage(adminUserId: string): Promise<ChatMessage> {
  await ensureChatSchema();
  await db.query("DELETE FROM chat_messages WHERE message_type != 'system'");
  return createSystemMessage(adminUserId, "Le tchat a été vidé par un administrateur.");
}

export async function setChatMaintenanceEnabled(enabled: boolean): Promise<void> {
  await ensureChatSchema();
  await db.query("UPDATE chat_settings SET maintenance_enabled = $1 WHERE id = 1", [enabled]);
}

export async function upsertChatPresence(userId: string): Promise<void> {
  await ensureChatSchema();
  await db.query(
    "INSERT INTO chat_presence (user_id, last_seen) VALUES ($1, NOW()) ON CONFLICT (user_id) DO UPDATE SET last_seen = NOW()",
    [userId]
  );
}

export async function upsertGuestPresence(guestPseudo: string): Promise<void> {
  await ensureChatSchema();
  await db.query(
    "INSERT INTO chat_guest_presence (guest_pseudo, last_seen) VALUES ($1, NOW()) ON CONFLICT (guest_pseudo) DO UPDATE SET last_seen = NOW()",
    [guestPseudo]
  );
}

export async function deleteChatPresence(userId: string): Promise<void> {
  await ensureChatSchema();
  await db.query("DELETE FROM chat_presence WHERE user_id = $1", [userId]);
}

export async function listOnlineChatUsers(
  windowSeconds: number,
  limit: number
): Promise<{ id: string; pseudo: string; avatar_url: string | null; role: "user" | "admin"; last_seen: string }[]> {
  await ensureChatSchema();
  const result = await db.query(
    `
      SELECT u.id, u.pseudo, u.avatar_url, u.role, p.last_seen
      FROM users u
      JOIN chat_presence p ON u.id = p.user_id
      WHERE p.last_seen > NOW() - INTERVAL '1 second' * $1
      ORDER BY u.pseudo
      LIMIT $2
    `,
    [windowSeconds, limit]
  );
  return result.rows;
}

export async function listOnlineChatGuests(
  windowSeconds: number,
  limit: number
): Promise<{ pseudo: string; last_seen_at: string }[]> {
  await ensureChatSchema();
  const result = await db.query(
    `
      SELECT guest_pseudo as pseudo, last_seen as last_seen_at
      FROM chat_guest_presence
      WHERE last_seen > NOW() - INTERVAL '1 second' * $1
      ORDER BY guest_pseudo
      LIMIT $2
    `,
    [windowSeconds, limit]
  );
  return result.rows;
}

export async function getChatPresenceStatusForUser(userId: string): Promise<{ is_online: boolean; last_seen: string | null }> {
  await ensureChatSchema();
  const result = await db.query("SELECT last_seen FROM chat_presence WHERE user_id = $1 AND last_seen > NOW() - INTERVAL '60 seconds'", [userId]);
  if (result.rows.length > 0) {
    return { is_online: true, last_seen: result.rows[0].last_seen };
  }
  const lastSeenResult = await db.query("SELECT last_seen FROM chat_presence WHERE user_id = $1", [userId]);
  return { is_online: false, last_seen: lastSeenResult.rows[0]?.last_seen ?? null };
}
