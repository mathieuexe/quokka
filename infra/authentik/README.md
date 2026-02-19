# Authentik (SSO admin)

## Lancer Authentik en local
- Copier `infra/authentik/.env.example` vers `infra/authentik/.env` et remplacer les valeurs.
- Lancer depuis `infra/authentik` :

```bash
docker compose up -d
```

- Ouvrir Authentik : `http://localhost:9000`

## Créer l’application OIDC (UI Authentik)
- Applications → Providers → créer un Provider **OAuth2/OpenID** (Authorization Code).
- Redirect URIs autorisées :
  - `http://localhost:4000/api/auth/sso/authentik/callback`
- Copier le **Client ID** et le **Client Secret**.
- Noter le slug du provider (ex: `quokka`) pour l’issuer.

## Configurer Quokka backend
Dans `backend/.env` :

```env
AUTHENTIK_ISSUER=http://localhost:9000/application/o/quokka/
AUTHENTIK_CLIENT_ID=xxx
AUTHENTIK_CLIENT_SECRET=xxx
AUTHENTIK_REDIRECT_URI=http://localhost:4000/api/auth/sso/authentik/callback
```

Redémarrer le backend.

## Utilisation
- Aller sur `/login` puis bouton “Connexion admin (SSO)”.
- L’accès est accordé uniquement si l’email SSO correspond à un user existant avec `role=admin`.
