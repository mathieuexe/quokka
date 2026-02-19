# Migration : Système de vérification email et 2FA

## Description

Cette migration ajoute un système complet de vérification par email et d'authentification à deux facteurs (2FA) :

- **Vérification email** : Lors de l'inscription, un code à 6 chiffres est envoyé par email pour vérifier l'adresse
- **2FA à la connexion** : À chaque connexion, un code de sécurité est envoyé par email (activé par défaut, désactivable par utilisateur)

## Tables créées

1. **email_verification_codes** : Stocke les codes de vérification pour l'inscription
2. **two_factor_codes** : Stocke les codes 2FA pour la connexion

## Colonnes ajoutées à la table `users`

- `email_verified` : BOOLEAN - Indique si l'email a été vérifié
- `two_factor_enabled` : BOOLEAN - Active/désactive la 2FA pour l'utilisateur (TRUE par défaut)

## Application de la migration

### Option 1 : Via psql (recommandé)

```bash
psql "postgresql://neondb_owner:npg_IhxkNB6JTOP4@ep-hidden-heart-ab7nexzg-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require" -f sql/013_email_verification_and_2fa.sql
```

### Option 2 : Via l'interface Neon

1. Connectez-vous à [console.neon.tech](https://console.neon.tech)
2. Sélectionnez votre projet "billowing-truth-15759738"
3. Allez dans "SQL Editor"
4. Copiez le contenu du fichier `sql/013_email_verification_and_2fa.sql`
5. Collez-le et exécutez

## Configuration requise

Assurez-vous que la clé API Resend est configurée dans `.env` :

```
RESEND_API_KEY=re_hyc3FTZg_83zJyRGFoGrHsSuqRzu9BbRw
```

## Nouvelles routes API

### Authentification

- `POST /api/auth/register` - Inscription (envoie un code de vérification)
- `POST /api/auth/login` - Connexion (envoie un code 2FA si activé)
- `POST /api/auth/verify-email` - Vérifie le code d'inscription
- `POST /api/auth/verify-2fa` - Vérifie le code 2FA
- `POST /api/auth/resend-code` - Renvoie un code (vérification ou 2FA)

### Nouvelles pages frontend

- `/verify-email?userId=xxx` - Page de vérification email après inscription
- `/verify-2fa?userId=xxx` - Page de vérification 2FA à la connexion

## Fonctionnement

### Inscription

1. L'utilisateur remplit le formulaire d'inscription
2. Un code à 6 chiffres est généré et envoyé par email
3. L'utilisateur est redirigé vers `/verify-email`
4. Après vérification du code, le compte est activé et l'utilisateur est connecté

### Connexion

1. L'utilisateur saisit email et mot de passe
2. Si la 2FA est activée (par défaut), un code est envoyé par email
3. L'utilisateur est redirigé vers `/verify-2fa`
4. Après vérification du code, l'utilisateur est connecté

## Sécurité

- Les codes expirent après 10 minutes
- Les codes sont à usage unique
- Les codes usagés ou expirés sont automatiquement invalidés
- Les emails incluent des avertissements de sécurité

## Désactivation de la 2FA

Pour désactiver la 2FA pour un utilisateur spécifique :

```sql
UPDATE users SET two_factor_enabled = FALSE WHERE email = 'user@example.com';
```

## Nettoyage automatique

Il est recommandé de créer un cron job pour nettoyer les codes expirés :

```sql
-- Supprimer les codes de vérification expirés
DELETE FROM email_verification_codes WHERE expires_at < NOW();

-- Supprimer les codes 2FA expirés
DELETE FROM two_factor_codes WHERE expires_at < NOW();
```
