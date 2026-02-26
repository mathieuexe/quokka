import type { Request, Response } from "express";
import { z } from "zod";
import {
  listServersByPriority,
  listServersByUser,
  deleteServer,
  getServerOwner,
  setServerHidden,
  setServerVisibility,
  updateServerAsAdmin
} from "../repositories/serverRepository.js";
import { addSubscription, deleteSubscription, listAllSubscriptions, listUserSubscriptions } from "../repositories/subscriptionRepository.js";
import {
  creditUserBalance,
  listAvailableBadges,
  listUsers,
  setUserBadgesAsAdmin,
  updateUserAsAdmin,
  findUserById,
  deleteUser,
  listUserIpEvents
} from "../repositories/userRepository.js";
import { createGiftedStripePayment, listAllStripePayments } from "../repositories/paymentRepository.js";
import { createPromoCode, listPromoCodesWithTargets, setPromoCodeActive } from "../repositories/promoCodeRepository.js";
import {
  createVerificationCode,
  createTwoFactorCode,
  listUserEmailEvents,
  toggleTwoFactor,
  deleteTwoFactorCodesForUser
} from "../repositories/verificationRepository.js";
import {
  sendEmail,
  sendHtmlEmail,
  generateVerificationCode,
  generateVerificationEmailTemplate,
  generate2FAEmailTemplate,
  generateAdminMailTemplate
} from "../services/emailService.js";
import { generateCustomerReference } from "../utils/references.js";
import {
  updateMaintenanceSettings as updateMaintenanceSettingsInDb,
  getMaintenanceSettings as getMaintenanceSettingsFromDb,
  getAnnouncementSettings as getAnnouncementSettingsFromDb,
  updateAnnouncementSettings as updateAnnouncementSettingsInDb,
  getSiteBrandingSettings as getSiteBrandingSettingsFromDb,
  updateSiteBrandingSettings as updateSiteBrandingSettingsInDb
} from "../repositories/systemRepository.js";
import { countUnreadNotifications, listAdminNotifications, markNotificationsRead } from "../repositories/notificationRepository.js";

const maintenanceSchema = z.object({
  is_enabled: z.boolean(),
  message: z.string().max(1000).default(""),
  allowed_ips: z.string().max(1000).optional()
});

const announcementIconOptions = ["sparkles", "megaphone", "rocket", "warning", "gift", "bell"] as const;

const announcementSchema = z
  .object({
    is_enabled: z.boolean(),
    text: z.string().max(500).default(""),
    icon: z.string().max(40).optional().nullable(),
    cta_label: z.string().max(60).optional().nullable(),
    cta_url: z.string().max(300).optional().nullable(),
    countdown_target: z.string().max(40).optional().nullable()
  })
  .superRefine((payload, ctx) => {
    if (payload.cta_url?.trim() && !isValidUrlOrPath(payload.cta_url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'URL du bouton est invalide.",
        path: ["cta_url"]
      });
    }
    if (payload.is_enabled && !payload.text.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le texte du bandeau est requis.",
        path: ["text"]
      });
    }
    if (payload.is_enabled && !payload.icon?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'icône du bandeau est requise.",
        path: ["icon"]
      });
    }
    if (payload.icon?.trim() && !announcementIconOptions.includes(payload.icon.trim() as (typeof announcementIconOptions)[number])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'icône sélectionnée est invalide.",
        path: ["icon"]
      });
    }
    if (payload.countdown_target?.trim()) {
      const timestamp = Date.parse(payload.countdown_target.trim());
      if (Number.isNaN(timestamp)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La date de compte à rebours est invalide.",
          path: ["countdown_target"]
        });
      }
    }
  });

function isValidUrlOrPath(value: string): boolean {
  if (!value.trim()) return true;
  if (value.startsWith("/")) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const brandingSchema = z
  .object({
    site_title: z.string().max(120).default(""),
    site_description: z.string().max(500).default(""),
    logo_url: z.string().max(300).default(""),
    favicon_url: z.string().max(300).default("")
  })
  .superRefine((payload, ctx) => {
    if (!isValidUrlOrPath(payload.logo_url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "URL du logo invalide.",
        path: ["logo_url"]
      });
    }
    if (!isValidUrlOrPath(payload.favicon_url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "URL du favicon invalide.",
        path: ["favicon_url"]
      });
    }
  });

