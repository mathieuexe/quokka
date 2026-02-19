import { db } from "../config/db.js";
import { randomUUID } from "node:crypto";
import { generateOrderReference } from "../utils/references.js";

function isMissingRelationError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "42P01";
}

export type StripePaymentPromoMeta = {
  base_amount_cents: number;
  promo_code: string | null;
  promo_discount_type: "fixed" | "percent" | "free" | null;
  promo_discount_value: number | null;
};

export async function upsertStripePaymentPromoMeta(input: {
  checkoutSessionId: string;
  baseAmountCents: number;
  promoCode: string | null;
  promoDiscountType: "fixed" | "percent" | "free" | null;
  promoDiscountValue: number | null;
}): Promise<void> {
  try {
    await db.query(
      `
        INSERT INTO stripe_payment_promos (
          checkout_session_id,
          base_amount_cents,
          promo_code,
          promo_discount_type,
          promo_discount_value
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (checkout_session_id) DO UPDATE
        SET base_amount_cents = EXCLUDED.base_amount_cents,
            promo_code = EXCLUDED.promo_code,
            promo_discount_type = EXCLUDED.promo_discount_type,
            promo_discount_value = EXCLUDED.promo_discount_value
      `,
      [input.checkoutSessionId, input.baseAmountCents, input.promoCode, input.promoDiscountType, input.promoDiscountValue]
    );
  } catch (error) {
    if (isMissingRelationError(error)) return;
    throw error;
  }
}

export async function createPendingStripePayment(input: {
  checkoutSessionId: string;
  paymentIntentId: string | null;
  userId: string;
  serverId: string;
  subscriptionType: "quokka_plus" | "essentiel";
  plannedStartDate: Date | null;
  durationDays: number | null;
  durationHours: number | null;
  amountCents: number;
}): Promise<void> {
  await db.query(
    `
      INSERT INTO stripe_payments (
        checkout_session_id, payment_intent_id, user_id, server_id,
        subscription_type, planned_start_date, duration_days, duration_hours,
        amount_cents, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      ON CONFLICT (checkout_session_id) DO NOTHING
    `,
    [
      input.checkoutSessionId,
      input.paymentIntentId,
      input.userId,
      input.serverId,
      input.subscriptionType,
      input.plannedStartDate ? input.plannedStartDate.toISOString() : null,
      input.durationDays,
      input.durationHours,
      input.amountCents
    ]
  );
}

export async function listUserStripePayments(userId: string): Promise<
  Array<{
    id: string;
    order_reference: string;
    checkout_session_id: string;
    status: "pending" | "completed" | "failed";
    subscription_type: "quokka_plus" | "essentiel";
    amount_cents: number;
    duration_days: number | null;
    duration_hours: number | null;
    server_id: string;
    server_name: string;
    created_at: string;
    planned_start_date: string | null;
    promotion_start_date: string | null;
    promotion_end_date: string | null;
    effective_start_date: string | null;
    effective_end_date: string | null;
    is_offered_by_quokka: boolean;
    promo: StripePaymentPromoMeta | null;
  }>
