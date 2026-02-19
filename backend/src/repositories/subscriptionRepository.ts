import { db } from "../config/db.js";

export async function addSubscription(input: {
  serverId: string;
  type: "quokka_plus" | "essentiel";
  durationDays?: number;
  durationHours?: number;
  premiumSlot?: number;
}): Promise<{ startDate: Date; endDate: Date }> {
  const intervalValue =
    input.type === "essentiel"
      ? input.durationDays ?? 1
      : input.durationHours ?? (input.durationDays ? input.durationDays * 24 : 1);
  const startDate = new Date();
  const endDate =
    input.type === "essentiel"
      ? new Date(startDate.getTime() + intervalValue * 24 * 60 * 60 * 1000)
      : new Date(startDate.getTime() + intervalValue * 60 * 60 * 1000);

  await db.query(
    `
      INSERT INTO subscriptions (server_id, type, start_date, end_date, premium_slot)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [input.serverId, input.type, startDate.toISOString(), endDate.toISOString(), input.premiumSlot ?? null]
  );

  return { startDate, endDate };
}

export async function listUserSubscriptions(userId: string): Promise<
  Array<{
    id: string;
    server_id: string;
    server_name: string;
    type: "quokka_plus" | "essentiel";
    start_date: string;
    end_date: string;
    premium_slot: number | null;
  }>
> {
  const result = await db.query<{
    id: string;
    server_id: string;
    server_name: string;
    type: "quokka_plus" | "essentiel";
    start_date: string;
    end_date: string;
    premium_slot: number | null;
  }>(
    `
      SELECT
        sub.id,
        sub.server_id,
        s.name AS server_name,
        sub.type,
        sub.start_date,
        sub.end_date,
        sub.premium_slot
      FROM subscriptions sub
      JOIN servers s ON s.id = sub.server_id
      WHERE s.user_id = $1
      ORDER BY sub.end_date DESC
    `,
    [userId]
  );

  return result.rows;
}

export async function createSubscriptionRange(input: {
  serverId: string;
  type: "quokka_plus" | "essentiel";
  startDate: Date;
  endDate: Date;
}): Promise<void> {
  await db.query(
    `
      INSERT INTO subscriptions (server_id, type, start_date, end_date)
      VALUES ($1, $2, $3, $4)
    `,
    [input.serverId, input.type, input.startDate.toISOString(), input.endDate.toISOString()]
  );
}

export async function listAllSubscriptions(): Promise<
  Array<{
    id: string;
    server_id: string;
    server_name: string;
    owner_pseudo: string;
    type: "quokka_plus" | "essentiel";
    start_date: string;
    end_date: string;
    premium_slot: number | null;
  }>
> {
  const result = await db.query<{
    id: string;
    server_id: string;
    server_name: string;
    owner_pseudo: string;
    type: "quokka_plus" | "essentiel";
    start_date: string;
    end_date: string;
    premium_slot: number | null;
  }>(
    `
      SELECT
        sub.id,
        sub.server_id,
        s.name AS server_name,
        u.pseudo AS owner_pseudo,
        sub.type,
        sub.start_date,
        sub.end_date,
        sub.premium_slot
      FROM subscriptions sub
      JOIN servers s ON s.id = sub.server_id
      JOIN users u ON u.id = s.user_id
      ORDER BY sub.created_at DESC
    `
  );

  return result.rows;
}

export async function deleteSubscription(subscriptionId: string): Promise<void> {
  await db.query("DELETE FROM subscriptions WHERE id = $1", [subscriptionId]);
}