const promoteSchema = z
  .object({
    serverId: z.string().uuid(),
    type: z.enum(["quokka_plus", "essentiel"]),
    durationDays: z.number().int().min(1).max(365).optional(),
    durationHours: z.number().int().min(1).max(24 * 365).optional(),
    premiumSlot: z.number().int().positive().optional()
  })
  .superRefine((payload, ctx) => {
    if (payload.type === "essentiel" && payload.durationDays === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La durée en jours est requise pour l'abonnement Essentiel.",
        path: ["durationDays"]
      });
    }
    if (payload.type === "quokka_plus" && payload.durationHours === undefined && payload.durationDays === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La durée en heures est requise pour l'abonnement Quokka+.",
        path: ["durationHours"]
      });
    }
  });

const serverStateSchema = z.object({
  serverId: z.string().uuid(),
  value: z.boolean()
});

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  pseudo: z.string().min(2).max(60),
  email: z.string().email(),
  bio: z.string().max(1000).default(""),
  internalNote: z.string().max(5000).default(""),
  role: z.enum(["user", "admin"]),
  badgeIds: z.array(z.string().uuid()).optional()
});

const updateServerSchema = z.object({
  serverId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().min(2).max(120),
  description: z.string().min(10).max(4000),
  website: z.string().url().nullable().optional(),
  countryCode: z.string().length(2),
  ip: z.string().nullable().optional(),
  port: z.number().int().positive().max(65535).nullable().optional(),
  inviteLink: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  isPublic: z.boolean(),
  isHidden: z.boolean(),
  isVisible: z.boolean(),
  verified: z.boolean()
});

const deleteSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid()
});

const resendVerificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(["verification", "2fa"])
});

const creditBalanceSchema = z.object({
  amountEuros: z.number().positive()
});

const sendMailSchema = z.object({
  userId: z.string().uuid(),
  subject: z.string().trim().min(1).max(180),
  content: z.string().trim().min(1).max(6000)
});

const deleteUserSchema = z.object({
  userId: z.string().uuid()
});

const createPromoCodeSchema = z
  .object({
    code: z.string().trim().min(3).max(64),
    scope: z.enum(["global", "user", "server", "user_server"]).default("global"),
    userId: z.string().uuid().optional(),
    serverId: z.string().uuid().optional(),
    type: z.enum(["fixed", "percent", "free"]),
    amountEuros: z.number().nonnegative().optional(),
    percent: z.number().int().min(1).max(100).optional(),
    maxUses: z.number().int().positive().optional(),
    expiresAt: z.string().datetime().optional(),
    isActive: z.boolean().default(true)
  })
  .superRefine((payload, ctx) => {
    if (payload.scope === "user" && !payload.userId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "userId requis pour un code utilisateur.", path: ["userId"] });
    }
    if (payload.scope === "server" && !payload.serverId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "serverId requis pour un code serveur.", path: ["serverId"] });
    }
    if (payload.scope === "user_server" && (!payload.userId || !payload.serverId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "userId et serverId requis.", path: ["scope"] });
    }
    if (payload.type === "fixed" && (payload.amountEuros === undefined || payload.amountEuros <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Montant en euros requis pour une réduction fixe.", path: ["amountEuros"] });
    }
    if (payload.type === "percent" && payload.percent === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pourcentage requis pour une réduction en %.", path: ["percent"] });
    }
  });

const promoCodeActiveSchema = z.object({
  promoCodeId: z.string().uuid(),
  isActive: z.boolean()
});

const adminUserParamsSchema = z.object({
  userId: z.string().uuid()
});

const adminServerParamsSchema = z.object({
  serverId: z.string().uuid()
});

