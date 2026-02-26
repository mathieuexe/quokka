import { Router } from "express";
import { getPublicAnnouncementSettings, getPublicBrandingSettings, getPublicMaintenanceSettings } from "../controllers/systemController.js";

export const systemRoutes = Router();

systemRoutes.get("/maintenance", getPublicMaintenanceSettings);
systemRoutes.get("/announcement", getPublicAnnouncementSettings);
systemRoutes.get("/branding", getPublicBrandingSettings);
