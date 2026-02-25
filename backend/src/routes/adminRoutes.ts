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
  removeAdminServer,
  removeAdminSubscription,
  updateAdminServer,
  updateAdminUser,
  getMaintenanceSettings,
  updateMaintenanceSettings,
  resendVerificationCode,
  removeAdminUser,
  sendAdminMail
} from "../controllers/adminController.js";
import {
  getAdminTicket,
  getAdminTickets,
  patchAdminTicket,
  postAdminTicket,
  postAdminTicketAssign,
  postAdminTicketMessage
} from "../controllers/ticketController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);
adminRoutes.get("/maintenance", getMaintenanceSettings);
adminRoutes.put("/maintenance", updateMaintenanceSettings);
adminRoutes.get("/users", getAdminUsers);
adminRoutes.get("/users/:userId", getAdminUserDetails);
adminRoutes.get("/servers", getAdminServers);
adminRoutes.get("/promo-codes", getAdminPromoCodes);
adminRoutes.get("/subscriptions", getAdminSubscriptions);
adminRoutes.get("/billing", getAdminBilling);
adminRoutes.patch("/users", updateAdminUser);
adminRoutes.delete("/users", removeAdminUser);
adminRoutes.patch("/servers", updateAdminServer);
adminRoutes.delete("/servers/:serverId", removeAdminServer);
adminRoutes.post("/promo-codes", postAdminPromoCode);
adminRoutes.patch("/promo-codes/active", patchAdminPromoCodeActive);
adminRoutes.delete("/subscriptions", removeAdminSubscription);
adminRoutes.post("/servers/promote", promoteServer);
adminRoutes.patch("/servers/hide", hideServer);
adminRoutes.patch("/servers/visible", makeServerVisible);
adminRoutes.post("/users/resend-code", resendVerificationCode);
adminRoutes.post("/users/send-mail", sendAdminMail);
adminRoutes.get("/tickets", getAdminTickets);
adminRoutes.post("/tickets", postAdminTicket);
adminRoutes.get("/tickets/:ticketId", getAdminTicket);
adminRoutes.patch("/tickets/:ticketId", patchAdminTicket);
adminRoutes.post("/tickets/:ticketId/messages", postAdminTicketMessage);
adminRoutes.post("/tickets/:ticketId/assign", postAdminTicketAssign);
