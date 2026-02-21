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
});

export const env = envSchema.parse(process.env);