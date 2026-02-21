# 🐛 Guide de Dépannage - Erreur InvalidSession

## ❌ Erreur : Failed to connect shard - InvalidSession

### 🔍 Description de l'erreur

```
❌ Erreur fatale: Failed to connect shard: {
  'type': 'Error', 
  'data': {
    'type': 'InvalidSession',
    'location': 'crates/core/database/src/models/users/model.rs:327:38'
  }
}
```

Cette erreur signifie que **le token du bot n'est pas valide** ou que la session ne peut pas être établie avec Stoat.chat.

## 🎯 Causes possibles

### 1. Token invalide ou expiré ❌
- Le token a été régénéré sur Stoat.chat
- Le token a été révoqué
- Le bot a été supprimé puis recréé
- Erreur de copie/colle du token

### 2. Bot supprimé ou désactivé 🗑️
- Le bot n'existe plus sur Stoat.chat
- Le bot a été banni du serveur
- Les permissions ont été révoquées

### 3. Problème de format du token 📝
- Espaces en début/fin du token
- Token tronqué ou incomplet
- Caractères spéciaux mal encodés

### 4. Problème de connexion réseau 🌐
- Pare-feu bloquant la connexion
- Proxy non configuré
- Problème DNS

## 🔧 Solutions

### Solution 1 : Vérifier et régénérer le token (RECOMMANDÉ)

#### Étape 1 : Accéder à votre bot sur Stoat.chat

1. Connectez-vous sur https://stoat.chat
2. Allez dans les paramètres de votre bot
3. Section "Bot" ou "Developer"
4. Trouvez votre bot avec l'ID : `01KHH28MG46TJV87ANE790EBNT`

#### Étape 2 : Régénérer le token

