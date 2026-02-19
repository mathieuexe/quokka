import { db } from "../config/db.js";

export type ServerRecord = {
  id: string;
  reference_number: number;
  user_id: string;
  user_pseudo: string;
  user_avatar_url: string | null;
  category_id: string;
  category_slug: string;
  category_label: string;
  category_image_url: string | null;
  name: string;
  description: string;
  website: string | null;
  country_code: string;
  ip: string | null;
  port: number | null;
  invite_link: string | null;
  banner_url: string | null;
  verified: boolean;
  is_public: boolean;
  is_hidden: boolean;
  is_visible: boolean;
  created_at: string;
  premium_type: "quokka_plus" | "essentiel" | null;
  premium_end_date: string | null;
  views: number;
  likes: number;
  visits: number;
  clicks: number;
};

const BASE_SERVER_QUERY = `
  WITH server_refs AS (
    SELECT
      s0.id,
      COALESCE((to_jsonb(s0)->>'reference_number')::int, ROW_NUMBER() OVER (ORDER BY s0.created_at ASC, s0.id ASC)) AS reference_number
    FROM servers s0
  )
  SELECT
    s.id,
    sr.reference_number,
    s.user_id,
    u.pseudo AS user_pseudo,
    u.avatar_url AS user_avatar_url,
    s.category_id,
    c.slug AS category_slug,
    c.label AS category_label,
    c.image_url AS category_image_url,
    s.name,
    s.description,
    s.website,
    s.country_code,
    s.ip,
    s.port,
    s.invite_link,
    s.banner_url,
    s.verified,
    s.is_public,
    s.is_hidden,
    s.is_visible,
    s.created_at,
    sub.type AS premium_type,
    sub.end_date AS premium_end_date,
    st.views,
    st.likes,
    st.visits,
    st.clicks
  FROM servers s
  JOIN server_refs sr ON sr.id = s.id
  JOIN users u ON u.id = s.user_id
  JOIN categories c ON c.id = s.category_id
  LEFT JOIN LATERAL (
    SELECT type, end_date
    FROM subscriptions
    WHERE server_id = s.id
      AND end_date > NOW()
    ORDER BY end_date DESC
    LIMIT 1
  ) sub ON true
  LEFT JOIN stats st ON st.server_id = s.id
`;

