import type { Request, Response } from "express";
import { z } from "zod";
import { db } from "../config/db.js";
import { env } from "../config/env.js";

const updateMaintenanceSchema = z.object({
  isEnabled: z.boolean(),
  message: z.string().min(5).max(500).optional()
});

export async function health(_req: Request, res: Response): Promise<void> {
  res.json({
    status: "ok",
    project: "quokka",
    neonProjectId: env.NEON_PROJECT_ID
  });
}

export async function getMaintenance(_req: Request, res: Response): Promise<void> {
  const result = await db.query<{
    is_enabled: boolean;
    message: string;
    updated_at: string;
  }>("SELECT is_enabled, message, updated_at FROM maintenance_settings WHERE id = 1");

  res.json({ maintenance: result.rows[0] ?? null });
}

export async function setMaintenance(req: Request, res: Response): Promise<void> {
  const payload = updateMaintenanceSchema.parse(req.body);
  await db.query(
    `
      UPDATE maintenance_settings
      SET is_enabled = $1,
          message = COALESCE($2, message),
          updated_at = NOW()
      WHERE id = 1
    `,
    [payload.isEnabled, payload.message ?? null]
  );

  res.json({ message: "Mode maintenance mis à jour." });
}
