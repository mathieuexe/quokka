import { Router } from "express";
import { getUserProfile } from "../controllers/userController.js";
import { cacheMiddleware } from "../middlewares/cache.middleware.js";
export const userRoutes = Router();
userRoutes.get("/:userId/profile", cacheMiddleware(60), getUserProfile);
