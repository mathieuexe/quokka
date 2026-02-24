import { Router } from "express";
import { getPublicMaintenanceSettings } from "../controllers/systemController.js";
export const systemRoutes = Router();
systemRoutes.get("/maintenance", getPublicMaintenanceSettings);
