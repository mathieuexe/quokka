import { db } from "../config/db.js";

const BADGE_DISPLAY_ORDER_SQL_WITH_ALIAS = `
  CASE b.slug
    WHEN 'fondateur' THEN 1
    WHEN 'moderateur_quokka' THEN 2
    WHEN 'developpeur_quokka' THEN 3
    WHEN 'soutien_financier_quokka' THEN 4
    WHEN '100_premiers_utilisateurs' THEN 5
    ELSE 999
  END
`;

const BADGE_DISPLAY_ORDER_SQL = `
  CASE slug
    WHEN 'fondateur' THEN 1
    WHEN 'moderateur_quokka' THEN 2
    WHEN 'developpeur_quokka' THEN 3
    WHEN 'soutien_financier_quokka' THEN 4
    WHEN '100_premiers_utilisateurs' THEN 5
    ELSE 999
  END
`;

export type UserBadge = {
  id: string;
  slug: string;
  label: string;
  image_url: string;
};

export type AdminUserRecord = {
  id: string;
  pseudo: string;
  email: string;
  bio: string | null;
  internal_note: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  created_at: string;
  badges: UserBadge[];
  email_verified: boolean;
  two_factor_enabled: boolean;
  language: string;
  balance_cents: number;
  last_balance_update: string | null;
};

export type DbUser = {
  id: string;
  pseudo: string;
  pseudo_last_changed_at: string | null;
  email: string;
  password_hash: string;
  bio: string;
  avatar_url: string | null;
  last_login_at: string | null;
  discord_url: string | null;
  x_url: string | null;
  bluesky_url: string | null;
  stoat_url: string | null;
  youtube_url: string | null;
  twitch_url: string | null;
  kick_url: string | null;
  snapchat_url: string | null;
  tiktok_url: string | null;
  role: "user" | "admin";
  email_verified: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  language: string;
  balance_cents: number;
  last_balance_update: string | null;
};

export type DiscordUserRecord = {
  id: string;
  user_id: string;
  discord_id: string;
  username: string;
  avatar_url: string | null;
  email: string | null;
  locale: string | null;
  profile: unknown;
  created_at: string;
  updated_at: string;
};

export type UserIpEvent = {
  id: string;
  user_id: string;
  event_type: "register" | "login" | "chat_message";
  ip: string;
  provider: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  chat_message_id: string | null;
  created_at: string;
};

let userIpSchemaReady: Promise<void> | null = null;
let pseudoCooldownSchemaReady: Promise<void> | null = null;
let pseudoCooldownSchemaAvailable = true;

function getPgErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  if (!("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

export async function ensureUserPseudoCooldownSchema(): Promise<void> {
  if (!pseudoCooldownSchemaReady) {
    pseudoCooldownSchemaReady = (async () => {
      try {
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS pseudo_last_changed_at timestamptz");
        pseudoCooldownSchemaAvailable = true;
      } catch (error) {
        pseudoCooldownSchemaAvailable = false;
        console.error(
          "pseudo_last_changed_at unavailable:",
          error instanceof Error ? error.message : error
        );
      }
    })();
  }
  await pseudoCooldownSchemaReady;
}

async function ensureUserIpSchema(): Promise<void> {
  if (!userIpSchemaReady) {
    userIpSchemaReady = (async () => {
      try {
        await db.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
      } catch (error) {
        console.error("pgcrypto extension unavailable:", error instanceof Error ? error.message : error);
      }
      await db.query(
        `
          CREATE TABLE IF NOT EXISTS user_ip_events (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            event_type text NOT NULL,
            ip text NOT NULL,
            provider text,
            country text,
            region text,
            city text,
            chat_message_id uuid,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            CONSTRAINT user_ip_events_event_type CHECK (event_type IN ('register', 'login', 'chat_message'))
          )
        `
      );
      await db.query("CREATE INDEX IF NOT EXISTS idx_user_ip_events_user_id ON user_ip_events(user_id)");
      await db.query("CREATE INDEX IF NOT EXISTS idx_user_ip_events_created_at ON user_ip_events(created_at DESC)");
    })();
  }
  await userIpSchemaReady;
}

export async function insertUserIpEvent(entry: {
  userId: string;
  eventType: UserIpEvent["event_type"];
  ip: string | null;
  provider?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  chatMessageId?: string | null;
}): Promise<void> {
  if (!entry.ip) return;
  await ensureUserIpSchema();
  await db.query(
    `
      INSERT INTO user_ip_events (
        user_id, event_type, ip, provider, country, region, city, chat_message_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      entry.userId,
      entry.eventType,
      entry.ip,
      entry.provider ?? null,
      entry.country ?? null,
      entry.region ?? null,
      entry.city ?? null,
      entry.chatMessageId ?? null
    ]
  );
}

export async function listUserIpEvents(userId: string, limit: number = 50): Promise<UserIpEvent[]> {
  await ensureUserIpSchema();
  const result = await db.query<UserIpEvent>(
    `
      SELECT id, user_id, event_type, ip, provider, country, region, city, chat_message_id, created_at
      FROM user_ip_events
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [userId, limit]
  );
  return result.rows;
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const result = await db.query<DbUser>("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const result = await db.query<DbUser>("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
  return result.rows[0] ?? null;
}

export async function findUserByPseudo(pseudo: string): Promise<DbUser | null> {
  const result = await db.query<DbUser>("SELECT * FROM users WHERE LOWER(pseudo) = LOWER($1) LIMIT 1", [pseudo]);
  return result.rows[0] ?? null;
}

export async function findUserByDiscordId(discordId: string): Promise<DbUser | null> {
  const result = await db.query<DbUser>(
    `
      SELECT u.*
      FROM users u
      JOIN users_discord d ON d.user_id = u.id
      WHERE d.discord_id = $1
      LIMIT 1
    `,
    [discordId]
  );
  return result.rows[0] ?? null;
}

export async function getDiscordAccountByUserId(userId: string): Promise<DiscordUserRecord | null> {
  const result = await db.query<DiscordUserRecord>(
    `
      SELECT id, user_id, discord_id, username, avatar_url, email, locale, profile, created_at, updated_at
      FROM users_discord
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function hasDiscordAccount(userId: string): Promise<boolean> {
  const result = await db.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM users_discord
        WHERE user_id = $1
      ) as exists
    `,
    [userId]
  );
  return result.rows[0]?.exists ?? false;
}

export async function createUser(params: {
  pseudo: string;
  email: string;
  passwordHash: string;
  language?: string;
}): Promise<DbUser> {
  const result = await db.query<DbUser>(
    `
      INSERT INTO users (pseudo, email, password_hash, language)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [params.pseudo, params.email, params.passwordHash, params.language || "fr"]
  );

  return result.rows[0];
}

export async function createUserWithInternalNote(params: {
  pseudo: string;
  email: string;
  passwordHash: string;
  language?: string;
  internalNote: string;
}): Promise<DbUser> {
  const result = await db.query<DbUser>(
    `
      INSERT INTO users (pseudo, email, password_hash, language, internal_note)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [params.pseudo, params.email, params.passwordHash, params.language || "fr", params.internalNote]
  );

  return result.rows[0];
}

export async function createUserFromDiscord(params: {
  pseudo: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  language?: string;
  discordId: string;
  discordUsername: string;
  discordAvatarUrl?: string | null;
  discordEmail?: string | null;
  discordLocale?: string | null;
  discordProfile: unknown;
}): Promise<DbUser> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const userResult = await client.query<DbUser>(
      `
        INSERT INTO users (pseudo, email, password_hash, avatar_url, email_verified, language)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        params.pseudo,
        params.email,
        params.passwordHash,
        params.avatarUrl ?? null,
        params.emailVerified ?? false,
        params.language || "fr"
      ]
    );

    const user = userResult.rows[0];

    await client.query(
      `
        INSERT INTO users_discord (user_id, discord_id, username, avatar_url, email, locale, profile)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        user.id,
        params.discordId,
        params.discordUsername,
        params.discordAvatarUrl ?? null,
        params.discordEmail ?? null,
        params.discordLocale ?? null,
        params.discordProfile
      ]
    );

    await client.query("COMMIT");
    return user;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateDiscordUserRecord(params: {
  userId: string;
  discordId: string;
  discordUsername: string;
  discordAvatarUrl?: string | null;
  discordEmail?: string | null;
  discordLocale?: string | null;
  discordProfile: unknown;
}): Promise<void> {
  await db.query(
    `
      INSERT INTO users_discord (user_id, discord_id, username, avatar_url, email, locale, profile)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (discord_id)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        username = EXCLUDED.username,
        avatar_url = EXCLUDED.avatar_url,
        email = EXCLUDED.email,
        locale = EXCLUDED.locale,
        profile = EXCLUDED.profile,
        updated_at = NOW()
    `,
    [
      params.userId,
      params.discordId,
      params.discordUsername,
      params.discordAvatarUrl ?? null,
      params.discordEmail ?? null,
      params.discordLocale ?? null,
      params.discordProfile
    ]
  );
}

export async function updateUserAvatarIfMissing(userId: string, avatarUrl?: string | null): Promise<void> {
  if (!avatarUrl) return;
  await db.query(
    `
      UPDATE users
      SET avatar_url = COALESCE(avatar_url, $2),
          updated_at = NOW()
      WHERE id = $1
    `,
    [userId, avatarUrl]
  );
}

export async function updateProfile(
  userId: string,
  input: {
    pseudo: string;
    bio: string;
    language?: string;
    avatarUrl?: string;
    discordUrl?: string;
    xUrl?: string;
    blueskyUrl?: string;
    stoatUrl?: string;
    youtubeUrl?: string;
    twitchUrl?: string;
    kickUrl?: string;
    snapchatUrl?: string;
    tiktokUrl?: string;
  }
): Promise<void> {
  await ensureUserPseudoCooldownSchema();
  const values = [
    userId,
    input.pseudo,
    input.bio,
    input.language,
    input.avatarUrl ?? null,
    input.discordUrl ?? null,
    input.xUrl ?? null,
    input.blueskyUrl ?? null,
    input.stoatUrl ?? null,
    input.youtubeUrl ?? null,
    input.twitchUrl ?? null,
    input.kickUrl ?? null,
    input.snapchatUrl ?? null,
    input.tiktokUrl ?? null
  ];

  if (pseudoCooldownSchemaAvailable) {
    try {
      await db.query(
        `
          UPDATE users
          SET pseudo = $2,
              pseudo_last_changed_at = CASE
                WHEN $2 IS DISTINCT FROM pseudo THEN NOW()
                ELSE pseudo_last_changed_at
              END,
              bio = $3,
              language = COALESCE($4, language),
              avatar_url = $5,
              discord_url = $6,
              x_url = $7,
              bluesky_url = $8,
              stoat_url = $9,
              youtube_url = $10,
              twitch_url = $11,
              kick_url = $12,
              snapchat_url = $13,
              tiktok_url = $14,
              updated_at = NOW()
          WHERE id = $1
        `,
        values
      );
      return;
    } catch (error) {
      if (getPgErrorCode(error) !== "42703") {
        throw error;
      }
      pseudoCooldownSchemaAvailable = false;
    }
  }

  await db.query(
    `
      UPDATE users
      SET pseudo = $2,
          bio = $3,
          language = COALESCE($4, language),
          avatar_url = $5,
          discord_url = $6,
          x_url = $7,
          bluesky_url = $8,
          stoat_url = $9,
          youtube_url = $10,
          twitch_url = $11,
          kick_url = $12,
          snapchat_url = $13,
          tiktok_url = $14,
          updated_at = NOW()
      WHERE id = $1
    `,
    values
  );
}

import { PaginatedResult } from "../types/pagination.js";

export async function listUsers(page: number = 1, limit: number = 20): Promise<PaginatedResult<AdminUserRecord>> {
  const offset = (page - 1) * limit;

  const countResult = await db.query<{ count: string }>("SELECT COUNT(*) as count FROM users");
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await db.query<
    Omit<AdminUserRecord, "badges"> & {
      badges: unknown;
    }
  >(
    `
      SELECT
        u.id,
        u.pseudo,
        u.email,
        u.bio,
        u.internal_note,
        u.avatar_url,
        u.role,
        u.created_at,
        u.email_verified,
        u.two_factor_enabled,
        u.language,
        u.balance_cents,
        u.last_balance_update,
        COALESCE(
          json_agg(
            json_build_object(
              'id', b.id,
              'slug', b.slug,
              'label', b.label,
              'image_url', b.image_url
            )
            ORDER BY ${BADGE_DISPLAY_ORDER_SQL_WITH_ALIAS}, b.label ASC
          ) FILTER (WHERE b.id IS NOT NULL),
          '[]'::json
        ) AS badges
      FROM users u
      LEFT JOIN user_badges ub ON ub.user_id = u.id
      LEFT JOIN badges b ON b.id = ub.badge_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  return {
    data: result.rows.map((row) => ({
      ...row,
      badges: Array.isArray(row.badges) ? (row.badges as UserBadge[]) : []
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getAdminUserById(id: string): Promise<AdminUserRecord | null> {
  const result = await db.query<
    Omit<AdminUserRecord, "badges"> & {
      badges: unknown;
    }
  >(
    `
      SELECT
        u.id,
        u.pseudo,
        u.email,
        u.bio,
        u.internal_note,
        u.avatar_url,
        u.role,
        u.created_at,
        u.email_verified,
        u.two_factor_enabled,
        u.language,
        u.balance_cents,
        u.last_balance_update,
        COALESCE(
          json_agg(
            json_build_object(
              'id', b.id,
              'slug', b.slug,
              'label', b.label,
              'image_url', b.image_url
            )
            ORDER BY ${BADGE_DISPLAY_ORDER_SQL_WITH_ALIAS}, b.label ASC
          ) FILTER (WHERE b.id IS NOT NULL),
          '[]'::json
        ) AS badges
      FROM users u
      LEFT JOIN user_badges ub ON ub.user_id = u.id
      LEFT JOIN badges b ON b.id = ub.badge_id
      WHERE u.id = $1
      GROUP BY u.id
    `,
    [id]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    ...row,
    badges: Array.isArray(row.badges) ? (row.badges as UserBadge[]) : []
  };
}

export async function listUserIdsByInternalNote(note: string, limit: number = 200): Promise<string[]> {
  const result = await db.query<{ id: string }>(
    `
      SELECT id
      FROM users
      WHERE internal_note = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [note, limit]
  );
  return result.rows.map((row) => row.id);
}

export async function updateLastLogin(userId: string): Promise<void> {
  await db.query("UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [userId]);
}

export async function updateUserAsAdmin(
  userId: string,
  input: {
    pseudo: string;
    email: string;
    bio: string;
    internalNote: string;
    role: "user" | "admin";
  }
): Promise<void> {
  await db.query(
    `
      UPDATE users
      SET pseudo = $2,
          email = $3,
          bio = $4,
          internal_note = $5,
          role = $6,
          updated_at = NOW()
      WHERE id = $1
    `,
    [userId, input.pseudo, input.email, input.bio, input.internalNote, input.role]
  );
}

export async function creditUserBalance(userId: string, amountCents: number): Promise<number> {
  const result = await db.query<{ balance_cents: number }>(
    `
      UPDATE users
      SET balance_cents = balance_cents + $2,
          last_balance_update = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING balance_cents
    `,
    [userId, amountCents]
  );
  return result.rows[0]?.balance_cents ?? 0;
}

export async function debitUserBalanceIfEnough(userId: string, amountCents: number): Promise<{ ok: boolean; balance: number }> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{ balance_cents: number }>(
      `
        SELECT balance_cents
        FROM users
        WHERE id = $1
        FOR UPDATE
      `,
      [userId]
    );
    const balance = result.rows[0]?.balance_cents ?? 0;
    if (balance < amountCents) {
      await client.query("ROLLBACK");
      return { ok: false, balance };
    }
    const updated = await client.query<{ balance_cents: number }>(
      `
        UPDATE users
        SET balance_cents = balance_cents - $2,
            last_balance_update = NOW(),
            updated_at = NOW()
        WHERE id = $1
        RETURNING balance_cents
      `,
      [userId, amountCents]
    );
    await client.query("COMMIT");
    return { ok: true, balance: updated.rows[0]?.balance_cents ?? balance - amountCents };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listAvailableBadges(): Promise<UserBadge[]> {
  const result = await db.query<UserBadge>(
    `
      SELECT id, slug, label, image_url
      FROM badges
      ORDER BY ${BADGE_DISPLAY_ORDER_SQL}, label ASC
    `
  );
  return result.rows;
}

export async function listBadgesByUserId(userId: string): Promise<UserBadge[]> {
  const result = await db.query<UserBadge>(
    `
      SELECT b.id, b.slug, b.label, b.image_url
      FROM user_badges ub
      JOIN badges b ON b.id = ub.badge_id
      WHERE ub.user_id = $1
      ORDER BY ${BADGE_DISPLAY_ORDER_SQL_WITH_ALIAS}, b.label ASC
    `,
    [userId]
  );
  return result.rows;
}

export async function setUserBadgesAsAdmin(userId: string, badgeIds: string[]): Promise<void> {
  await db.query("BEGIN");
  try {
    await db.query("DELETE FROM user_badges WHERE user_id = $1", [userId]);

    if (badgeIds.length > 0) {
      await db.query(
        `
          INSERT INTO user_badges (user_id, badge_id)
          SELECT $1, b.id
          FROM badges b
          WHERE b.id = ANY($2::uuid[])
        `,
        [userId, badgeIds]
      );
    }

    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  await db.query("DELETE FROM users WHERE id = $1", [userId]);
}

export async function deleteUsersByInternalNote(note: string): Promise<number> {
  const result = await db.query("DELETE FROM users WHERE internal_note = $1", [note]);
  return result.rowCount ?? 0;
}

export async function isUserAmongFirst100(userId: string): Promise<boolean> {
  const result = await db.query<{ rank: number }>(
    `
      SELECT COUNT(*) as rank
      FROM users
      WHERE created_at <= (SELECT created_at FROM users WHERE id = $1)
    `,
    [userId]
  );
  
  return (result.rows[0]?.rank ?? 0) <= 100;
}

export async function getBadgeIdBySlug(slug: string): Promise<string | null> {
  const result = await db.query<{ id: string }>(
    "SELECT id FROM badges WHERE slug = $1 LIMIT 1",
    [slug]
  );
  
  return result.rows[0]?.id ?? null;
}

export async function assignBadgeToUser(userId: string, badgeId: string): Promise<void> {
  await db.query(
    `
      INSERT INTO user_badges (user_id, badge_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, badge_id) DO NOTHING
    `,
    [userId, badgeId]
  );
}