> {
  const queryWithPromo = `
      SELECT
        p.id,
        p.checkout_session_id,
        p.status,
        p.subscription_type,
        p.amount_cents,
        p.duration_days,
        p.duration_hours,
        p.server_id,
        s.name AS server_name,
        p.created_at,
        p.planned_start_date,
        p.promotion_start_date,
        p.promotion_end_date,
        (p.checkout_session_id LIKE 'gift_%') AS is_offered_by_quokka,
        COALESCE(p.promotion_start_date, p.planned_start_date, p.created_at) AS effective_start_date,
        COALESCE(
          p.promotion_end_date,
          CASE
            WHEN p.subscription_type = 'essentiel' THEN COALESCE(p.planned_start_date, p.created_at) + (COALESCE(p.duration_days, 1) || ' days')::INTERVAL
            ELSE COALESCE(p.promotion_start_date, p.created_at) + (COALESCE(p.duration_hours, 1) || ' hours')::INTERVAL
          END
        ) AS effective_end_date,
        m.base_amount_cents,
        m.promo_code,
        m.promo_discount_type,
        m.promo_discount_value
      FROM stripe_payments p
      JOIN servers s ON s.id = p.server_id
      LEFT JOIN stripe_payment_promos m ON m.checkout_session_id = p.checkout_session_id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `;

  const queryWithoutPromo = `
      SELECT
        p.id,
        p.checkout_session_id,
        p.status,
        p.subscription_type,
        p.amount_cents,
        p.duration_days,
        p.duration_hours,
        p.server_id,
        s.name AS server_name,
        p.created_at,
        p.planned_start_date,
        p.promotion_start_date,
        p.promotion_end_date,
        (p.checkout_session_id LIKE 'gift_%') AS is_offered_by_quokka,
        COALESCE(p.promotion_start_date, p.planned_start_date, p.created_at) AS effective_start_date,
        COALESCE(
          p.promotion_end_date,
          CASE
            WHEN p.subscription_type = 'essentiel' THEN COALESCE(p.planned_start_date, p.created_at) + (COALESCE(p.duration_days, 1) || ' days')::INTERVAL
            ELSE COALESCE(p.promotion_start_date, p.created_at) + (COALESCE(p.duration_hours, 1) || ' hours')::INTERVAL
          END
        ) AS effective_end_date
      FROM stripe_payments p
      JOIN servers s ON s.id = p.server_id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `;

  type Row = {
    id: string;
    checkout_session_id: string;
    status: "pending" | "completed" | "failed";
    subscription_type: "quokka_plus" | "essentiel";
    amount_cents: number;
    duration_days: number | null;
    duration_hours: number | null;
    server_id: string;
    server_name: string;
    created_at: string;
    planned_start_date: string | null;
    promotion_start_date: string | null;
    promotion_end_date: string | null;
    effective_start_date: string | null;
    effective_end_date: string | null;
    is_offered_by_quokka: boolean;
    base_amount_cents?: number | null;
    promo_code?: string | null;
    promo_discount_type?: "fixed" | "percent" | "free" | null;
    promo_discount_value?: number | null;
  };

  let result: { rows: Row[] };
  try {
    result = await db.query<Row>(queryWithPromo, [userId]);
  } catch (error) {
    if (!isMissingRelationError(error)) throw error;
    result = await db.query<Row>(queryWithoutPromo, [userId]);
  }

  return result.rows.map((row) => ({
    ...row,
    promo:
      row.base_amount_cents !== undefined
        ? {
            base_amount_cents: row.base_amount_cents ?? row.amount_cents,
            promo_code: row.promo_code ?? null,
            promo_discount_type: row.promo_discount_type ?? null,
            promo_discount_value: row.promo_discount_value ?? null
          }
        : null,
    order_reference: generateOrderReference(row.id)
  }));
}

export async function getUserStripePaymentById(paymentId: string, userId: string): Promise<{
  id: string;
  order_reference: string;
  checkout_session_id: string;
  status: "pending" | "completed" | "failed";
  subscription_type: "quokka_plus" | "essentiel";
  amount_cents: number;
  duration_days: number | null;
  duration_hours: number | null;
  server_id: string;
  server_name: string;
  created_at: string;
  planned_start_date: string | null;
  promotion_start_date: string | null;
  promotion_end_date: string | null;
  effective_start_date: string | null;
  effective_end_date: string | null;
  is_offered_by_quokka: boolean;
  promo: StripePaymentPromoMeta | null;
} | null> {
  const queryWithPromo = `
      SELECT
        p.id,
        p.checkout_session_id,
        p.status,
        p.subscription_type,
        p.amount_cents,
        p.duration_days,
        p.duration_hours,
        p.server_id,
        s.name AS server_name,
        p.created_at,
        p.planned_start_date,
        p.promotion_start_date,
        p.promotion_end_date,
        (p.checkout_session_id LIKE 'gift_%') AS is_offered_by_quokka,
        COALESCE(p.promotion_start_date, p.planned_start_date, p.created_at) AS effective_start_date,
        COALESCE(
          p.promotion_end_date,
          CASE
            WHEN p.subscription_type = 'essentiel' THEN COALESCE(p.planned_start_date, p.created_at) + (COALESCE(p.duration_days, 1) || ' days')::INTERVAL
            ELSE COALESCE(p.promotion_start_date, p.created_at) + (COALESCE(p.duration_hours, 1) || ' hours')::INTERVAL
          END
        ) AS effective_end_date,
        m.base_amount_cents,
        m.promo_code,
        m.promo_discount_type,
        m.promo_discount_value
      FROM stripe_payments p
      JOIN servers s ON s.id = p.server_id
      LEFT JOIN stripe_payment_promos m ON m.checkout_session_id = p.checkout_session_id
      WHERE p.id = $1
        AND p.user_id = $2
      LIMIT 1
    `;

  const queryWithoutPromo = `
      SELECT
        p.id,
        p.checkout_session_id,
        p.status,
        p.subscription_type,
        p.amount_cents,
        p.duration_days,
        p.duration_hours,
        p.server_id,
        s.name AS server_name,
        p.created_at,
        p.planned_start_date,
        p.promotion_start_date,
        p.promotion_end_date,
        (p.checkout_session_id LIKE 'gift_%') AS is_offered_by_quokka,
        COALESCE(p.promotion_start_date, p.planned_start_date, p.created_at) AS effective_start_date,
        COALESCE(
          p.promotion_end_date,
          CASE
            WHEN p.subscription_type = 'essentiel' THEN COALESCE(p.planned_start_date, p.created_at) + (COALESCE(p.duration_days, 1) || ' days')::INTERVAL
            ELSE COALESCE(p.promotion_start_date, p.created_at) + (COALESCE(p.duration_hours, 1) || ' hours')::INTERVAL
          END
        ) AS effective_end_date
      FROM stripe_payments p
      JOIN servers s ON s.id = p.server_id
      WHERE p.id = $1
        AND p.user_id = $2
      LIMIT 1
    `;

  type Row = {
    id: string;
    checkout_session_id: string;
    status: "pending" | "completed" | "failed";
    subscription_type: "quokka_plus" | "essentiel";
    amount_cents: number;
    duration_days: number | null;
    duration_hours: number | null;
    server_id: string;
    server_name: string;
    created_at: string;
    planned_start_date: string | null;
    promotion_start_date: string | null;
    promotion_end_date: string | null;
    effective_start_date: string | null;
    effective_end_date: string | null;
    is_offered_by_quokka: boolean;
    base_amount_cents?: number | null;
    promo_code?: string | null;
    promo_discount_type?: "fixed" | "percent" | "free" | null;
    promo_discount_value?: number | null;
  };

  let result: { rows: Row[] };
  try {
    result = await db.query<Row>(queryWithPromo, [paymentId, userId]);
  } catch (error) {
    if (!isMissingRelationError(error)) throw error;
    result = await db.query<Row>(queryWithoutPromo, [paymentId, userId]);
  }

  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    promo:
      row.base_amount_cents !== undefined
        ? {
            base_amount_cents: row.base_amount_cents ?? row.amount_cents,
            promo_code: row.promo_code ?? null,
            promo_discount_type: row.promo_discount_type ?? null,
            promo_discount_value: row.promo_discount_value ?? null
          }
        : null,
    order_reference: generateOrderReference(row.id)
  };
}

