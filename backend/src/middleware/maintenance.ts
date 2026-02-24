import type { NextFunction, Request, Response } from "express";
import { getMaintenanceSettings } from "../repositories/systemRepository.js";

export async function maintenanceGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Allow access to maintenance page and API
  if (req.path.startsWith("/api/maintenance") || req.path.startsWith("/maintenance")) {
    return next();
  }

  const settings = await getMaintenanceSettings();
  if (settings.is_enabled) {
    const allowedIps = settings.allowed_ips?.split(",").map(ip => ip.trim()) || [];
    const userIp = req.ip;

    if (allowedIps.includes(userIp)) {
      // Add a header to notify the frontend that maintenance is on, but access is granted
      res.setHeader("X-Maintenance-Mode", "active-bypass");
      return next();
    }

    // For API requests, send a 503 response
    if (req.path.startsWith("/api/")) {
      res.status(503).json({ message: "Service temporarily unavailable due to maintenance." });
      return;
    }

    // For other requests, redirect to the maintenance page
    res.redirect("/maintenance");
    return;
  }

  next();
}
