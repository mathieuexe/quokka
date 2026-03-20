# Audit et Optimisations de Performance - QUOKKA

Ce document résume l'ensemble des optimisations de performance appliquées au projet Quokka (Frontend & Backend), ainsi que les recommandations pour les futures améliorations.

## 1. Optimisations Frontend appliquées

### 1.1. Découpage du Bundle (Code Splitting)
- **Configuration Vite** : Utilisation de `manualChunks` dans `vite.config.ts` pour séparer les dépendances lourdes.
  - `react-vendor` : React, React DOM, React Router.
  - `i18n-vendor` : i18next et ses plugins.
  - `icons` : Lucide React.
  - `pages-admin` / `pages-public` : Séparation contextuelle.
- **Résultat** : Lors du build (`npm run build`), **aucun chunk généré ne dépasse la limite de 500 KB** (le plus gros fichier, le main chunk, pèse ~387 KB non-compressé, ce qui est excellent).
- **Compression** : Double compression Gzip (`.gz`) et Brotli (`.br`) générée au moment du build.

### 1.2. Gestion de l'état asynchrone (React Query)
- Remplacement des fetchs manuels par `@tanstack/react-query` sur les pages critiques (`HomePage`, `ServerPage`, `UserProfilePage`).
- **Mise en cache locale** :
  - `staleTime: 5 minutes` (évite de re-fetcher si l'utilisateur navigue rapidement).
  - `gcTime: 10 minutes` (conservation en mémoire).
  - `refetchOnWindowFocus: false` (réduit la charge serveur intempestive).

## 2. Optimisations Backend appliquées

### 2.1. Mise en cache des requêtes (Cache Middleware)
Une vérification a confirmé que le `cacheMiddleware` (en mémoire) est appliqué sur **toutes les routes GET publiques importantes** :
- `GET /api/servers` (60s)
- `GET /api/servers/categories` (300s)
- `GET /api/servers/:serverId` (60s)
- `GET /api/system/maintenance` (60s)
- `GET /api/system/announcement` (300s)
- `GET /api/system/branding` (300s)
- `GET /api/blog/posts` (300s)
- `GET /api/users/:userId/profile` (60s)

### 2.2. Pagination des données
L'audit du code (`backend/src/controllers`) a validé que **toutes les routes retournant des listes** utilisent systématiquement la pagination (`paginationSchema.parse(req.query)` avec `page` et `limit`) :
- Toutes les routes Admin (`getAdminUsers`, `getAdminServers`, `getAdminBilling`, `getAdminTickets`, `getAdminPromoCodes`, etc.).
- Les routes publiques (`getHomeServers`, `getPublicBlogPosts`).
- Les routes utilisateur (`getUserTickets`, `getMyOrders`).
- Les routes de modération (`listAllWarningsHandler`).

---

## 3. Optimisations restantes (À prévoir)

Bien que le projet soit déjà très performant, voici les axes d'amélioration identifiés lors de cet audit :

### 3.1. Frontend
1. **Mémorisation React (Rendus inutiles)** : 
   - Appliquer `React.memo` sur le composant `ServerCard` affiché massivement dans des listes.
   - Envelopper les fonctions transmises en props dans `useCallback` (ex: `Header.tsx`).
   - Utiliser `useMemo` pour les filtrages lourds (ex: filtres des serveurs Promus vs Réguliers dans `HomePage.tsx`).
2. **Lazy Loading des Routes** :
   - Implémenter `React.lazy()` et `<Suspense>` dans le routeur (`App.tsx`) pour charger les pages uniquement lorsqu'elles sont visitées (ex: ne pas charger le code Admin pour un simple visiteur).
3. **Vite Plugin Imagemin** :
   - Actuellement présent, ce plugin peut considérablement ralentir les builds sur Windows. Envisager de passer à `vite-plugin-image-optimizer` ou de déléguer l'optimisation des images à un CDN.

### 3.2. Backend
1. **Rate Limiting** :
   - Ajouter le middleware `express-rate-limit` pour protéger les routes sensibles (connexion, votes, création de tickets) contre les attaques par force brute.
2. **Compression Express** :
   - Ajouter le middleware `compression` dans `app.ts` pour compresser dynamiquement les réponses JSON volumineuses en Gzip.
3. **Cache Distribué (Redis)** :
   - Actuellement, le cache serveur utilise une `Map` en mémoire (`serverCache`). Pour un passage à l'échelle (multi-instances), migrer vers **Redis**.
4. **Pagination par Curseur (Keyset Pagination)** :
   - Sur les tables amenées à devenir gigantesques (ex: messages de chat, logs système), remplacer la pagination par `OFFSET` (qui devient lente) par une pagination par curseur (`WHERE id > last_id LIMIT X`).
