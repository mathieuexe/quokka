import type { Request, Response } from "express";
import { getMaintenanceSettings } from "../repositories/systemRepository.js";

export async function getPublicMaintenanceSettings(_req: Request, res: Response): Promise<void> {
  const settings = await getMaintenanceSettings();
  res.json({ maintenance: settings });
}
