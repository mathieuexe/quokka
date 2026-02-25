import type { Request, Response } from "express";
import { z } from "zod";
import { getServerOwner } from "../repositories/serverRepository.js";
import { getSubscriptionOwner } from "../repositories/subscriptionRepository.js";
import { findUserById } from "../repositories/userRepository.js";
import {
  createTicketMessage,
  createTicketWithAdminMessage,
  createTicketWithMessage,
  getTicketById,
  getTicketMessages,
  listAdminTickets,
  listUserTickets,
  updateTicket
} from "../repositories/ticketRepository.js";

const TICKET_STATUSES = [
  "En attente d’attribution",
  "Ouvert",
  "En attente utilisateur",
  "En cours",
  "En investigation",
  "En pause",
  "Résolu",
  "Clôturé"
] as const;

const CLOSED_STATUSES = new Set(["Résolu", "Clôturé", "Cloturé"]);
const REOPEN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const CATEGORY_CONFIG = [
  {
    label: "Support technique",
    priority: 9,
    subcategories: [
      "Bug sur le site",
      "Problème de connexion / compte",
      "Erreur lors de l’ajout d’un serveur",
      "Problème d’API / vote / bot",
      "Signalement de crash"
    ]
  },
  {
    label: "Demande de référencement / modification serveur",
    priority: 6,
    subcategories: ["Ajouter un serveur", "Modifier une fiche serveur", "Supprimer un serveur", "Problème de validation", "Changement de propriétaire"]
  },
  {
    label: "Boutique / paiement",
    priority: 9,
    subcategories: ["Mises en avant premium", "Pubs", "Abonnements"]
  },
  {
    label: "Signalement / modération",
    priority: 8,
    subcategories: ["Signaler un serveur illégal", "Contenu interdit", "Fake serveur", "Abus d’un utilisateur"],
    requireServerUrl: true,
    requireAttachments: true
  },
  {
    label: "Partenariats / contact staff",
    priority: 5,
    subcategories: ["Partenariat", "Publicité", "Influenceur", "Recrutement staff", "Questions générales"]
  },
  {
    label: "Autre demande",
    priority: 3,
    subcategories: []
  }
];

const allowedExtensions = new Set(["pdf", "png", "jpg", "jpeg", "mp3", "wav", "mp4", "gif", "xlsv", "csv"]);

const createTicketBaseSchema = z.object({
  category: z.string().trim().min(1),
  subcategory: z.string().trim().optional(),
  message: z.string().trim().min(1).max(4000),
  attachments: z.array(z.string().url()).optional(),
  serverId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  serverUrl: z.string().url().optional()
});

const applyTicketRules = (
  payload: z.infer<typeof createTicketBaseSchema>,
  ctx: z.RefinementCtx
): void => {
  const config = CATEGORY_CONFIG.find((item) => item.label === payload.category);
  if (!config) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Catégorie invalide.", path: ["category"] });
    return;
  }
  if (payload.subcategory && !config.subcategories.includes(payload.subcategory)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Sous-catégorie invalide.", path: ["subcategory"] });
  }
  const attachments = payload.attachments?.filter((item) => item.trim().length) ?? [];
  for (const attachment of attachments) {
    if (!isAllowedAttachment(attachment)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Format de pièce jointe invalide.", path: ["attachments"] });
      break;
    }
  }
  if (config.requireServerUrl && !payload.serverUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL du serveur requise.", path: ["serverUrl"] });
  }
  if (config.requireAttachments && attachments.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Au moins une pièce jointe est requise.", path: ["attachments"] });
  }
};

const createTicketSchema = createTicketBaseSchema.superRefine(applyTicketRules);

const adminCreateTicketSchema = createTicketBaseSchema
  .extend({
    userId: z.string().uuid()
  })
  .superRefine(applyTicketRules);

const messageSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  attachments: z.array(z.string().url()).optional()
});

const adminListSchema = z.object({
  status: z.string().optional(),
  adminUserId: z.union([z.string().uuid(), z.literal("none")]).optional(),
  userId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  priority: z.coerce.number().int().min(1).max(9).optional(),
  search: z.string().optional()
});

const adminUpdateSchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  assignedAdminId: z.string().uuid().nullable().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional()
});

function isAllowedAttachment(url: string): boolean {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    const extension = path.split(".").pop() ?? "";
    return allowedExtensions.has(extension);
  } catch {
    return false;
  }
}

function getCategoryConfig(label: string) {
  return CATEGORY_CONFIG.find((item) => item.label === label) ?? null;
}

function getPriorityForCategory(category: string): number | null {
  const config = getCategoryConfig(category);
  return config ? config.priority : null;
}

function shouldSetStatusOnAdminReply(currentStatus: string): string | null {
  if (currentStatus === "Clôturé") return null;
  if (currentStatus === "Résolu") return null;
  return "En attente utilisateur";
}

function shouldSetStatusOnUserReply(currentStatus: string): string | null {
  if (currentStatus === "En attente utilisateur") return "Ouvert";
  return null;
}

function isClosedStatus(status: string): boolean {
  return CLOSED_STATUSES.has(status);
}

