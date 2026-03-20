import "express-async-errors";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { join } from "path";
import { env } from "./config/env.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { stripeWebhook } from "./controllers/paymentController.js";
import { paymentRoutes } from "./routes/paymentRoutes.js";
import { serverRoutes } from "./routes/serverRoutes.js";
import { systemRoutes } from "./routes/systemRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { chatRoutes } from "./routes/chatRoutes.js";
import { ticketRoutes } from "./routes/ticketRoutes.js";
import { blogRoutes } from "./routes/blogRoutes.js";
import { handleDiscordCallback } from "./controllers/authController.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { maintenanceGuard } from "./middleware/maintenance.js";
export const app = express();
const allowedOrigins = [
    env.CORS_ORIGIN,
    env.CORS_ORIGIN.replace("https://www.", "https://"),
    `https://www.${env.CORS_ORIGIN.replace("https://", "")}`,
].filter(Boolean);
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true
}));
app.use(compression({ level: 6 }));
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);
app.use(express.json({ limit: "1mb" }));
app.use(maintenanceGuard);
import { publicLimiter } from "./middlewares/rateLimiter.middleware.js";
app.use("/api", publicLimiter);
app.use("/uploads", express.static(join(process.cwd(), "uploads"), { maxAge: "7d", immutable: true }));
app.get("/discord/callback", handleDiscordCallback);
app.post("/discord/callback", handleDiscordCallback);
app.use("/api", systemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/blog", blogRoutes);
app.use(notFound);
app.use(errorHandler);
