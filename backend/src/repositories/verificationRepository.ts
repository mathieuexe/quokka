import { db } from "../config/db.js";

export type VerificationCode = {
  id: string;
  user_id: string;
  code: string;
  expires_at: string;
  used: boolean;
  created_at: string;
};

export type TwoFactorCode = {
  id: string;
  user_id: string;
  code: string;
  expires_at: string;
  used: boolean;
  created_at: string;
};

// ==================== VERIFICATION EMAIL ====================

export async function createVerificationCode(userId: string, code: string): Promise<VerificationCode> {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  const result = await db.query<VerificationCode>(
    `
      INSERT INTO email_verification_codes (user_id, code, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [userId, code, expiresAt]
  );

  return result.rows[0];
}

export async function findVerificationCode(userId: string, code: string): Promise<VerificationCode | null> {
  const result = await db.query<VerificationCode>(
    `
      SELECT * FROM email_verification_codes
      WHERE user_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId, code]
  );

  return result.rows[0] ?? null;
}

export async function markVerificationCodeAsUsed(id: string): Promise<void> {
  await db.query(
    `
      UPDATE email_verification_codes
      SET used = TRUE
      WHERE id = $1
    `,
    [id]
  );
}

export async function deleteExpiredVerificationCodes(): Promise<void> {
  await db.query(
    `
      DELETE FROM email_verification_codes
      WHERE expires_at < NOW()
    `
  );
}

export async function markEmailAsVerified(userId: string): Promise<void> {
  await db.query(
    `
      UPDATE users
      SET email_verified = TRUE, updated_at = NOW()
      WHERE id = $1
    `,
    [userId]
  );
}

// ==================== TWO FACTOR AUTHENTICATION ====================

export async function createTwoFactorCode(userId: string, code: string): Promise<TwoFactorCode> {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  const result = await db.query<TwoFactorCode>(
    `
      INSERT INTO two_factor_codes (user_id, code, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [userId, code, expiresAt]
  );

  return result.rows[0];
}

export async function findTwoFactorCode(userId: string, code: string): Promise<TwoFactorCode | null> {
  const result = await db.query<TwoFactorCode>(
    `
      SELECT * FROM two_factor_codes
      WHERE user_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId, code]
  );

  return result.rows[0] ?? null;
}

export async function markTwoFactorCodeAsUsed(id: string): Promise<void> {
  await db.query(
    `
      UPDATE two_factor_codes
      SET used = TRUE
      WHERE id = $1
    `,
    [id]
  );
}

export async function deleteTwoFactorCodesForUser(userId: string): Promise<void> {
  await db.query(
    `
      DELETE FROM two_factor_codes
      WHERE user_id = $1
    `,
    [userId]
  );
}

export async function deleteExpiredTwoFactorCodes(): Promise<void> {
  await db.query(
    `
      DELETE FROM two_factor_codes
      WHERE expires_at < NOW()
    `
  );
}

export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  const result = await db.query<{ two_factor_enabled: boolean }>(
    `
      SELECT two_factor_enabled FROM users WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0]?.two_factor_enabled ?? true;
}

export async function toggleTwoFactor(userId: string, enabled: boolean): Promise<void> {
  await db.query(
    `
      UPDATE users
      SET two_factor_enabled = $2, updated_at = NOW()
      WHERE id = $1
    `,
    [userId, enabled]
  );
}
