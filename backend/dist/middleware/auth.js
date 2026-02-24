import { verifyAccessToken } from "../utils/jwt.js";
export function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ message: "Authentification requise." });
        return;
    }
    const token = header.slice("Bearer ".length);
    try {
        req.user = verifyAccessToken(token);
        next();
    }
    catch {
        res.status(401).json({ message: "Token invalide ou expiré." });
    }
}
export function optionalAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        next();
        return;
    }
    const token = header.slice("Bearer ".length);
    try {
        req.user = verifyAccessToken(token);
    }
    catch {
        req.user = undefined;
    }
    next();
}
export function requireAdmin(req, res, next) {
    if (req.user?.role !== "admin") {
        res.status(403).json({ message: "Accès administrateur requis." });
        return;
    }
    next();
}