export async function getUserStripePaymentByCheckoutSessionId(checkoutSessionId: string, userId: string): Promise<{
  id: string;
  order_reference: string;
  checkout_session_id: string;
  status: "pending" | "completed" | "failed";
  subscription_type: "quokka_plus" | "essentiel";
  amount_cents: number;
  server_id: string;
  server_name: string;
  created_at: string;
  promo: StripePaymentPromoMeta | null;
} | null> {
  const queryWithPromo = `
      SELECT
        p.id,
        p.checkout_session_id,
        p.status,
        p.subscription_type,
        p.amount_cents,
        p.server_id,
        s.name AS server_name,
        p.created_at,
        m.base_amount_cents,
        m.promo_code,
        m.promo_discount_type,
        m.promo_discount_value
      FROM stripe_payments p
      JOIN servers s ON s.id = p.server_id
      LEFT JOIN stripe_payment_promos m ON m.checkout_session_id = p.checkout_session_id
      WHERE p.checkout_session_id = $1
        AND p.user_id = $2
      LIMIT 1
    `;

  const queryWithoutPromo = `
      SELECT
        p.id,
        p.checkout_session_id,
        p.status,
        p.subscription_type,
        p.amount_cents,
        p.server_id,
        s.name AS server_name,
        p.created_at
      FROM stripe_payments p
      JOIN servers s ON s.id = p.server_id
      WHERE p.checkout_session_id = $1
        AND p.user_id = $2
      LIMIT 1
    `;

  type Row = {
    id: string;
    checkout_session_id: string;
    status: "pending" | "completed" | "failed";
    subscription_type: "quokka_plus" | "essentiel";
    amount_cents: number;
    server_id: string;
    server_name: string;
    created_at: string;
    base_amount_cents?: number | null;
    promo_code?: string | null;
    promo_discount_type?: "fixed" | "percent" | "free" | null;
    promo_discount_value?: number | null;
  };

  let result: { rows: Row[] };
  try {
    result = await db.query<Row>(queryWithPromo, [checkoutSessionId, userId]);
  } catch (error) {
    if (!isMissingRelationError(error)) throw error;
    result = await db.query<Row>(queryWithoutPromo, [checkoutSessionId, userId]);
  }

  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    promo:
      row.base_amount_cents !== undefined
        ? {
            base_amount_cents: row.base_amount_cents ?? row.amount_cents,
            promo_code: row.promo_code ?? null,
            promo_discount_type: row.promo_discount_type ?? null,
            promo_discount_value: row.promo_discount_value ?? null
          }
        : null,
    order_reference: generateOrderReference(row.id)
  };
}

