import { Router } from "express";
import {
  addServer,
  getCategories,
  getHomeServers,
  getServer,
  voteServer,
  patchServer,
  removeServer,
  requestCertification,
  getCertificationStatus
} from "../controllers/serverController.js";
import { requireAuth } from "../middleware/auth.js";
import { cacheMiddleware } from "../middlewares/cache.middleware.js";
import { standardLimiter } from "../middlewares/rateLimiter.middleware.js";

export const serverRoutes = Router();

serverRoutes.get("/", cacheMiddleware(60), getHomeServers);
serverRoutes.get("/categories", cacheMiddleware(300), getCategories);
serverRoutes.get("/:serverId", cacheMiddleware(60), getServer);
serverRoutes.post("/:serverId/vote", standardLimiter, requireAuth, voteServer);
serverRoutes.get("/:serverId/certification", requireAuth, getCertificationStatus);
serverRoutes.post("/:serverId/certification", standardLimiter, requireAuth, requestCertification);
serverRoutes.post("/", standardLimiter, requireAuth, addServer);
serverRoutes.patch("/:serverId", requireAuth, patchServer);
serverRoutes.delete("/:serverId", requireAuth, removeServer);
