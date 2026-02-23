import { Router } from "express";
import {
  getAdminBilling,
  getAdminSubscriptions,
  getAdminServers,
  getAdminUserDetails,
  getAdminUsers,
  getAdminPromoCodes,
  hideServer,
  makeServerVisible,
  patchAdminPromoCodeActive,
  postAdminPromoCode,
  promoteServer,
  removeAdminSubscription,
  updateAdminServer,
  updateAdminUser,
  resendVerificationCode,
  removeAdminUser
} from "../controllers/adminController.js";
import { getAdminTicket, getAdminTickets, patchAdminTicket, postAdminTicketAssign, postAdminTicketMessage } from "../controllers/ticketController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);
adminRoutes.get("/users", getAdminUsers);
adminRoutes.get("/users/:userId", getAdminUserDetails);
adminRoutes.get("/servers", getAdminServers);
adminRoutes.get("/promo-codes", getAdminPromoCodes);
adminRoutes.get("/subscriptions", getAdminSubscriptions);
adminRoutes.get("/billing", getAdminBilling);
adminRoutes.patch("/users", updateAdminUser);
adminRoutes.delete("/users", removeAdminUser);
adminRoutes.patch("/servers", updateAdminServer);
adminRoutes.post("/promo-codes", postAdminPromoCode);
adminRoutes.patch("/promo-codes/active", patchAdminPromoCodeActive);
adminRoutes.delete("/subscriptions", removeAdminSubscription);
adminRoutes.post("/servers/promote", promoteServer);
adminRoutes.patch("/servers/hide", hideServer);
adminRoutes.patch("/servers/visible", makeServerVisible);
adminRoutes.post("/users/resend-code", resendVerificationCode);
adminRoutes.get("/tickets", getAdminTickets);
adminRoutes.get("/tickets/:ticketId", getAdminTicket);
adminRoutes.patch("/tickets/:ticketId", patchAdminTicket);
adminRoutes.post("/tickets/:ticketId/messages", postAdminTicketMessage);
adminRoutes.post("/tickets/:ticketId/assign", postAdminTicketAssign);
