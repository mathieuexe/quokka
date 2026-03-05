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

function readBearerToken(value: string | undefined): string | null {
  if (!value?.startsWith("Bearer ")) return null;
  const token = value.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

function readHeaderToken(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    const token = value.trim();
    return token.length > 0 ? token : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const token = item.trim();
      if (token.length > 0) return token;
    }
  }
  return null;
}

function readBodyToken(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  if (!("token" in body)) return null;
  const token = (body as { token?: unknown }).token;
  if (typeof token !== "string") return null;
  const normalized = token.trim();
  return normalized.length > 0 ? normalized : null;
}

function extractAccessToken(req: Request): string | null {
  const bearerToken = readBearerToken(req.headers.authorization);
  if (bearerToken) return bearerToken;

  const headerToken = readHeaderToken(req.headers["x-access-token"]);
  if (headerToken) return headerToken;

  const queryToken = typeof req.query.token === "string" ? req.query.token.trim() : "";
  if (queryToken.length > 0) return queryToken;

  return readBodyToken(req.body);
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
  const token = extractAccessToken(req);
  if (!token) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Token invalide ou expiré." });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractAccessToken(req);
  if (!token) {
    next();
    return;
  }
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