function canReopenTicket(ticket: { status: string; updated_at: string }): boolean {
  if (!isClosedStatus(ticket.status)) return false;
  const closedAt = new Date(ticket.updated_at).getTime();
  if (!Number.isFinite(closedAt)) return false;
  return Date.now() - closedAt <= REOPEN_WINDOW_MS;
}

function generateTicketReference(): string {
  const value = Math.floor(Math.random() * 1_000_000);
  return `TKT-${String(value).padStart(6, "0")}`;
}

export async function getUserTickets(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }
  const tickets = await listUserTickets(userId);
  res.json({ tickets });
}

export async function getUserTicket(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }
  const ticketId = req.params.ticketId;
  const ticket = await getTicketById(ticketId);
  if (!ticket || ticket.user_id !== userId) {
    res.status(404).json({ message: "Ticket introuvable." });
    return;
  }
  const messages = await getTicketMessages(ticketId);
  res.json({ ticket, messages });
}

export async function postUserTicket(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }

  const payload = createTicketSchema.parse(req.body);
  const priority = getPriorityForCategory(payload.category);
  if (priority === null) {
    res.status(400).json({ message: "Catégorie invalide." });
    return;
  }

  if (payload.serverId) {
    const ownerId = await getServerOwner(payload.serverId);
    if (!ownerId || ownerId !== userId) {
      res.status(403).json({ message: "Accès refusé au serveur sélectionné." });
      return;
    }
  }

  if (payload.subscriptionId) {
    const ownerId = await getSubscriptionOwner(payload.subscriptionId);
    if (!ownerId || ownerId !== userId) {
      res.status(403).json({ message: "Accès refusé à l'abonnement sélectionné." });
      return;
    }
  }

  const attachments = payload.attachments?.map((item: string) => item.trim()).filter(Boolean) ?? [];
  let reference = generateTicketReference();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const created = await createTicketWithMessage({
        reference,
        userId,
        status: "En attente d’attribution",
        priority,
        category: payload.category,
        subcategory: payload.subcategory ?? null,
        serverId: payload.serverId ?? null,
        subscriptionId: payload.subscriptionId ?? null,
        serverUrl: payload.serverUrl ?? null,
        message: payload.message,
        attachments
      });
      const ticket = await getTicketById(created.ticket.id);
      const messages = await getTicketMessages(created.ticket.id);
      res.status(201).json({ ticket, messages, reference });
      return;
    } catch (error) {
      if (isUniqueViolation(error)) {
        reference = generateTicketReference();
        continue;
      }
      throw error;
    }
  }

  res.status(500).json({ message: "Création du ticket impossible." });
}

export async function postUserTicketMessage(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }
  const ticketId = req.params.ticketId;
  const ticket = await getTicketById(ticketId);
  if (!ticket || ticket.user_id !== userId) {
    res.status(404).json({ message: "Ticket introuvable." });
    return;
  }
  const payload = messageSchema.parse(req.body);
  const attachments = payload.attachments?.map((item) => item.trim()).filter(Boolean) ?? [];
  for (const attachment of attachments) {
    if (!isAllowedAttachment(attachment)) {
      res.status(400).json({ message: "Format de pièce jointe invalide." });
      return;
    }
  }

  const reopenAllowed = canReopenTicket(ticket);
  if (isClosedStatus(ticket.status) && !reopenAllowed) {
    res.status(403).json({ message: "Ce ticket est résolu ou clôturé. Vous pouvez le rouvrir jusqu'à 7 jours après sa résolution ou clôture." });
    return;
  }

  let nextStatus = shouldSetStatusOnUserReply(ticket.status);
  if (reopenAllowed) {
    nextStatus = "Ouvert";
  }
  const message = await createTicketMessage({
    ticketId,
    userId,
    authorRole: "user",
    message: payload.message,
    attachments,
    nextStatus
  });
  res.status(201).json({ message });
}

export async function getAdminTickets(req: Request, res: Response): Promise<void> {
  const query = adminListSchema.parse(req.query);
  if (query.status && !TICKET_STATUSES.includes(query.status as (typeof TICKET_STATUSES)[number])) {
    res.status(400).json({ message: "Statut invalide." });
    return;
  }
  const tickets = await listAdminTickets({
    status: query.status,
    adminUserId: query.adminUserId,
    userId: query.userId,
    from: query.from,
    to: query.to,
    priority: query.priority,
    search: query.search
  });
  res.json({ tickets });
}