export async function markStripePaymentCompleted(checkoutSessionId: string, paymentIntentId: string | null): Promise<{
  serverId: string;
  type: "quokka_plus" | "essentiel";
  plannedStartDate: Date | null;
  durationDays: number | null;
  durationHours: number | null;
} | null> {
  const result = await db.query<{
    server_id: string;
    subscription_type: "quokka_plus" | "essentiel";
    planned_start_date: string | null;
    duration_days: number | null;
    duration_hours: number | null;
  }>(
    `
      UPDATE stripe_payments
      SET status = 'completed',
          payment_intent_id = COALESCE($2, payment_intent_id),
          updated_at = NOW()
      WHERE checkout_session_id = $1
        AND status <> 'completed'
      RETURNING server_id, subscription_type, planned_start_date, duration_days, duration_hours
    `,
    [checkoutSessionId, paymentIntentId]
  );

  const row = result.rows[0];
  if (!row) return null;
  return {
    serverId: row.server_id,
    type: row.subscription_type,
    plannedStartDate: row.planned_start_date ? new Date(row.planned_start_date) : null,
    durationDays: row.duration_days,
    durationHours: row.duration_hours
  };
}

export async function setStripePaymentPromotionWindow(input: {
  checkoutSessionId: string;
  startDate: Date;
  endDate: Date;
}): Promise<void> {
  await db.query(
    `
      UPDATE stripe_payments
      SET promotion_start_date = $2,
          promotion_end_date = $3,
          updated_at = NOW()
      WHERE checkout_session_id = $1
    `,
    [input.checkoutSessionId, input.startDate.toISOString(), input.endDate.toISOString()]
  );
}

export async function createGiftedStripePayment(input: {
  userId: string;
  serverId: string;
  subscriptionType: "quokka_plus" | "essentiel";
  durationDays: number | null;
  durationHours: number | null;
  promotionStartDate: Date;
  promotionEndDate: Date;
}): Promise<{ checkoutSessionId: string; paymentId: string }> {
  const checkoutSessionId = `gift_${randomUUID()}`;
  const result = await db.query<{ id: string }>(
    `
      INSERT INTO stripe_payments (
        checkout_session_id, payment_intent_id, user_id, server_id,
        subscription_type, planned_start_date, duration_days, duration_hours,
        promotion_start_date, promotion_end_date, amount_cents, status
      )
      VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, 0, 'completed')
      RETURNING id
    `,
    [
      checkoutSessionId,
      input.userId,
      input.serverId,
      input.subscriptionType,
      input.promotionStartDate.toISOString(),
      input.durationDays,
      input.durationHours,
      input.promotionStartDate.toISOString(),
      input.promotionEndDate.toISOString()
    ]
  );
  return { checkoutSessionId, paymentId: result.rows[0]?.id ?? checkoutSessionId };
}

export async function listAllStripePayments(): Promise<
  Array<{
    id: string;
    checkout_session_id: string;
    status: "pending" | "completed" | "failed";
    subscription_type: "quokka_plus" | "essentiel";
    amount_cents: number;
    duration_days: number | null;
    duration_hours: number | null;
    user_id: string;
    user_pseudo: string;
    user_email: string;
    server_id: string;
    server_name: string;
    planned_start_date: string | null;
    promotion_start_date: string | null;
    promotion_end_date: string | null;
    created_at: string;
  }>
> {
  const result = await db.query<{
    id: string;
    checkout_session_id: string;
    status: "pending" | "completed" | "failed";
    subscription_type: "quokka_plus" | "essentiel";
    amount_cents: number;
    duration_days: number | null;
    duration_hours: number | null;
    user_id: string;
    user_pseudo: string;
    user_email: string;
    server_id: string;
    server_name: string;
    planned_start_date: string | null;
    promotion_start_date: string | null;
    promotion_end_date: string | null;
    created_at: string;
  }>(
    `
      SELECT
        p.id,
        p.checkout_session_id,
        p.status,
        p.subscription_type,
        p.amount_cents,
        p.duration_days,
        p.duration_hours,
        p.user_id,
        u.pseudo AS user_pseudo,
        u.email AS user_email,
        p.server_id,
        s.name AS server_name,
        p.planned_start_date,
        p.promotion_start_date,
        p.promotion_end_date,
        p.created_at
      FROM stripe_payments p
      JOIN users u ON u.id = p.user_id
      JOIN servers s ON s.id = p.server_id
      ORDER BY p.created_at DESC
    `
  );
  return result.rows;
}