export async function listServersByPriority(search?: string): Promise<ServerRecord[]> {
  const params: unknown[] = [];
  const clauses = ["s.is_visible = true"];
  if (search?.trim()) {
    params.push(`%${search.trim()}%`);
    clauses.push(`s.name ILIKE $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const result = await db.query<ServerRecord>(
    `
      ${BASE_SERVER_QUERY}
      ${where}
      ORDER BY
        CASE
          WHEN sub.type = 'quokka_plus' THEN 1
          WHEN sub.type = 'essentiel' THEN 2
          ELSE 3
        END ASC,
        COALESCE(st.likes, 0) DESC,
        COALESCE(st.views, 0) DESC,
        COALESCE(st.visits, 0) DESC,
        s.created_at DESC
    `,
    params
  );

  return result.rows;
}

export async function listServersByUser(userId: string): Promise<ServerRecord[]> {
  const result = await db.query<ServerRecord>(
    `
      ${BASE_SERVER_QUERY}
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
    `,
    [userId]
  );
  return result.rows;
}

export async function listPublicServersByUser(userId: string): Promise<ServerRecord[]> {
  const result = await db.query<ServerRecord>(
    `
      ${BASE_SERVER_QUERY}
      WHERE s.user_id = $1
        AND s.is_public = true
        AND s.is_visible = true
      ORDER BY
        CASE
          WHEN sub.type = 'quokka_plus' THEN 1
          WHEN sub.type = 'essentiel' THEN 2
          ELSE 3
        END ASC,
        COALESCE(st.likes, 0) DESC,
        COALESCE(st.views, 0) DESC,
        COALESCE(st.visits, 0) DESC,
        s.created_at DESC
    `,
    [userId]
  );
  return result.rows;
}

export async function getServerById(id: string): Promise<ServerRecord | null> {
  const result = await db.query<ServerRecord>(
    `
      ${BASE_SERVER_QUERY}
      WHERE s.id = $1
      LIMIT 1
    `,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function createServer(input: {
  userId: string;
  categoryId: string;
  name: string;
  description: string;
  website?: string;
  countryCode: string;
  ip?: string;
  port?: number;
  inviteLink?: string;
  bannerUrl?: string;
  isPublic: boolean;
}): Promise<{ id: string }> {
  const result = await db.query<{ id: string }>(
    `
      INSERT INTO servers (
        user_id, category_id, name, description, website,
        country_code, ip, port, invite_link, banner_url, is_public
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `,
    [
      input.userId,
      input.categoryId,
      input.name,
      input.description,
      input.website ?? null,
      input.countryCode,
      input.ip ?? null,
      input.port ?? null,
      input.inviteLink ?? null,
      input.bannerUrl ?? null,
      input.isPublic
    ]
  );

  const serverId = result.rows[0].id;
  await db.query("INSERT INTO stats (server_id) VALUES ($1) ON CONFLICT (server_id) DO NOTHING", [serverId]);
  return { id: serverId };
}

export async function listCategories(): Promise<Array<{ id: string; slug: string; label: string; image_url: string }>> {
  const result = await db.query<{ id: string; slug: string; label: string; image_url: string }>(
    "SELECT id, slug, label, image_url FROM categories ORDER BY label ASC"
  );
  return result.rows;
}

export async function increaseView(serverId: string, userId?: string): Promise<void> {
  if (!userId) {
    await db.query(
      `
        UPDATE stats
        SET views = views + 1, updated_at = NOW()
        WHERE server_id = $1
      `,
      [serverId]
    );
    return;
  }

  const inserted = await db.query<{ id: string }>(
    `
      INSERT INTO server_views (server_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (server_id, user_id) DO NOTHING
      RETURNING id
    `,
    [serverId, userId]
  );

  if (!inserted.rows[0]) {
    return;
  }

  await db.query(
    `
      UPDATE stats
      SET views = views + 1, updated_at = NOW()
      WHERE server_id = $1
    `,
    [serverId]
  );
}

export async function setServerVisibility(serverId: string, isVisible: boolean): Promise<void> {
  await db.query("UPDATE servers SET is_visible = $2, updated_at = NOW() WHERE id = $1", [serverId, isVisible]);
}

export async function setServerHidden(serverId: string, isHidden: boolean): Promise<void> {
  await db.query("UPDATE servers SET is_hidden = $2, updated_at = NOW() WHERE id = $1", [serverId, isHidden]);
}

export async function getServerOwner(serverId: string): Promise<string | null> {
  const result = await db.query<{ user_id: string }>("SELECT user_id FROM servers WHERE id = $1 LIMIT 1", [serverId]);
  return result.rows[0]?.user_id ?? null;
}

export async function updateServer(
  serverId: string,
  input: {
    categoryId?: string;
    name: string;
    description: string;
    website?: string;
    countryCode: string;
    ip?: string;
    port?: number;
    inviteLink?: string;
    bannerUrl?: string;
    isPublic: boolean;
  }
): Promise<void> {
  await db.query(
    `
      UPDATE servers
      SET name = $2,
          description = $3,
          website = $4,
          country_code = $5,
          ip = $6,
          port = $7,
          invite_link = $8,
          banner_url = $9,
          is_public = $10,
          category_id = COALESCE($11, category_id),
          updated_at = NOW()
      WHERE id = $1
    `,
    [
      serverId,
      input.name,
      input.description,
      input.website ?? null,
      input.countryCode,
      input.ip ?? null,
      input.port ?? null,
      input.inviteLink ?? null,
      input.bannerUrl ?? null,
      input.isPublic,
      input.categoryId ?? null
    ]
  );
}

export async function deleteServer(serverId: string): Promise<void> {
  await db.query("DELETE FROM servers WHERE id = $1", [serverId]);
}

export async function updateServerAsAdmin(
  serverId: string,
  input: {
    categoryId: string;
    name: string;
    description: string;
    website?: string;
    countryCode: string;
    ip?: string;
    port?: number;
    inviteLink?: string;
    bannerUrl?: string;
    isPublic: boolean;
    isHidden: boolean;
    isVisible: boolean;
    verified: boolean;
  }
): Promise<void> {
  await db.query(
    `
      UPDATE servers
      SET category_id = $2,
          name = $3,
          description = $4,
          website = $5,
          country_code = $6,
          ip = $7,
          port = $8,
          invite_link = $9,
          banner_url = $10,
          is_public = $11,
          is_hidden = $12,
          is_visible = $13,
          verified = $14,
          updated_at = NOW()
      WHERE id = $1
    `,
    [
      serverId,
      input.categoryId,
      input.name,
      input.description,
      input.website ?? null,
      input.countryCode,
      input.ip ?? null,
      input.port ?? null,
      input.inviteLink ?? null,
      input.bannerUrl ?? null,
      input.isPublic,
      input.isHidden,
      input.isVisible,
      input.verified
    ]
  );
}
