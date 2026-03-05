import type { Request, Response } from "express";
import { z } from "zod";
import { listServersByUser } from "../repositories/serverRepository.js";
import { listUserSubscriptions } from "../repositories/subscriptionRepository.js";
import {
  ensureUserPseudoCooldownSchema,
  findUserById,
  getDiscordAccountByUserId,
  listBadgesByUserId,
  updateProfile
} from "../repositories/userRepository.js";
import { ensureMonthlyLikesReset } from "../repositories/voteRepository.js";
import { toggleTwoFactor } from "../repositories/verificationRepository.js";

const updateProfileSchema = z.object({
  pseudo: z.string().min(2).max(60),
  bio: z.string().max(500).default(""),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  discordUrl: z.string().url().optional().or(z.literal("")),
  xUrl: z.string().url().optional().or(z.literal("")),
  blueskyUrl: z.string().url().optional().or(z.literal("")),
  stoatUrl: z.string().url().optional().or(z.literal("")),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  twitchUrl: z.string().url().optional().or(z.literal("")),
  kickUrl: z.string().url().optional().or(z.literal("")),
  snapchatUrl: z.string().url().optional().or(z.literal("")),
  tiktokUrl: z.string().url().optional().or(z.literal(""))
});

const toggle2FASchema = z.object({
  enabled: z.boolean()
});

function isImgurAvatarUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isImgurHost = host === "imgur.com" || host.endsWith(".imgur.com");
    if (!isImgurHost) return false;

    const path = parsed.pathname.toLowerCase();
    return path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".png") || path.endsWith(".gif");
  } catch {
    return false;
  }
}

const PSEUDO_CHANGE_COOLDOWN_DAYS = 60;
const PSEUDO_CHANGE_COOLDOWN_MS = PSEUDO_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

function getPseudoNextChangeAt(lastChangedAt: string | null | undefined): string | null {
  if (!lastChangedAt) return null;
  const lastChanged = new Date(lastChangedAt);
  const timestamp = lastChanged.getTime();
  if (!Number.isFinite(timestamp)) return null;
  const nextAllowedAt = new Date(timestamp + PSEUDO_CHANGE_COOLDOWN_MS);
  if (nextAllowedAt.getTime() <= Date.now()) return null;
  return nextAllowedAt.toISOString();
}

export async function getDashboard(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }

  await ensureMonthlyLikesReset();
  await ensureUserPseudoCooldownSchema();
  const user = await findUserById(userId);
  if (!user) {
    res.status(404).json({ message: "Utilisateur introuvable." });
    return;
  }

  const [servers, subscriptions, badges, discordAccount] = await Promise.all([
    listServersByUser(userId),
    listUserSubscriptions(userId),
    listBadgesByUserId(userId),
    getDiscordAccountByUserId(userId)
  ]);

  res.json({
    user: {
      id: user.id,
      pseudo: user.pseudo,
      email: user.email,
      bio: user.bio,
      avatar_url: user.avatar_url,
      last_login_at: user.last_login_at,
      email_verified: user.email_verified,
      two_factor_enabled: user.two_factor_enabled,
      balance_cents: user.balance_cents,
      last_balance_update: user.last_balance_update,
      discord_url: user.discord_url,
      x_url: user.x_url,
      bluesky_url: user.bluesky_url,
      stoat_url: user.stoat_url,
      youtube_url: user.youtube_url,
      twitch_url: user.twitch_url,
      kick_url: user.kick_url,
      snapchat_url: user.snapchat_url,
      tiktok_url: user.tiktok_url,
      pseudo_last_changed_at: user.pseudo_last_changed_at,
      pseudo_next_change_at: getPseudoNextChangeAt(user.pseudo_last_changed_at),
      badges,
      role: user.role,
      discord_account: discordAccount
    },
    servers,
    subscriptions
  });
}

export async function patchProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }

  const payload = updateProfileSchema.parse(req.body);
  const normalizedPseudo = payload.pseudo.trim();
  if (normalizedPseudo.length < 2) {
    res.status(400).json({ message: "Le pseudo doit contenir au moins 2 caractères." });
    return;
  }

  await ensureUserPseudoCooldownSchema();
  const currentUser = await findUserById(userId);
  if (!currentUser) {
    res.status(404).json({ message: "Utilisateur introuvable." });
    return;
  }

  const pseudoChanged = normalizedPseudo !== currentUser.pseudo;
  const nextPseudoChangeAt = getPseudoNextChangeAt(currentUser.pseudo_last_changed_at);
  if (pseudoChanged && nextPseudoChangeAt) {
    res.status(429).json({
      message: "Vous pourrez changer votre pseudo à nouveau après 60 jours.",
      pseudo_next_change_at: nextPseudoChangeAt
    });
    return;
  }

  if (payload.avatarUrl && !isImgurAvatarUrl(payload.avatarUrl)) {
    res.status(400).json({
      message: "L'avatar doit être hébergé sur Imgur et finir par .jpg, .jpeg, .png ou .gif."
    });
    return;
  }

  await updateProfile(userId, {
    pseudo: normalizedPseudo,
    bio: payload.bio,
    avatarUrl: payload.avatarUrl || undefined,
    discordUrl: payload.discordUrl || undefined,
    xUrl: payload.xUrl || undefined,
    blueskyUrl: payload.blueskyUrl || undefined,
    stoatUrl: payload.stoatUrl || undefined,
    youtubeUrl: payload.youtubeUrl || undefined,
    twitchUrl: payload.twitchUrl || undefined,
    kickUrl: payload.kickUrl || undefined,
    snapchatUrl: payload.snapchatUrl || undefined,
    tiktokUrl: payload.tiktokUrl || undefined
  });
  res.json({
    message: "Profil mis à jour.",
    pseudo_next_change_at: pseudoChanged ? new Date(Date.now() + PSEUDO_CHANGE_COOLDOWN_MS).toISOString() : nextPseudoChangeAt
  });
}

export async function toggle2FA(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }

  const payload = toggle2FASchema.parse(req.body);
  await toggleTwoFactor(userId, payload.enabled);
  
  res.json({ 
    message: payload.enabled 
      ? "Double authentification activée." 
      : "Double authentification désactivée.",
    two_factor_enabled: payload.enabled
  });
}
