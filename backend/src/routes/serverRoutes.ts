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

export const serverRoutes = Router();

serverRoutes.get("/", getHomeServers);
serverRoutes.get("/categories", getCategories);
serverRoutes.get("/:serverId", getServer);
serverRoutes.post("/:serverId/vote", requireAuth, voteServer);
serverRoutes.get("/:serverId/certification", requireAuth, getCertificationStatus);
serverRoutes.post("/:serverId/certification", requireAuth, requestCertification);
serverRoutes.post("/", requireAuth, addServer);
serverRoutes.patch("/:serverId", requireAuth, patchServer);
serverRoutes.delete("/:serverId", requireAuth, removeServer);