export async function getAdminUsers(_req: Request, res: Response): Promise<void> {
  const [users, availableBadges] = await Promise.all([listUsers(), listAvailableBadges()]);
  const usersWithReference = users.map((user) => ({
    ...user,
    customer_reference: generateCustomerReference(user.pseudo, user.id)
  }));
  res.json({ users: usersWithReference, availableBadges });
}

export async function getAdminServers(req: Request, res: Response): Promise<void> {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const servers = await listServersByPriority(search);
  res.json({ servers });
}

export async function getAdminSubscriptions(_req: Request, res: Response): Promise<void> {
  const subscriptions = await listAllSubscriptions();
  res.json({ subscriptions });
}

export async function getAdminNotifications(req: Request, res: Response): Promise<void> {
  const onlyUnread = req.query.onlyUnread === "true";
  const limit = Math.max(1, Math.min(500, Number(req.query.limit ?? 100)));
  const [items, unreadCount] = await Promise.all([listAdminNotifications({ onlyUnread, limit }), countUnreadNotifications()]);
  res.json({ notifications: items, unreadCount });
}

export async function getAdminUserDetails(req: Request, res: Response): Promise<void> {
  const params = adminUserParamsSchema.parse(req.params);
  const [users, servers, availableBadges, subscriptions, emailEvents, ipEvents] = await Promise.all([
    listUsers(),
    listServersByUser(params.userId),
    listAvailableBadges(),
    listUserSubscriptions(params.userId),
    listUserEmailEvents(params.userId),
    listUserIpEvents(params.userId, 200)
  ]);
  const user = users.find((entry) => entry.id === params.userId);
  if (!user) {
    res.status(404).json({ message: "Utilisateur introuvable." });
    return;
  }
  res.json({
    user: {
      ...user,
      customer_reference: generateCustomerReference(user.pseudo, user.id)
    },
    servers,
    availableBadges,
    subscriptions,
    emailEvents,
    ipEvents
  });
}

export async function getAdminPromoCodes(_req: Request, res: Response): Promise<void> {
  const promoCodes = await listPromoCodesWithTargets();
  res.json({ promoCodes });
}

export async function postAdminPromoCode(req: Request, res: Response): Promise<void> {
  const payload = createPromoCodeSchema.parse(req.body);
  const normalizedCode = payload.code.trim().toUpperCase();
  const discountValue =
    payload.type === "fixed"
      ? Math.round((payload.amountEuros ?? 0) * 100)
      : payload.type === "percent"
        ? payload.percent ?? 0
        : 0;
  const userId = payload.scope === "user" || payload.scope === "user_server" ? payload.userId ?? null : null;
  const serverId = payload.scope === "server" || payload.scope === "user_server" ? payload.serverId ?? null : null;

  const promoCode = await createPromoCode({
    code: normalizedCode,
    isActive: payload.isActive,
    discountType: payload.type,
    discountValue,
    userId,
    serverId,
    maxUses: payload.maxUses ?? null,
    expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null
  });
  res.status(201).json({ promoCode });
}

export async function patchAdminPromoCodeActive(req: Request, res: Response): Promise<void> {
  const payload = promoCodeActiveSchema.parse(req.body);
  await setPromoCodeActive(payload.promoCodeId, payload.isActive);
  res.status(204).send();
}

export async function getAdminBilling(_req: Request, res: Response): Promise<void> {
  const [subscriptions, payments] = await Promise.all([listAllSubscriptions(), listAllStripePayments()]);
  const now = Date.now();

  const subscriptionsWithStatus = subscriptions.map((subscription) => {
    const lifecycleStatus = new Date(subscription.end_date).getTime() >= now ? "active" : "terminated";
    return {
      ...subscription,
      lifecycle_status: lifecycleStatus as "active" | "terminated"
    };
  });

  res.json({ subscriptions: subscriptionsWithStatus, payments });
}

