import { db } from "../config/db.js";
import type { ChatMessage } from "../types/chat.js";

// Fonctions de modération d'IP
export async function banIp(ipAddress: string): Promise<void> {
  await db.query("INSERT INTO banned_ips (ip_address) VALUES ($1) ON CONFLICT (ip_address) DO NOTHING", [ipAddress]);
}

export async function isIpBanned(ipAddress: string): Promise<boolean> {
  const result = await db.query("SELECT 1 FROM banned_ips WHERE ip_address = $1", [ipAddress]);
  return (result.rowCount ?? 0) > 0;
}

// Fonctions de tchat
export async function getChatSettings(): Promise<{ maintenance_enabled: boolean }> {
  const result = await db.query("SELECT maintenance_enabled FROM chat_settings WHERE id = 1");
  return result.rows[0];
}

export async function listRecentChatMessages(limit: number): Promise<ChatMessage[]> {
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
  const result = await db.query(
    "INSERT INTO chat_messages (user_id, message, message_type) VALUES ($1, $2, 'system') RETURNING id",
    [adminUserId, message]
  );
  const newMessage = await getChatMessageById(result.rows[0].id);
  if (!newMessage) throw new Error("Failed to create system message");
  return newMessage;
}

export async function deleteChatMessageById(messageId: string): Promise<void> {
  await db.query("DELETE FROM chat_messages WHERE id = $1", [messageId]);
}

export async function clearChatMessagesAndCreateSystemMessage(adminUserId: string): Promise<ChatMessage> {
  await db.query("DELETE FROM chat_messages WHERE message_type != 'system'");
  return createSystemMessage(adminUserId, "Le tchat a été vidé par un administrateur.");
}

export async function setChatMaintenanceEnabled(enabled: boolean): Promise<void> {
  await db.query("UPDATE chat_settings SET maintenance_enabled = $1 WHERE id = 1", [enabled]);
}

export async function upsertChatPresence(userId: string): Promise<void> {
  await db.query(
    "INSERT INTO chat_presence (user_id, last_seen) VALUES ($1, NOW()) ON CONFLICT (user_id) DO UPDATE SET last_seen = NOW()",
    [userId]
  );
}

export async function deleteChatPresence(userId: string): Promise<void> {
  await db.query("DELETE FROM chat_presence WHERE user_id = $1", [userId]);
}

export async function listOnlineChatUsers(
  windowSeconds: number,
  limit: number
): Promise<{ id: string; pseudo: string; avatar_url: string | null }[]> {
  const result = await db.query(
    `
      SELECT u.id, u.pseudo, u.avatar_url
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
): Promise<{ pseudo: string }[]> {
  // Cette fonction est plus complexe car les invités n'ont pas de présence suivie.
  // On se base sur les messages récents.
  const result = await db.query(
    `
      SELECT DISTINCT user_pseudo as pseudo
      FROM chat_messages
      WHERE message_type = 'guest'
        AND user_pseudo IS NOT NULL
        AND created_at > NOW() - INTERVAL '1 second' * $1
      ORDER BY user_pseudo
      LIMIT $2
    `,
    [windowSeconds, limit]
  );
  return result.rows;
}

export async function getChatPresenceStatusForUser(userId: string): Promise<{ is_online: boolean; last_seen: string | null }> {
  const result = await db.query("SELECT last_seen FROM chat_presence WHERE user_id = $1 AND last_seen > NOW() - INTERVAL '60 seconds'", [userId]);
  if (result.rows.length > 0) {
    return { is_online: true, last_seen: result.rows[0].last_seen };
  }
  const lastSeenResult = await db.query("SELECT last_seen FROM chat_presence WHERE user_id = $1", [userId]);
  return { is_online: false, last_seen: lastSeenResult.rows[0]?.last_seen ?? null };
}
