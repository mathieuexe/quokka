import { Router } from "express";
import { login, register, verifyEmail, verify2FA, resendCode, startDiscordLogin, handleDiscordCallback } from "../controllers/authController.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/verify-email", verifyEmail);
authRoutes.post("/verify-2fa", verify2FA);
authRoutes.post("/resend-code", resendCode);
authRoutes.get("/discord", startDiscordLogin);
authRoutes.get("/discord/callback", handleDiscordCallback);