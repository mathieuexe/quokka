import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { verifyAccessToken } from "../utils/jwt.js";

export type IpTrace = {
  ip: string | null;
  provider: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
};

function normalizeForwardedFor(value: string | undefined): string | null {
  if (!value) return null;
  const parts = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  return parts.length ? parts[0] : null;
}

export function getRequestIp(req: Request): string | null {
  const forwarded = typeof req.headers["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"] : undefined;
  const realIp = typeof req.headers["x-real-ip"] === "string" ? req.headers["x-real-ip"] : undefined;
  return normalizeForwardedFor(forwarded) ?? realIp ?? req.socket?.remoteAddress ?? null;
}

export async function resolveIpTrace(ip: string | null): Promise<IpTrace> {
  if (!ip) {
    return { ip: null, provider: null, country: null, region: null, city: null };
  }
  if (!env.IPINFO_TOKEN) {
    return { ip, provider: null, country: null, region: null, city: null };
  }
  try {
    const response = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}?token=${env.IPINFO_TOKEN}`);
    if (!response.ok) {
      return { ip, provider: null, country: null, region: null, city: null };
    }
    const data = (await response.json()) as Record<string, unknown>;
    return {
      ip,
      provider: typeof data.org === "string" ? data.org : null,
      country: typeof data.country === "string" ? data.country : null,
      region: typeof data.region === "string" ? data.region : null,
      city: typeof data.city === "string" ? data.city : null
    };
  } catch {
    return { ip, provider: null, country: null, region: null, city: null };
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }

  const token = header.slice("Bearer ".length);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Token invalide ou expiré." });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = header.slice("Bearer ".length);
  try {
    req.user = verifyAccessToken(token);
  } catch {
    req.user = undefined;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    res.status(403).json({ message: "Accès administrateur requis." });
    return;
  }
  next();
}
