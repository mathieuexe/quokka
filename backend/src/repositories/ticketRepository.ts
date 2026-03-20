import { db } from "../config/db.js";

export type TicketRecord = {
  id: string;
  reference: string;
  user_id: string;
  user_pseudo: string;
  user_avatar_url: string | null;
  assigned_admin_id: string | null;
  assigned_admin_pseudo: string | null;
  status: string;
  priority: number;
  category: string;
  subcategory: string | null;
  server_id: string | null;
  server_name: string | null;
  subscription_id: string | null;
  server_url: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
};

export type TicketMessageRecord = {
  id: string;
  ticket_id: string;
  user_id: string | null;
  admin_user_id: string | null;
  author_role: "user" | "admin";
  message: string;
  attachments: string[];
  created_at: string;
  user_pseudo: string | null;
  user_avatar_url: string | null;
  admin_pseudo: string | null;
  admin_avatar_url: string | null;
};

export type AdminTicketFilters = {
  status?: string;
  adminUserId?: string;
  userId?: string;
  from?: string;
  to?: string;
  priority?: number;
  search?: string;
};

export async function listUserTickets(userId: string, page: number = 1, limit: number = 20): Promise<PaginatedResult<TicketRecord>> {
  const offset = (page - 1) * limit;

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM tickets WHERE user_id = $1`,
    [userId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await db.query<TicketRecord>(
    `
      SELECT
        t.id,
        t.reference,
        t.user_id,
        u.pseudo AS user_pseudo,
        u.avatar_url AS user_avatar_url,
        t.assigned_admin_id,
        admin.pseudo AS assigned_admin_pseudo,
        t.status,
        t.priority,
        t.category,
        t.subcategory,
        t.server_id,
        s.name AS server_name,
        t.subscription_id,
        t.server_url,
        t.created_at,
        t.updated_at,
        t.last_message_at
      FROM tickets t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN users admin ON admin.id = t.assigned_admin_id
      LEFT JOIN servers s ON s.id = t.server_id
      WHERE t.user_id = $1
      ORDER BY t.last_message_at DESC
      LIMIT $2 OFFSET $3
    `,
    [userId, limit, offset]
  );

  return {
    data: result.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

import { PaginatedResult } from "../types/pagination.js";

export async function listAdminTickets(filters: AdminTicketFilters, page: number = 1, limit: number = 20): Promise<PaginatedResult<TicketRecord>> {
  const offset = (page - 1) * limit;
  const values: Array<string | number> = [];
  const conditions: string[] = [];

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`t.status = $${values.length}`);
  }
  if (filters.adminUserId) {
    if (filters.adminUserId === "none") {
      conditions.push("t.assigned_admin_id IS NULL");
    } else {
      values.push(filters.adminUserId);
      conditions.push(`t.assigned_admin_id = $${values.length}`);
    }
  }
  if (filters.userId) {
    values.push(filters.userId);
    conditions.push(`t.user_id = $${values.length}`);
  }
  if (filters.priority !== undefined) {
    values.push(filters.priority);
    conditions.push(`t.priority = $${values.length}`);
  }
  if (filters.from) {
    values.push(filters.from);
    conditions.push(`t.created_at >= $${values.length}`);
  }
  if (filters.to) {
    values.push(filters.to);
    conditions.push(`t.created_at <= $${values.length}`);
  }
  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`(t.reference ILIKE $${values.length} OR u.pseudo ILIKE $${values.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countValues = [...values];
  const countResult = await db.query<{ count: string }>(
    `
      SELECT COUNT(*) as count
      FROM tickets t
      JOIN users u ON u.id = t.user_id
      ${whereClause}
    `,
    countValues
  );
  const total = parseInt(countResult.rows[0].count, 10);

  values.push(limit);
  values.push(offset);

  const result = await db.query<TicketRecord>(
    `
      SELECT
        t.id,
        t.reference,
        t.user_id,
        u.pseudo AS user_pseudo,
        u.avatar_url AS user_avatar_url,
        t.assigned_admin_id,
        admin.pseudo AS assigned_admin_pseudo,
        t.status,
        t.priority,
        t.category,
        t.subcategory,
        t.server_id,
        s.name AS server_name,
        t.subscription_id,
        t.server_url,
        t.created_at,
        t.updated_at,
        t.last_message_at
      FROM tickets t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN users admin ON admin.id = t.assigned_admin_id
      LEFT JOIN servers s ON s.id = t.server_id
      ${whereClause}
      ORDER BY t.last_message_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `,
    values
  );

  return {
    data: result.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getTicketById(ticketId: string): Promise<TicketRecord | null> {
  const result = await db.query<TicketRecord>(
    `
      SELECT
        t.id,
        t.reference,
        t.user_id,
        u.pseudo AS user_pseudo,
        u.avatar_url AS user_avatar_url,
        t.assigned_admin_id,
        admin.pseudo AS assigned_admin_pseudo,
        t.status,
        t.priority,
        t.category,
        t.subcategory,
        t.server_id,
        s.name AS server_name,
        t.subscription_id,
        t.server_url,
        t.created_at,
        t.updated_at,
        t.last_message_at
      FROM tickets t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN users admin ON admin.id = t.assigned_admin_id
      LEFT JOIN servers s ON s.id = t.server_id
      WHERE t.id = $1
      LIMIT 1
    `,
    [ticketId]
  );
  return result.rows[0] ?? null;
}

export async function getTicketMessages(ticketId: string): Promise<TicketMessageRecord[]> {
  const result = await db.query<TicketMessageRecord>(
    `
      SELECT
        m.id,
        m.ticket_id,
        m.user_id,
        m.admin_user_id,
        m.author_role,
        m.message,
        m.attachments,
        m.created_at,
        u.pseudo AS user_pseudo,
        u.avatar_url AS user_avatar_url,
        admin.pseudo AS admin_pseudo,
        admin.avatar_url AS admin_avatar_url
      FROM ticket_messages m
      LEFT JOIN users u ON u.id = m.user_id
      LEFT JOIN users admin ON admin.id = m.admin_user_id
      WHERE m.ticket_id = $1
      ORDER BY m.created_at ASC
    `,
    [ticketId]
  );
  return result.rows.map((row) => ({
    ...row,
    attachments: Array.isArray(row.attachments) ? row.attachments : []
  }));
}

export async function createTicketWithMessage(input: {
  reference: string;
  userId: string;
  status: string;
  priority: number;
  category: string;
  subcategory?: string | null;
  serverId?: string | null;
  subscriptionId?: string | null;
  serverUrl?: string | null;
  message: string;
  attachments: string[];
}): Promise<{ ticket: TicketRecord; message: TicketMessageRecord }> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const ticketResult = await client.query<TicketRecord>(
      `
        INSERT INTO tickets (reference, user_id, status, priority, category, subcategory, server_id, subscription_id, server_url, last_message_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING
          id,
          reference,
          user_id,
          $10::text AS user_pseudo,
          $11::text AS user_avatar_url,
          assigned_admin_id,
          NULL::text AS assigned_admin_pseudo,
          status,
          priority,
          category,
          subcategory,
          server_id,
          NULL::text AS server_name,
          subscription_id,
          server_url,
          created_at,
          updated_at,
          last_message_at
      `,
      [
        input.reference,
        input.userId,
        input.status,
        input.priority,
        input.category,
        input.subcategory ?? null,
        input.serverId ?? null,
        input.subscriptionId ?? null,
        input.serverUrl ?? null,
        "",
        null
      ]
    );
    const ticketRow = ticketResult.rows[0];

    const messageResult = await client.query<TicketMessageRecord>(
      `
        INSERT INTO ticket_messages (ticket_id, user_id, author_role, message, attachments)
        VALUES ($1, $2, 'user', $3, $4)
        RETURNING
          id,
          ticket_id,
          user_id,
          admin_user_id,
          author_role,
          message,
          attachments,
          created_at,
          $5::text AS user_pseudo,
          $6::text AS user_avatar_url,
          NULL::text AS admin_pseudo,
          NULL::text AS admin_avatar_url
      `,
      [ticketRow.id, input.userId, input.message, JSON.stringify(input.attachments), "", null]
    );

    await client.query("COMMIT");

    return {
      ticket: ticketRow,
      message: {
        ...messageResult.rows[0],
        attachments: input.attachments,
        user_pseudo: null,
        user_avatar_url: null,
        admin_pseudo: null,
        admin_avatar_url: null
      }
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createTicketWithAdminMessage(input: {
  reference: string;
  userId: string;
  adminUserId: string;
  status: string;
  priority: number;
  category: string;
  subcategory?: string | null;
  serverId?: string | null;
  subscriptionId?: string | null;
  serverUrl?: string | null;
  message: string;
  attachments: string[];
}): Promise<{ ticket: TicketRecord; message: TicketMessageRecord }> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const ticketResult = await client.query<TicketRecord>(
      `
        INSERT INTO tickets (
          reference,
          user_id,
          assigned_admin_id,
          status,
          priority,
          category,
          subcategory,
          server_id,
          subscription_id,
          server_url,
          last_message_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING
          id,
          reference,
          user_id,
          $11::text AS user_pseudo,
          $12::text AS user_avatar_url,
          assigned_admin_id,
          NULL::text AS assigned_admin_pseudo,
          status,
          priority,
          category,
          subcategory,
          server_id,
          NULL::text AS server_name,
          subscription_id,
          server_url,
          created_at,
          updated_at,
          last_message_at
      `,
      [
        input.reference,
        input.userId,
        input.adminUserId,
        input.status,
        input.priority,
        input.category,
        input.subcategory ?? null,
        input.serverId ?? null,
        input.subscriptionId ?? null,
        input.serverUrl ?? null,
        "",
        null
      ]
    );
    const ticketRow = ticketResult.rows[0];

    const messageResult = await client.query<TicketMessageRecord>(
      `
        INSERT INTO ticket_messages (ticket_id, admin_user_id, author_role, message, attachments)
        VALUES ($1, $2, 'admin', $3, $4)
        RETURNING
          id,
          ticket_id,
          user_id,
          admin_user_id,
          author_role,
          message,
          attachments,
          created_at,
          NULL::text AS user_pseudo,
          NULL::text AS user_avatar_url,
          NULL::text AS admin_pseudo,
          NULL::text AS admin_avatar_url
      `,
      [ticketRow.id, input.adminUserId, input.message, JSON.stringify(input.attachments)]
    );

    await client.query("COMMIT");

    return {
      ticket: ticketRow,
      message: {
        ...messageResult.rows[0],
        attachments: input.attachments,
        user_pseudo: null,
        user_avatar_url: null,
        admin_pseudo: null,
        admin_avatar_url: null
      }
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createTicketMessage(input: {
  ticketId: string;
  userId?: string | null;
  adminUserId?: string | null;
  authorRole: "user" | "admin";
  message: string;
  attachments: string[];
  nextStatus?: string | null;
}): Promise<TicketMessageRecord> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const messageResult = await client.query<TicketMessageRecord>(
      `
        INSERT INTO ticket_messages (ticket_id, user_id, admin_user_id, author_role, message, attachments)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          ticket_id,
          user_id,
          admin_user_id,
          author_role,
          message,
          attachments,
          created_at,
          NULL::text AS user_pseudo,
          NULL::text AS user_avatar_url,
          NULL::text AS admin_pseudo,
          NULL::text AS admin_avatar_url
      `,
      [input.ticketId, input.userId ?? null, input.adminUserId ?? null, input.authorRole, input.message, JSON.stringify(input.attachments)]
    );

    if (input.nextStatus) {
      await client.query(
        `
          UPDATE tickets
          SET status = $2,
              last_message_at = NOW(),
              updated_at = NOW()
          WHERE id = $1
        `,
        [input.ticketId, input.nextStatus]
      );
    } else {
      await client.query(
        `
          UPDATE tickets
          SET last_message_at = NOW(),
              updated_at = NOW()
          WHERE id = $1
        `,
        [input.ticketId]
      );
    }

    await client.query("COMMIT");

    return {
      ...messageResult.rows[0],
      attachments: input.attachments,
      user_pseudo: null,
      user_avatar_url: null,
      admin_pseudo: null,
      admin_avatar_url: null
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateTicket(input: {
  ticketId: string;
  status?: string | null;
  assignedAdminId?: string | null;
  category?: string | null;
  subcategory?: string | null;
  priority?: number | null;
}): Promise<void> {
  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  if (input.status !== undefined) {
    values.push(input.status);
    fields.push(`status = $${values.length}`);
  }
  if (input.assignedAdminId !== undefined) {
    values.push(input.assignedAdminId);
    fields.push(`assigned_admin_id = $${values.length}`);
  }
  if (input.category !== undefined) {
    values.push(input.category);
    fields.push(`category = $${values.length}`);
  }
  if (input.subcategory !== undefined) {
    values.push(input.subcategory);
    fields.push(`subcategory = $${values.length}`);
  }
  if (input.priority !== undefined) {
    values.push(input.priority);
    fields.push(`priority = $${values.length}`);
  }

  if (!fields.length) return;

  values.push(input.ticketId);
  await db.query(
    `
      UPDATE tickets
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE id = $${values.length}
    `,
    values
  );
}