1. Dans les paramètres du bot, cherchez "Regenerate Token" ou "Réinitialiser le token"
2. Cliquez sur le bouton pour générer un nouveau token
3. **COPIEZ IMMÉDIATEMENT** le nouveau token (il ne sera affiché qu'une fois)

#### Étape 3 : Mettre à jour le fichier .env

1. Ouvrez le fichier `.env` dans le dossier `QUOKKA/bot`
2. Remplacez l'ancienne valeur de `BOT_TOKEN` par le nouveau token
3. Assurez-vous qu'il n'y a **pas d'espaces** avant ou après le token
4. Sauvegardez le fichier

**Format correct :**
```env
BOT_TOKEN=votre_nouveau_token_ici_sans_espaces
WELCOME_CHANNEL_ID=01KHCH5Y324FH1HP45S6JZJ1H4
SERVER_ID=01KHCAG6RSNPY7DE9MDEVYKRFD
```

**Format incorrect :**
```env
BOT_TOKEN= votre_token_avec_espaces 
BOT_TOKEN="votre_token_entre_guillemets"
```

#### Étape 4 : Tester à nouveau

```bash
cd QUOKKA/bot
python test_config.py
python welcome_bot.py
```

### Solution 2 : Vérifier que le bot existe toujours

1. Allez sur https://stoat.chat
2. Vérifiez que le bot avec l'ID `01KHH28MG46TJV87ANE790EBNT` existe toujours
3. Si le bot a été supprimé, vous devrez en créer un nouveau

**Pour créer un nouveau bot :**

1. Sur Stoat.chat, allez dans Settings > Bots
2. Créez un nouveau bot
3. Copiez le **nouvel ID** et le **nouveau token**
4. Mettez à jour le fichier `.env` avec les nouvelles valeurs

### Solution 3 : Vérifier les permissions du bot

1. Sur Stoat.chat, vérifiez que le bot est bien dans le serveur
2. Vérifiez qu'il a les permissions nécessaires :
   - Lire les messages
   - Envoyer des messages
   - Voir les membres

### Solution 4 : Nettoyer et redémarrer

```bash
# 1. Arrêter complètement Python
# Fermez tous les terminaux avec Python en cours

# 2. Nettoyer le cache
python -m pip cache purge

# 3. Réinstaller stoat.py
pip uninstall stoat.py -y
pip install stoat.py

# 4. Redémarrer le bot
python welcome_bot.py
```

## 🧪 Script de validation du token

J'ai créé un script pour valider votre token avant de démarrer le bot.

**Fichier : `validate_token.py`**

```python
"""
Script pour valider le token du bot Stoat.chat
"""
import os
import asyncio
import stoat
from dotenv import load_dotenv

# Charger .env
load_dotenv()

async def validate_token():
    """Valider le token du bot"""
    token = os.getenv('BOT_TOKEN')
    
    if not token:
        print('[ERREUR] BOT_TOKEN non défini dans .env')
        return False
    
    print(f'[INFO] Token trouvé: {token[:10]}...{token[-10:]}')
    print('[INFO] Tentative de connexion...')
    
    try:
        client = stoat.Client()
        
        # Créer un événement pour savoir quand on est connecté
        connected = asyncio.Event()
        
        @client.on(stoat.ReadyEvent)
        async def on_ready(event, /):
            print(f'[SUCCES] Connexion réussie!')
            print(f'[INFO] Bot: {event.me.tag}')
            print(f'[INFO] ID: {event.me.id}')
            connected.set()
            await client.close()
        
        # Démarrer la connexion
        task = asyncio.create_task(client.start(token))
        
        # Attendre la connexion ou timeout
        try:
            await asyncio.wait_for(connected.wait(), timeout=10.0)
            print('[SUCCES] Token valide!')
            return True
        except asyncio.TimeoutError:
            print('[ERREUR] Timeout - Le bot n\'a pas pu se connecter')
            await client.close()
            return False
            
    except Exception as e:
        print(f'[ERREUR] Échec de validation: {e}')
        return False

if __name__ == '__main__':
    result = asyncio.run(validate_token())
    if result:
        print('\n[OK] Vous pouvez démarrer le bot!')
    else:
        print('\n[ERREUR] Token invalide - Veuillez le régénérer sur Stoat.chat')
```

**Utilisation :**
```bash
python validate_token.py
```

## 📝 Checklist de dépannage

Suivez cette checklist dans l'ordre :

```
[ ] 1. Vérifier que le bot existe sur Stoat.chat
[ ] 2. Régénérer le token du bot
[ ] 3. Copier le nouveau token (SANS espaces)
[ ] 4. Mettre à jour .env avec le nouveau token
[ ] 5. Vérifier qu'il n'y a pas de guillemets autour du token
[ ] 6. Exécuter : python validate_token.py
[ ] 7. Si validation OK : python welcome_bot.py
[ ] 8. Si validation KO : recommencer depuis l'étape 1
```

## 🔍 Autres erreurs liées

### Erreur : Unclosed client session

Cette erreur apparaît souvent avec `InvalidSession`. Elle est causée par la fermeture incorrecte de la session HTTP.

**Solution :** Cette erreur disparaîtra une fois que le token sera valide.

### Erreur : Event loop is closed

Cette erreur est une conséquence de l'erreur `InvalidSession`.

**Solution :** Corrigez le token invalide et cette erreur disparaîtra.

## 📞 Besoin d'aide supplémentaire ?

### Option 1 : Créer un nouveau bot

Si vous ne pouvez pas accéder au bot actuel :

1. Créez un **nouveau bot** sur Stoat.chat
2. Copiez le **nouveau token** et le **nouvel ID**
3. Mettez à jour `.env` :

```env
BOT_TOKEN=nouveau_token_ici
```

4. Mettez à jour l'ID du bot si nécessaire (dans les commentaires du code)

### Option 2 : Vérifier sur le serveur Stoat

Rejoignez le serveur de support Stoat : https://rvlt.gg/ZZQb4sxx

### Option 3 : Consulter les logs

Activez les logs détaillés en utilisant `advanced_bot.py` avec `"verbose": true` dans `config.json`

## 🎯 Résumé

**Cause principale :** Token invalide ou expiré

**Solution rapide :**
1. Régénérer le token sur https://stoat.chat
2. Mettre à jour `.env`
3. Redémarrer le bot

**Prévention :**
- Ne partagez jamais votre token
- Sauvegardez votre token dans un endroit sûr
- Utilisez `validate_token.py` avant chaque démarrage

---

**Dernière mise à jour :** 15 février 2026
**Version du guide :** 1.0