export async function promoteServer(req: Request, res: Response): Promise<void> {
  const payload = promoteSchema.parse(req.body);
  const ownerId = await getServerOwner(payload.serverId);
  if (!ownerId) {
    res.status(404).json({ message: "Serveur introuvable." });
    return;
  }

  const promotion = await addSubscription(payload);
  await createGiftedStripePayment({
    userId: ownerId,
    serverId: payload.serverId,
    subscriptionType: payload.type,
    durationDays: payload.type === "essentiel" ? payload.durationDays ?? 1 : null,
    durationHours:
      payload.type === "quokka_plus"
        ? payload.durationHours ?? (payload.durationDays ? payload.durationDays * 24 : 1)
        : null,
    promotionStartDate: promotion.startDate,
    promotionEndDate: promotion.endDate
  });
  res.json({ message: "Serveur mis en avant avec succès." });
}

export async function hideServer(req: Request, res: Response): Promise<void> {
  const payload = serverStateSchema.parse(req.body);
  await setServerHidden(payload.serverId, payload.value);
  res.json({ message: "Masquage serveur mis à jour." });
}

export async function makeServerVisible(req: Request, res: Response): Promise<void> {
  const payload = serverStateSchema.parse(req.body);
  await setServerVisibility(payload.serverId, payload.value);
  res.json({ message: "Visibilité serveur mise à jour." });
}

export async function updateAdminUser(req: Request, res: Response): Promise<void> {
  const payload = updateUserSchema.parse(req.body);
  await updateUserAsAdmin(payload.userId, {
    pseudo: payload.pseudo,
    email: payload.email,
    bio: payload.bio,
    internalNote: payload.internalNote,
    role: payload.role
  });
  if (payload.badgeIds) {
    await setUserBadgesAsAdmin(payload.userId, payload.badgeIds);
  }
  res.json({ message: "Utilisateur mis à jour." });
}

export async function creditAdminUserBalance(req: Request, res: Response): Promise<void> {
  const params = adminUserParamsSchema.parse(req.params);
  const payload = creditBalanceSchema.parse(req.body);
  const user = await findUserById(params.userId);
  if (!user) {
    res.status(404).json({ message: "Utilisateur introuvable." });
    return;
  }
  const amountCents = Math.round(payload.amountEuros * 100);
  const balance = await creditUserBalance(params.userId, amountCents);
  res.json({ message: "Solde crédité.", balance_cents: balance });
}

export async function updateAdminServer(req: Request, res: Response): Promise<void> {
  const payload = updateServerSchema.parse(req.body);
  await updateServerAsAdmin(payload.serverId, {
    categoryId: payload.categoryId,
    name: payload.name,
    description: payload.description,
    website: payload.website ?? undefined,
    countryCode: payload.countryCode.toUpperCase(),
    ip: payload.ip ?? undefined,
    port: payload.port ?? undefined,
    inviteLink: payload.inviteLink ?? undefined,
    bannerUrl: payload.bannerUrl ?? undefined,
    isPublic: payload.isPublic,
    isHidden: payload.isHidden,
    isVisible: payload.isVisible,
    verified: payload.verified
  });
  res.json({ message: "Serveur mis à jour." });
}

export async function markAdminNotificationsRead(req: Request, res: Response): Promise<void> {
  const body = z
    .object({
      all: z.boolean().optional(),
      ids: z.array(z.string().uuid()).optional()
    })
    .parse(req.body);
  await markNotificationsRead({ all: body.all === true, ids: body.ids });
  const unreadCount = await countUnreadNotifications();
  res.json({ message: "Notifications mises à jour.", unreadCount });
}

export async function removeAdminServer(req: Request, res: Response): Promise<void> {
  const params = adminServerParamsSchema.parse(req.params);
  const ownerId = await getServerOwner(params.serverId);
  if (!ownerId) {
    res.status(404).json({ message: "Serveur introuvable." });
    return;
  }
  await deleteServer(params.serverId);
  res.status(204).send();
}

export async function removeAdminSubscription(req: Request, res: Response): Promise<void> {
  const payload = deleteSubscriptionSchema.parse(req.body);
  await deleteSubscription(payload.subscriptionId);
  res.json({ message: "Abonnement supprimé." });
}

