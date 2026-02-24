import { db } from "../config/db.js";

export type ChatMessageRecord = {
  id: string;
  user_id: string | null;
  user_pseudo: string;
  user_avatar_url: string | null;
  user_role: "user" | "admin" | "system";
  message_type: "user" | "system";
  message: string;
  created_at: string;
  reply_to_message_id: string | null;
  reply_to_user_id: string | null;
  reply_to_user_pseudo: string | null;
  reply_to_message: string | null;
};

export type ChatOnlineUserRecord = {
  user_id: string;
  user_pseudo: string;
  user_avatar_url: string | null;
  user_role: "user" | "admin";
  last_seen_at: string;
};

export type ChatOnlineGuestRecord = {
  guest_pseudo: string;
  last_seen_at: string;
};

export type ChatSettingsRecord = {
  maintenance_enabled: boolean;
  updated_at: string;
};

export type ChatPresenceStatus = "online" | "inactive" | "offline";

export type ChatPresenceStatusRecord = {
  status: ChatPresenceStatus;
  last_seen_at: string | null;
};

export async function getChatSettings(): Promise<ChatSettingsRecord> {
  const result = await db.query<ChatSettingsRecord>(
    `
      SELECT maintenance_enabled, updated_at
      FROM chat_settings
      WHERE id = 1
    `
  );
  return result.rows[0] ?? { maintenance_enabled: false, updated_at: new Date().toISOString() };
}

export async function listRecentChatMessages(limit: number): Promise<ChatMessageRecord[]> {
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  const result = await db.query<ChatMessageRecord>(
    `
      SELECT *
      FROM (
        SELECT
          m.id,
          m.user_id,
          CASE WHEN m.message_type = 'system' THEN 'Système' ELSE COALESCE(u.pseudo, m.guest_pseudo) END AS user_pseudo,
          CASE WHEN m.message_type = 'system' THEN NULL ELSE u.avatar_url END AS user_avatar_url,
          CASE WHEN m.message_type = 'system' THEN 'system' ELSE COALESCE(u.role, 'user') END AS user_role,
          m.message_type,
          m.message,
          m.created_at,
          m.reply_to_message_id,
          rm.user_id AS reply_to_user_id,
          CASE
            WHEN rm.id IS NULL THEN NULL
            WHEN rm.message_type = 'system' THEN 'Système'
            ELSE COALESCE(ru.pseudo, rm.guest_pseudo)
          END AS reply_to_user_pseudo,
          rm.message AS reply_to_message
        FROM chat_messages m
        LEFT JOIN users u ON u.id = m.user_id
        LEFT JOIN chat_messages rm ON rm.id = m.reply_to_message_id
        LEFT JOIN users ru ON ru.id = rm.user_id
        ORDER BY m.created_at DESC
        LIMIT $1
      ) t
      ORDER BY created_at ASC
    `,
    [safeLimit]
  );
  return result.rows;
}

export async function listChatMessagesAfter(afterIso: string, limit: number): Promise<ChatMessageRecord[]> {
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  const result = await db.query<ChatMessageRecord>(
    `
      SELECT
        m.id,
        m.user_id,
        CASE WHEN m.message_type = 'system' THEN 'Système' ELSE COALESCE(u.pseudo, m.guest_pseudo) END AS user_pseudo,
        CASE WHEN m.message_type = 'system' THEN NULL ELSE u.avatar_url END AS user_avatar_url,
        CASE WHEN m.message_type = 'system' THEN 'system' ELSE COALESCE(u.role, 'user') END AS user_role,
        m.message_type,
        m.message,
        m.created_at,
        m.reply_to_message_id,
        rm.user_id AS reply_to_user_id,
        CASE
          WHEN rm.id IS NULL THEN NULL
          WHEN rm.message_type = 'system' THEN 'Système'
          ELSE COALESCE(ru.pseudo, rm.guest_pseudo)
        END AS reply_to_user_pseudo,
        rm.message AS reply_to_message
      FROM chat_messages m
      LEFT JOIN users u ON u.id = m.user_id
      LEFT JOIN chat_messages rm ON rm.id = m.reply_to_message_id
      LEFT JOIN users ru ON ru.id = rm.user_id
      WHERE m.created_at > $1::timestamptz
      ORDER BY m.created_at ASC
      LIMIT $2
    `,
    [afterIso, safeLimit]
  );
  return result.rows;
}

