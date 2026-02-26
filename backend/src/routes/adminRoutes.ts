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
  getAnnouncementSettings,
  updateAnnouncementSettings,
  getSiteBrandingSettings,
  updateSiteBrandingSettings,
  resendVerificationCode,
  removeAdminUser,
  sendAdminMail,
  creditAdminUserBalance,
  debitAdminUserBalance
} from "../controllers/adminController.js";
import {
  deleteAdminBlogCategory,
  deleteAdminBlogPost,
  getAdminBlogCategories,
  getAdminBlogPosts,
  patchAdminBlogCategory,
  patchAdminBlogPost,
  postAdminBlogCategory,
  postAdminBlogPost
} from "../controllers/blogController.js";
import {
  getAdminTicket,
  getAdminTickets,
  patchAdminTicket,
  postAdminTicket,
  postAdminTicketAssign,
  postAdminTicketMessage
} from "../controllers/ticketController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { getAdminNotifications, markAdminNotificationsRead, disableUserTwoFactor } from "../controllers/adminController.js";

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);
adminRoutes.get("/maintenance", getMaintenanceSettings);
adminRoutes.put("/maintenance", updateMaintenanceSettings);
adminRoutes.get("/announcement", getAnnouncementSettings);
adminRoutes.put("/announcement", updateAnnouncementSettings);
adminRoutes.get("/branding", getSiteBrandingSettings);
adminRoutes.put("/branding", updateSiteBrandingSettings);
adminRoutes.get("/users", getAdminUsers);
adminRoutes.get("/users/:userId", getAdminUserDetails);
adminRoutes.post("/users/:userId/disable-2fa", disableUserTwoFactor);
adminRoutes.post("/users/:userId/credit-balance", creditAdminUserBalance);
adminRoutes.post("/users/:userId/debit-balance", debitAdminUserBalance);
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
adminRoutes.get("/notifications", getAdminNotifications);
adminRoutes.post("/notifications/read", markAdminNotificationsRead);
adminRoutes.get("/blog/categories", getAdminBlogCategories);
adminRoutes.post("/blog/categories", postAdminBlogCategory);
adminRoutes.patch("/blog/categories", patchAdminBlogCategory);
adminRoutes.delete("/blog/categories/:categoryId", deleteAdminBlogCategory);
adminRoutes.get("/blog/posts", getAdminBlogPosts);
adminRoutes.post("/blog/posts", postAdminBlogPost);
adminRoutes.patch("/blog/posts", patchAdminBlogPost);
adminRoutes.delete("/blog/posts/:postId", deleteAdminBlogPost);
adminRoutes.get("/tickets", getAdminTickets);
adminRoutes.post("/tickets", postAdminTicket);
adminRoutes.get("/tickets/:ticketId", getAdminTicket);
adminRoutes.patch("/tickets/:ticketId", patchAdminTicket);
adminRoutes.post("/tickets/:ticketId/messages", postAdminTicketMessage);
adminRoutes.post("/tickets/:ticketId/assign", postAdminTicketAssign);
