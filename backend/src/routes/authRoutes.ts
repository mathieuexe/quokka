import { Router } from "express";
import { login, register, verifyEmail, verify2FA, resendCode, startDiscordLogin, handleDiscordCallback } from "../controllers/authController.js";
import { strictLimiter } from "../middlewares/rateLimiter.middleware.js";

export const authRoutes = Router();

authRoutes.post("/register", strictLimiter, register);
authRoutes.post("/login", strictLimiter, login);
authRoutes.post("/verify-email", strictLimiter, verifyEmail);
authRoutes.post("/verify-2fa", strictLimiter, verify2FA);
authRoutes.post("/resend-code", strictLimiter, resendCode);
authRoutes.get("/discord", startDiscordLogin);
authRoutes.post("/discord/callback", handleDiscordCallback);
authRoutes.get("/discord/callback", handleDiscordCallback);