export async function createChatMessage(userId: string, message: string, replyToMessageId: string | null): Promise<ChatMessageRecord | null> {
  const result = await db.query<ChatMessageRecord>(
    `
      WITH last_message AS (
        SELECT created_at
        FROM chat_messages
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      ),
      ins AS (
        INSERT INTO chat_messages (user_id, message, reply_to_message_id)
        SELECT $1, $2, $3
        WHERE NOT EXISTS (
          SELECT 1
          FROM last_message
          WHERE NOW() - created_at < INTERVAL '5 seconds'
        )
        RETURNING id, user_id, message, created_at, message_type, reply_to_message_id
      )
      SELECT
        ins.id,
        ins.user_id,
        u.pseudo AS user_pseudo,
        u.avatar_url AS user_avatar_url,
        u.role AS user_role,
        ins.message_type,
        ins.message,
        ins.created_at,
        ins.reply_to_message_id,
        rm.user_id AS reply_to_user_id,
        CASE
          WHEN rm.id IS NULL THEN NULL
          WHEN rm.message_type = 'system' THEN 'Système'
          ELSE COALESCE(ru.pseudo, rm.guest_pseudo)
        END AS reply_to_user_pseudo,
        rm.message AS reply_to_message
      FROM ins
      JOIN users u ON u.id = ins.user_id
      LEFT JOIN chat_messages rm ON rm.id = ins.reply_to_message_id
      LEFT JOIN users ru ON ru.id = rm.user_id
    `,
    [userId, message, replyToMessageId]
  );
  return result.rows[0] ?? null;
}

export async function createGuestChatMessage(guestPseudo: string, message: string, replyToMessageId: string | null): Promise<ChatMessageRecord | null> {
  const result = await db.query<ChatMessageRecord>(
    `
      WITH last_message AS (
        SELECT created_at
        FROM chat_messages
        WHERE guest_pseudo = $1
        ORDER BY created_at DESC
        LIMIT 1
      ),
      ins AS (
        INSERT INTO chat_messages (user_id, guest_pseudo, message, reply_to_message_id)
        SELECT NULL, $1, $2, $3
        WHERE NOT EXISTS (
          SELECT 1
          FROM last_message
          WHERE NOW() - created_at < INTERVAL '5 seconds'
        )
        RETURNING id, user_id, guest_pseudo, message, created_at, message_type, reply_to_message_id
      )
      SELECT
        ins.id,
        ins.user_id,
        ins.guest_pseudo AS user_pseudo,
        NULL AS user_avatar_url,
        'user' AS user_role,
        ins.message_type,
        ins.message,
        ins.created_at,
        ins.reply_to_message_id,
        rm.user_id AS reply_to_user_id,
        CASE
          WHEN rm.id IS NULL THEN NULL
          WHEN rm.message_type = 'system' THEN 'Système'
          ELSE COALESCE(ru.pseudo, rm.guest_pseudo)
        END AS reply_to_user_pseudo,
        rm.message AS reply_to_message
      FROM ins
      LEFT JOIN chat_messages rm ON rm.id = ins.reply_to_message_id
      LEFT JOIN users ru ON ru.id = rm.user_id
    `,
    [guestPseudo, message, replyToMessageId]
  );
  return result.rows[0] ?? null;
}

