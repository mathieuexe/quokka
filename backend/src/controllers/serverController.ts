import type { Request, Response } from "express";
import { z } from "zod";
import {
  createServer,
  deleteServer,
  getCategoryById,
  getServerById,
  getServerOwner,
  increaseView,
  listCategories,
  listServersByPriority,
  updateServer
} from "../repositories/serverRepository.js";
import { ensureMonthlyLikesReset, VoteRuleError, voteForServer } from "../repositories/voteRepository.js";
import { verifyAccessToken } from "../utils/jwt.js";

const addServerSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(2).max(120),
  description: z.string().min(10).max(5000),
  website: z.string().url().optional().or(z.literal("")),
  countryCode: z.string().length(2),
  ip: z.string().optional(),
  port: z.number().int().positive().optional(),
  inviteLink: z.string().url().optional(),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  isPublic: z.boolean().default(true)
});

const updateServerSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  description: z.string().min(10).max(5000),
  website: z.string().url().optional().or(z.literal("")),
  countryCode: z.string().length(2),
  ip: z.string().optional(),
  port: z.number().int().positive().optional(),
  inviteLink: z.string().url().optional(),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  isPublic: z.boolean().default(true)
});

const COMMUNITY_SLUGS = new Set(["discord", "stoat", "habbo"]);

function isImgurUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isImgurHost = host === "imgur.com" || host.endsWith(".imgur.com");
    if (!isImgurHost) return false;

    const path = parsed.pathname.toLowerCase();
    return path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".png") || path.endsWith(".gif") || path.endsWith(".mp4");
  } catch {
    return false;
  }
}

export async function getHomeServers(req: Request, res: Response): Promise<void> {
  try {
    await ensureMonthlyLikesReset();
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const servers = await listServersByPriority(search);
    res.json({ servers });
  } catch (error) {
    console.error("Home servers load failed:", error);
    res.json({ servers: [] });
  }
}

export async function getCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await listCategories();
    res.json({ categories });
  } catch (error) {
    console.error("Categories load failed:", error);
    res.json({ categories: [] });
  }
}

export async function getServer(req: Request, res: Response): Promise<void> {
  await ensureMonthlyLikesReset();
  const serverId = z.string().uuid().parse(req.params.serverId);
  const server = await getServerById(serverId);
  if (!server) {
    res.status(404).json({ message: "Serveur introuvable." });
    return;
  }

  let userId: string | undefined;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length);
    try {
      userId = verifyAccessToken(token).sub;
    } catch {
      userId = undefined;
    }
  }

  await increaseView(serverId, userId);
  res.json({ server });
}

export async function voteServer(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }

  await ensureMonthlyLikesReset();
  const serverId = z.string().uuid().parse(req.params.serverId);

  try {
    const likes = await voteForServer(serverId, userId);
    res.json({ message: "Vote enregistré.", likes });
  } catch (error) {
    if (error instanceof VoteRuleError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function addServer(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }

  const payload = addServerSchema.parse(req.body);
  if (payload.bannerUrl && !isImgurUrl(payload.bannerUrl)) {
    res.status(400).json({ message: "La bannière doit être hébergée sur Imgur et finir par .png, .jpg, .jpeg, .mp4 ou .gif." });
    return;
  }

  const category = await getCategoryById(payload.categoryId);
  if (!category) {
    res.status(400).json({ message: "Catégorie invalide." });
    return;
  }

  const isCommunityCategory = COMMUNITY_SLUGS.has(category.slug);
  if (isCommunityCategory) {
    if (!payload.inviteLink) {
      res.status(400).json({ message: "Le lien du serveur est requis pour cette catégorie." });
      return;
    }
    if (payload.ip || payload.port) {
      res.status(400).json({ message: "IP/port non autorisés pour cette catégorie." });
      return;
    }
  } else {
    if (!payload.ip || !payload.port) {
      res.status(400).json({ message: "IP et port requis pour cette catégorie." });
      return;
    }
    if (payload.inviteLink) {
      res.status(400).json({ message: "Le lien d'invitation n'est pas autorisé pour cette catégorie." });
      return;
    }
  }

  const server = await createServer({
    userId,
    categoryId: payload.categoryId,
    name: payload.name,
    description: payload.description,
    website: payload.website || undefined,
    countryCode: payload.countryCode.toUpperCase(),
    ip: payload.ip,
    port: payload.port,
    inviteLink: payload.inviteLink,
    bannerUrl: payload.bannerUrl || undefined,
    isPublic: payload.isPublic
  });

  res.status(201).json(server);
}

export async function patchServer(req: Request, res: Response): Promise<void> {
  const user = req.user;
  const serverId = z.string().uuid().parse(req.params.serverId);
  if (!user) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }

  const ownerId = await getServerOwner(serverId);
  if (!ownerId) {
    res.status(404).json({ message: "Serveur introuvable." });
    return;
  }

  if (ownerId !== user.sub && user.role !== "admin") {
    res.status(403).json({ message: "Accès refusé." });
    return;
  }

  const payload = updateServerSchema.parse(req.body);
  if (payload.bannerUrl && !isImgurUrl(payload.bannerUrl)) {
    res.status(400).json({ message: "La bannière doit être hébergée sur Imgur et finir par .png, .jpg, .jpeg, .mp4 ou .gif." });
    return;
  }

  const currentServer = await getServerById(serverId);
  if (!currentServer) {
    res.status(404).json({ message: "Serveur introuvable." });
    return;
  }

  const category = payload.categoryId ? await getCategoryById(payload.categoryId) : { slug: currentServer.category_slug };
  if (!category) {
    res.status(400).json({ message: "Catégorie invalide." });
    return;
  }

  const isCommunityCategory = COMMUNITY_SLUGS.has(category.slug);
  if (isCommunityCategory) {
    if (!payload.inviteLink) {
      res.status(400).json({ message: "Le lien du serveur est requis pour cette catégorie." });
      return;
    }
    if (payload.ip || payload.port) {
      res.status(400).json({ message: "IP/port non autorisés pour cette catégorie." });
      return;
    }
  } else {
    if (!payload.ip || !payload.port) {
      res.status(400).json({ message: "IP et port requis pour cette catégorie." });
      return;
    }
    if (payload.inviteLink) {
      res.status(400).json({ message: "Le lien d'invitation n'est pas autorisé pour cette catégorie." });
      return;
    }
  }

  await updateServer(serverId, {
    categoryId: payload.categoryId,
    name: payload.name,
    description: payload.description,
    website: payload.website || undefined,
    countryCode: payload.countryCode.toUpperCase(),
    ip: payload.ip,
    port: payload.port,
    inviteLink: payload.inviteLink,
    bannerUrl: payload.bannerUrl || undefined,
    isPublic: payload.isPublic
  });

  res.json({ message: "Serveur mis à jour." });
}

export async function removeServer(req: Request, res: Response): Promise<void> {
  const user = req.user;
  const serverId = z.string().uuid().parse(req.params.serverId);
  if (!user) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }

  const ownerId = await getServerOwner(serverId);
  if (!ownerId) {
    res.status(404).json({ message: "Serveur introuvable." });
    return;
  }

  if (ownerId !== user.sub && user.role !== "admin") {
    res.status(403).json({ message: "Accès refusé." });
    return;
  }

  await deleteServer(serverId);
  res.status(204).send();
}
