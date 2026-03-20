import NodeCache from "node-cache";
// Initialisation avec TTL par défaut de 300 secondes
const cache = new NodeCache({ stdTTL: 300 });
/**
 * Middleware pour mettre en cache les requêtes GET.
 * @param duration Optionnel : durée en secondes spécifique pour cette route (sinon 300s)
 */
export const cacheMiddleware = (duration) => {
    return (req, res, next) => {
        if (req.method !== "GET") {
            next();
            return;
        }
        // Récupération de l'ID utilisateur si connecté (pour différencier le cache par utilisateur si besoin)
        // req.user provient du middleware auth
        const userId = req.user?.id || "";
        // Génération de la clé de cache basée sur l'URL et l'ID utilisateur
        const key = `${req.originalUrl}${userId ? `_${userId}` : ""}`;
        // Ajout des headers de cache HTTP pour les requêtes publiques (non connectées)
        if (!userId) {
            res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
        }
        // Vérification du cache
        const cachedResponse = cache.get(key);
        if (cachedResponse) {
            res.set("X-Cache", "HIT");
            res.json(cachedResponse);
            return;
        }
        res.set("X-Cache", "MISS");
        // Interception de res.json pour mettre en cache la réponse
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            // On ne met en cache que les réponses en succès
            if (res.statusCode >= 200 && res.statusCode < 300) {
                if (duration !== undefined) {
                    cache.set(key, body, duration);
                }
                else {
                    cache.set(key, body);
                }
            }
            return originalJson(body);
        };
        next();
    };
};
/**
 * Fonction pour purger le cache par pattern
 * @param pattern Le pattern (string) à chercher dans les clés
 */
export const invalidateCache = (pattern) => {
    const keys = cache.keys();
    const keysToDelete = keys.filter((key) => key.includes(pattern));
    if (keysToDelete.length > 0) {
        cache.del(keysToDelete);
    }
};
