import { db } from "../config/db.js";
export async function createCertificationRequest(input) {
    const result = await db.query(`
      INSERT INTO server_certification_requests (
        server_id, user_id, presentation, social_links, attachments
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
        input.serverId,
        input.userId,
        input.presentation,
        input.socialLinks ?? null,
        JSON.stringify(input.attachments ?? [])
    ]);
    return result.rows[0];
}
export async function getLatestCertificationRequestByServer(serverId) {
    const result = await db.query(`
      SELECT *
      FROM server_certification_requests
      WHERE server_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [serverId]);
    return result.rows[0] ?? null;
}
export async function listCertificationRequests(status, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const params = [];
    let where = "";
    if (status) {
        params.push(status);
        where = "WHERE cr.status = $1";
    }
    const countParams = [...params];
    const countResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM server_certification_requests cr
      JOIN servers s ON s.id = cr.server_id
      JOIN users u ON u.id = cr.user_id
      ${where}
    `, countParams);
    const total = parseInt(countResult.rows[0].count, 10);
    params.push(limit);
    params.push(offset);
    const result = await db.query(`
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
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    return {
        data: result.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}
export async function getCertificationRequestById(id) {
    const result = await db.query(`
      SELECT 
        cr.*,
        s.name AS server_name,
        u.pseudo AS user_pseudo,
        u.avatar_url AS user_avatar_url
      FROM server_certification_requests cr
      JOIN servers s ON s.id = cr.server_id
      JOIN users u ON u.id = cr.user_id
      WHERE cr.id = $1
    `, [id]);
    return result.rows[0] ?? null;
}
export async function updateCertificationRequestStatus(id, status, rejectionReason) {
    await db.query(`
      UPDATE server_certification_requests
      SET status = $2,
          rejection_reason = $3,
          updated_at = NOW()
      WHERE id = $1
    `, [id, status, rejectionReason ?? null]);
}