export async function resendVerificationCode(req: Request, res: Response): Promise<void> {
  const payload = resendVerificationSchema.parse(req.body);
  
  const user = await findUserById(payload.userId);
  if (!user) {
    res.status(404).json({ message: "Utilisateur introuvable." });
    return;
  }

  const code = generateVerificationCode();

  if (payload.type === "verification") {
    await createVerificationCode(user.id, code);
    const emailTemplate = generateVerificationEmailTemplate(user.pseudo, code, user.language);
    emailTemplate.to = user.email;
    await sendEmail(emailTemplate);
    res.json({ message: "Code de vérification envoyé." });
  } else {
    await createTwoFactorCode(user.id, code);
    const emailTemplate = generate2FAEmailTemplate(user.pseudo, code, user.language);
    emailTemplate.to = user.email;
    await sendEmail(emailTemplate);
    res.json({ message: "Code 2FA envoyé." });
  }
}

export async function sendAdminMail(req: Request, res: Response): Promise<void> {
  const payload = sendMailSchema.parse(req.body);
  const user = await findUserById(payload.userId);
  if (!user) {
    res.status(404).json({ message: "Utilisateur introuvable." });
    return;
  }
  try {
    const template = generateAdminMailTemplate(payload.subject, payload.content);
    await sendHtmlEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
    res.json({ message: "Email envoyé." });
  } catch (error: any) {
    console.error("Erreur envoi email admin:", error);
    res.status(500).json({ message: "Envoi d'email impossible.", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
}

export async function removeAdminUser(req: Request, res: Response): Promise<void> {
  const payload = deleteUserSchema.parse(req.body);
  
  // Vérifier que l'utilisateur existe
  const user = await findUserById(payload.userId);
  if (!user) {
    res.status(404).json({ message: "Utilisateur introuvable." });
    return;
  }

  // Empêcher la suppression de son propre compte
  if (req.user?.sub === payload.userId) {
    res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte." });
    return;
  }

  await deleteUser(payload.userId);
  res.json({ message: "Utilisateur supprimé avec succès." });
}

export async function getMaintenanceSettings(_req: Request, res: Response): Promise<void> {
  const settings = await getMaintenanceSettingsFromDb();
  res.json(settings);
}

export async function updateMaintenanceSettings(req: Request, res: Response): Promise<void> {
  const payload = maintenanceSchema.parse(req.body);
  await updateMaintenanceSettingsInDb({
    ...payload,
    allowed_ips: payload.allowed_ips ?? ""
  });
  res.json({ message: "Paramètres de maintenance mis à jour." });
}

export async function getAnnouncementSettings(_req: Request, res: Response): Promise<void> {
  const settings = await getAnnouncementSettingsFromDb();
  res.json(settings);
}

export async function updateAnnouncementSettings(req: Request, res: Response): Promise<void> {
  const payload = announcementSchema.parse(req.body);
  const announcement = await updateAnnouncementSettingsInDb({
    is_enabled: payload.is_enabled,
    text: payload.text.trim(),
    icon: payload.icon?.trim() ?? "",
    cta_label: payload.cta_label?.trim() ?? "",
    cta_url: payload.cta_url?.trim() ?? "",
    countdown_target: payload.countdown_target?.trim() ?? ""
  });
  res.json({ message: "Bandeau d'information mis à jour.", announcement });
}

export async function getSiteBrandingSettings(_req: Request, res: Response): Promise<void> {
  const settings = await getSiteBrandingSettingsFromDb();
  res.json(settings);
}

export async function updateSiteBrandingSettings(req: Request, res: Response): Promise<void> {
  const payload = brandingSchema.parse(req.body);
  await updateSiteBrandingSettingsInDb({
    site_title: payload.site_title.trim(),
    site_description: payload.site_description.trim(),
    logo_url: payload.logo_url.trim(),
    favicon_url: payload.favicon_url.trim()
  });
  res.json({ message: "Identité du site mise à jour." });
}

export async function disableUserTwoFactor(req: Request, res: Response): Promise<void> {
  const params = adminUserParamsSchema.parse(req.params);
  await toggleTwoFactor(params.userId, false);
  await deleteTwoFactorCodesForUser(params.userId);
  res.json({ message: "Double authentification désactivée pour l'utilisateur.", two_factor_enabled: false });
}
