import { db } from "../config/db.js";

export type ServerCertificationRequest = {
  id: string;
  server_id: string;
  user_id: string;
  presentation: string;
  social_links: string | null;
  attachments: string[];
  status: "pending" | "accepted" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  server_name?: string;
  user_pseudo?: string;
  user_avatar_url?: string | null;
};

export async function createCertificationRequest(input: {
  serverId: string;
  userId: string;
  presentation: string;
  socialLinks?: string;
  attachments?: string[];
}): Promise<{ id: string }> {
  const result = await db.query<{ id: string }>(
    `
      INSERT INTO server_certification_requests (
        server_id, user_id, presentation, social_links, attachments
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [
      input.serverId,
      input.userId,
      input.presentation,
      input.socialLinks ?? null,
      JSON.stringify(input.attachments ?? [])
    ]
  );
  return result.rows[0];
}

export async function getLatestCertificationRequestByServer(serverId: string): Promise<ServerCertificationRequest | null> {
  const result = await db.query<ServerCertificationRequest>(
    `
      SELECT *
      FROM server_certification_requests
      WHERE server_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [serverId]
  );
  return result.rows[0] ?? null;
}

export async function listCertificationRequests(status?: string): Promise<ServerCertificationRequest[]> {
  const params: unknown[] = [];
  let where = "";

  if (status) {
    params.push(status);
    where = "WHERE cr.status = $1";
  }

  const result = await db.query<ServerCertificationRequest>(
    `
      SELECT 
        cr.*,
        s.name AS server_name,
        u.pseudo AS user_pseudo,
        u.avatar_url AS user_avatar_url
      FROM server_certification_requests cr
      JOIN servers s ON s.id = cr.server_id
      JOIN users u ON u.id = cr.user_id
      ${where}
      ORDER BY cr.created_at DESC
    `,
    params
  );
  return result.rows;
}

export async function getCertificationRequestById(id: string): Promise<ServerCertificationRequest | null> {
  const result = await db.query<ServerCertificationRequest>(
    `
      SELECT 
        cr.*,
        s.name AS server_name,
        u.pseudo AS user_pseudo,
        u.avatar_url AS user_avatar_url
      FROM server_certification_requests cr
      JOIN servers s ON s.id = cr.server_id
      JOIN users u ON u.id = cr.user_id
      WHERE cr.id = $1
    `,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function updateCertificationRequestStatus(
  id: string,
  status: "accepted" | "rejected",
  rejectionReason?: string
): Promise<void> {
  await db.query(
    `
      UPDATE server_certification_requests
      SET status = $2,
          rejection_reason = $3,
          updated_at = NOW()
      WHERE id = $1
    `,
    [id, status, rejectionReason ?? null]
  );
}
