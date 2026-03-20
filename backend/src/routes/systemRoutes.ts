import { Router } from "express";
import { getPublicAnnouncementSettings, getPublicBrandingSettings, getPublicMaintenanceSettings } from "../controllers/systemController.js";
import { cacheMiddleware } from "../middlewares/cache.middleware.js";

export const systemRoutes = Router();

systemRoutes.get("/maintenance", cacheMiddleware(60), getPublicMaintenanceSettings);
systemRoutes.get("/announcement", cacheMiddleware(300), getPublicAnnouncementSettings);
systemRoutes.get("/branding", cacheMiddleware(300), getPublicBrandingSettings);