export async function clearChatMessagesAndCreateSystemMessage(actorUserId: string): Promise<ChatMessageRecord> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM chat_messages");
    const inserted = await client.query<ChatMessageRecord>(
      `
        INSERT INTO chat_messages (user_id, message, message_type, system_actor_user_id)
        VALUES (NULL, $1, 'system', $2)
        RETURNING
          id,
          user_id,
          'Système' AS user_pseudo,
          NULL AS user_avatar_url,
          'system' AS user_role,
          message_type,
          message,
          created_at,
          NULL AS reply_to_message_id,
          NULL AS reply_to_user_id,
          NULL AS reply_to_user_pseudo,
          NULL AS reply_to_message
      `,
      ["Le tchat a été effacé par un modérateur.", actorUserId]
    );
    await client.query("COMMIT");
    return inserted.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function setChatMaintenanceEnabled(actorUserId: string, enabled: boolean): Promise<ChatMessageRecord> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        UPDATE chat_settings
        SET maintenance_enabled = $1, updated_at = NOW()
        WHERE id = 1
      `,
      [enabled]
    );
    const inserted = await client.query<ChatMessageRecord>(
      `
        INSERT INTO chat_messages (user_id, message, message_type, system_actor_user_id)
        VALUES (
          NULL,
          $1,
          'system',
          $2
        )
        RETURNING
          id,
          user_id,
          'Système' AS user_pseudo,
          NULL AS user_avatar_url,
          'system' AS user_role,
          message_type,
          message,
          created_at,
          NULL AS reply_to_message_id,
          NULL AS reply_to_user_id,
          NULL AS reply_to_user_pseudo,
          NULL AS reply_to_message
      `,
      [enabled ? "Maintenance du tchat activée par un modérateur." : "Maintenance du tchat désactivée par un modérateur.", actorUserId]
    );
    await client.query("COMMIT");
    return inserted.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function upsertChatPresence(userId: string): Promise<void> {
  await db.query(
    `
      INSERT INTO chat_presence (user_id, last_seen_at)
      VALUES ($1, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET last_seen_at = NOW()
    `,
    [userId]
  );
}

export async function listOnlineChatUsers(windowSeconds: number, limit: number): Promise<ChatOnlineUserRecord[]> {
  const safeWindowSeconds = Math.max(10, Math.min(10 * 60, Math.floor(windowSeconds)));
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  const result = await db.query<ChatOnlineUserRecord>(
    `
      SELECT
        p.user_id,
        u.pseudo AS user_pseudo,
        u.avatar_url AS user_avatar_url,
        u.role AS user_role,
        p.last_seen_at
      FROM chat_presence p
      JOIN users u ON u.id = p.user_id
      WHERE p.last_seen_at > NOW() - make_interval(secs => $1)
      ORDER BY p.last_seen_at DESC
      LIMIT $2
    `,
    [safeWindowSeconds, safeLimit]
  );
  return result.rows;
}

export async function listOnlineChatGuests(windowSeconds: number, limit: number): Promise<ChatOnlineGuestRecord[]> {
  const safeWindowSeconds = Math.max(10, Math.min(10 * 60, Math.floor(windowSeconds)));
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  const result = await db.query<ChatOnlineGuestRecord>(
    `
      SELECT
        m.guest_pseudo,
        MAX(m.created_at) AS last_seen_at
      FROM chat_messages m
      WHERE m.guest_pseudo IS NOT NULL
        AND m.created_at > NOW() - make_interval(secs => $1)
      GROUP BY m.guest_pseudo
      ORDER BY last_seen_at DESC
      LIMIT $2
    `,
    [safeWindowSeconds, safeLimit]
  );
  return result.rows;
}

export async function getChatPresenceStatusForUser(userId: string): Promise<ChatPresenceStatusRecord> {
  const result = await db.query<ChatPresenceStatusRecord>(
    `
      SELECT
        CASE
          WHEN p.last_seen_at > NOW() - INTERVAL '5 minutes' THEN 'online'
          WHEN p.last_seen_at > NOW() - INTERVAL '30 minutes' THEN 'inactive'
          ELSE 'offline'
        END AS status,
        p.last_seen_at
      FROM chat_presence p
      WHERE p.user_id = $1
      LIMIT 1
    `,
    [userId]
  );
  return result.rows[0] ?? { status: "offline", last_seen_at: null };
}

export async function deleteChatPresence(userId: string): Promise<void> {
  await db.query(
    `
      DELETE FROM chat_presence
      WHERE user_id = $1
    `,
    [userId]
  );
}

export async function getChatMessageById(messageId: string): Promise<ChatMessageRecord | null> {
  const result = await db.query<ChatMessageRecord>(
    `
      SELECT 
        m.id,
        m.user_id,
        m.message,
        m.message_type,
        m.created_at,
        CASE WHEN m.message_type = 'system' THEN 'Système' ELSE COALESCE(u.pseudo, m.guest_pseudo) END AS user_pseudo,
        CASE WHEN m.message_type = 'system' THEN NULL ELSE u.avatar_url END AS user_avatar_url,
        CASE WHEN m.message_type = 'system' THEN 'system' ELSE COALESCE(u.role, 'user') END AS user_role,
        m.reply_to_message_id,
        rm.user_id AS reply_to_user_id,
        CASE
          WHEN rm.id IS NULL THEN NULL
          WHEN rm.message_type = 'system' THEN 'Système'
          ELSE COALESCE(ru.pseudo, rm.guest_pseudo)
        END AS reply_to_user_pseudo,
        rm.message AS reply_to_message
      FROM chat_messages m
      LEFT JOIN users u ON u.id = m.user_id
      LEFT JOIN chat_messages rm ON rm.id = m.reply_to_message_id
      LEFT JOIN users ru ON ru.id = rm.user_id
      WHERE m.id = $1
      LIMIT 1
    `,
    [messageId]
  );
  return result.rows[0] ?? null;
}

export async function deleteChatMessageById(messageId: string): Promise<void> {
  await db.query(
    `
      DELETE FROM chat_messages
      WHERE id = $1
    `,
    [messageId]
  );
}

export async function createSystemMessage(actorUserId: string, message: string): Promise<ChatMessageRecord> {
  const result = await db.query<ChatMessageRecord>(
    `
      INSERT INTO chat_messages (user_id, message, message_type, created_at)
      VALUES ($1, $2, 'system', NOW())
      RETURNING 
        id,
        user_id,
        message,
        message_type,
        created_at,
        'Système' AS user_pseudo,
        NULL AS user_avatar_url,
        'system' AS user_role,
        NULL AS reply_to_message_id,
        NULL AS reply_to_user_id,
        NULL AS reply_to_user_pseudo,
        NULL AS reply_to_message
    `,
    [actorUserId, message]
  );
  return result.rows[0];
}
