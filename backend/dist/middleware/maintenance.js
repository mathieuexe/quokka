import { getMaintenanceSettings } from "../repositories/systemRepository.js";
export async function maintenanceGuard(req, res, next) {
    // Allow access to maintenance page and API
    if (req.path.startsWith("/api/maintenance") || req.path.startsWith("/maintenance")) {
        return next();
    }
    try {
        const settings = await getMaintenanceSettings();
        if (settings.is_enabled) {
            const allowedIps = settings.allowed_ips?.split(",").map((ip) => ip.trim()) || [];
            const userIp = req.ip;
            if (userIp && allowedIps.includes(userIp)) {
                res.setHeader("X-Maintenance-Mode", "active-bypass");
                return next();
            }
            if (req.path.startsWith("/api/")) {
                res.status(503).json({ message: "Service temporarily unavailable due to maintenance." });
                return;
            }
            res.redirect("/maintenance");
            return;
        }
    }
    catch {
        return next();
    }
    next();
}