export async function postAdminTicket(req: Request, res: Response): Promise<void> {
  const adminId = req.user?.sub;
  if (!adminId) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }
  const payload = adminCreateTicketSchema.parse(req.body);
  const user = await findUserById(payload.userId);
  if (!user) {
    res.status(404).json({ message: "Utilisateur introuvable." });
    return;
  }
  const priority = getPriorityForCategory(payload.category);
  if (priority === null) {
    res.status(400).json({ message: "Catégorie invalide." });
    return;
  }
  const config = getCategoryConfig(payload.category);
  if (payload.subcategory && config && !config.subcategories.includes(payload.subcategory)) {
    res.status(400).json({ message: "Sous-catégorie invalide." });
    return;
  }

  if (payload.serverId) {
    const ownerId = await getServerOwner(payload.serverId);
    if (!ownerId || ownerId !== payload.userId) {
      res.status(403).json({ message: "Serveur non associé à l'utilisateur." });
      return;
    }
  }
  if (payload.subscriptionId) {
    const ownerId = await getSubscriptionOwner(payload.subscriptionId);
    if (!ownerId || ownerId !== payload.userId) {
      res.status(403).json({ message: "Abonnement non associé à l'utilisateur." });
      return;
    }
  }

  const attachments = payload.attachments?.map((item) => item.trim()).filter(Boolean) ?? [];
  for (const attachment of attachments) {
    if (!isAllowedAttachment(attachment)) {
      res.status(400).json({ message: "Format de pièce jointe invalide." });
      return;
    }
  }

  const { ticket, message } = await createTicketWithAdminMessage({
    reference: generateTicketReference(),
    userId: payload.userId,
    adminUserId: adminId,
    status: "Ouvert",
    priority,
    category: payload.category,
    subcategory: payload.subcategory,
    serverId: payload.serverId,
    subscriptionId: payload.subscriptionId,
    serverUrl: payload.serverUrl,
    message: payload.message,
    attachments
  });
  res.status(201).json({ ticket, message });
}

export async function getAdminTicket(req: Request, res: Response): Promise<void> {
  const ticketId = req.params.ticketId;
  const ticket = await getTicketById(ticketId);
  if (!ticket) {
    res.status(404).json({ message: "Ticket introuvable." });
    return;
  }
  const messages = await getTicketMessages(ticketId);
  res.json({ ticket, messages });
}

export async function patchAdminTicket(req: Request, res: Response): Promise<void> {
  const ticketId = req.params.ticketId;
  const ticket = await getTicketById(ticketId);
  if (!ticket) {
    res.status(404).json({ message: "Ticket introuvable." });
    return;
  }

  const payload = adminUpdateSchema.parse(req.body);
  let priority = payload.category ? getPriorityForCategory(payload.category) : null;
  if (payload.category && priority === null) {
    res.status(400).json({ message: "Catégorie invalide." });
    return;
  }
  const config = payload.category ? getCategoryConfig(payload.category) : null;
  if (payload.subcategory && config && !config.subcategories.includes(payload.subcategory)) {
    res.status(400).json({ message: "Sous-catégorie invalide." });
    return;
  }

  await updateTicket({
    ticketId,
    status: payload.status,
    assignedAdminId: payload.assignedAdminId === undefined ? undefined : payload.assignedAdminId,
    category: payload.category,
    subcategory: payload.subcategory,
    priority: priority ?? undefined
  });

  if (payload.assignedAdminId && ticket.status === "En attente d’attribution" && !payload.status) {
    await updateTicket({ ticketId, status: "Ouvert" });
  }

  const updated = await getTicketById(ticketId);
  res.json({ ticket: updated });
}

export async function postAdminTicketMessage(req: Request, res: Response): Promise<void> {
  const adminId = req.user?.sub;
  if (!adminId) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }
  const ticketId = req.params.ticketId;
  const ticket = await getTicketById(ticketId);
  if (!ticket) {
    res.status(404).json({ message: "Ticket introuvable." });
    return;
  }
  const payload = messageSchema.parse(req.body);
  const attachments = payload.attachments?.map((item) => item.trim()).filter(Boolean) ?? [];
  for (const attachment of attachments) {
    if (!isAllowedAttachment(attachment)) {
      res.status(400).json({ message: "Format de pièce jointe invalide." });
      return;
    }
  }

  const nextStatus = shouldSetStatusOnAdminReply(ticket.status);
  const message = await createTicketMessage({
    ticketId,
    adminUserId: adminId,
    authorRole: "admin",
    message: payload.message,
    attachments,
    nextStatus
  });
  res.status(201).json({ message });
}

export async function postAdminTicketAssign(req: Request, res: Response): Promise<void> {
  const adminId = req.user?.sub;
  if (!adminId) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }
  const ticketId = req.params.ticketId;
  const ticket = await getTicketById(ticketId);
  if (!ticket) {
    res.status(404).json({ message: "Ticket introuvable." });
    return;
  }
  await updateTicket({
    ticketId,
    assignedAdminId: adminId,
    status: ticket.status === "En attente d’attribution" ? "Ouvert" : ticket.status
  });
  const updated = await getTicketById(ticketId);
  res.json({ ticket: updated });
}

export async function postTicketAttachments(req: Request, res: Response): Promise<void> {
  const files: Express.Multer.File[] = Array.isArray(req.files) ? req.files : req.files ? Object.values(req.files).flat() : [];
  if (!files.length) {
    res.status(400).json({ message: "Aucun fichier reçu." });
    return;
  }
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const urls = files.map((file) => `${baseUrl}/uploads/tickets/${file.filename}`);
  res.status(201).json({ files: urls });
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string };
  return maybe.code === "23505";
}
