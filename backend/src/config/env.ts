import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().min(1),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  NEON_PROJECT_ID: z.string().default("billowing-truth-15759738"),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  STRIPE_PUBLISHABLE_KEY: z.string().optional().default(""),
  RESEND_API_KEY: z.string().optional().default(""),
  DEEPL_API_KEY: z.string().optional().default(""),
  FRONTEND_URL: z.string().url().default("https://quokka.gg"),
  DISCORD_CLIENT_ID: z.string().optional().default(""),
  DISCORD_CLIENT_SECRET: z.string().optional().default(""),
  DISCORD_REDIRECT_URI: z.string().optional().default(""),
  DISCORD_SESSION_SECRET: z.string().optional().default(""),
  IPINFO_TOKEN: z.string().optional().default(""),
  PG_POOL_MAX: z.coerce.number().int().positive().optional(),
  PG_POOL_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  PG_POOL_CONN_TIMEOUT_MS: z.coerce.number().int().positive().optional()
});

export const env = envSchema.parse(process.env);
