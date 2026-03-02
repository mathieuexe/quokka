import type { Request, Response } from "express";
import { getAnnouncementSettings, getMaintenanceSettings, getSiteBrandingSettings } from "../repositories/systemRepository.js";

export async function getPublicMaintenanceSettings(_req: Request, res: Response): Promise<void> {
  const settings = await getMaintenanceSettings();
  res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=60");
  res.json({ maintenance: settings });
}

export async function getPublicAnnouncementSettings(_req: Request, res: Response): Promise<void> {
  const settings = await getAnnouncementSettings();
  res.set("Cache-Control", "public, max-age=300, s-maxage=600, stale-while-revalidate=120");
  res.json({ announcement: settings });
}

export async function getPublicBrandingSettings(_req: Request, res: Response): Promise<void> {
  const settings = await getSiteBrandingSettings();
  res.set("Cache-Control", "public, max-age=300, s-maxage=600, stale-while-revalidate=120");
  res.json({ branding: settings });
}
