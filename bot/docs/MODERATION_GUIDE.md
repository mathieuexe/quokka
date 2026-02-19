# 🛡️ Guide du Système de Modération - Bot QUOKKA

## 📋 Vue d'ensemble

Le bot QUOKKA inclut maintenant un **système de modération automatique** pour les soumissions de serveurs. Chaque serveur soumis dans le canal de soumission doit être approuvé par un modérateur avant d'être publié.

## 🎯 Fonctionnement

### 1️⃣ Soumission d'un Serveur

Lorsqu'un utilisateur envoie un message dans le **canal de soumission**, le bot :

```
1. Détecte automatiquement le message
2. Ajoute deux réactions :
   ✅ Pour approuver
   ❌ Pour refuser
3. Envoie un message de confirmation à l'utilisateur
4. Met le message en attente de modération
```

### 2️⃣ Modération

Un **modérateur autorisé** clique sur :
- **✅ (Coche verte)** → Le serveur est **approuvé** et publié
- **❌ (Croix rouge)** → Le serveur est **refusé** et le message est supprimé

### 3️⃣ Résultat

**Si approuvé :**
- Un nouveau message formaté est publié avec :
  - Le contenu du serveur
  - L'auteur de la soumission
  - Le modérateur qui a approuvé
  
**Si refusé :**
- Un message de refus est envoyé (optionnel)
- Le message original peut être supprimé (si permissions)

## ⚙️ Configuration

### Variables d'Environnement

Le fichier `.env` contient maintenant ces paramètres :

```env
# Canal où les serveurs sont soumis
SUBMISSION_CHANNEL_ID=01KHH12F5XPFKADTQC44N9VPES

# Rôles autorisés à modérer
MODERATOR_ROLE_1=01KHCAJ20T9SATYM1PDTYXKZ61
MODERATOR_ROLE_2=01KHCHBGR6Z5G9KCNF3CXNDM7R
```

### Fichier Principal

**`moderation_bot.py`** - Bot avec système de modération complet :
- Gestion des bienvenues (comme avant)
- Détection automatique des soumissions
- Ajout des réactions de modération
- Vérification des permissions
- Traitement des approbations/refus

## 🚀 Démarrage

### Méthode Simple

```bash
cd QUOKKA/bot
python moderation_bot.py
```

### Avec Script

```bash
# Windows
start_bot.bat

# Linux/Mac
./start_bot.sh
```

## 🎮 Commandes

| Commande | Description |
|----------|-------------|
| `!ping` | Test de connexion |
| `!aide` | Aide générale |
| `!moderation` | Informations sur le système de modération |

## 👥 Rôles Configurés

### Modérateurs Autorisés

Deux rôles peuvent approuver/refuser les soumissions :

1. **Rôle 1** : `01KHCAJ20T9SATYM1PDTYXKZ61`
2. **Rôle 2** : `01KHCHBGR6Z5G9KCNF3CXNDM7R`

**Important :** Seuls les membres ayant l'un de ces rôles peuvent modérer.

### Ajouter un Rôle Modérateur

Pour ajouter un nouveau rôle de modérateur :

1. Récupérez l'ID du rôle sur Stoat.chat
2. Modifiez `.env` :

```env
MODERATOR_ROLE_3=nouvel_id_de_role_ici
```

3. Modifiez `moderation_bot.py` ligne ~103 :

```python
if MODERATOR_ROLE_1 in member_role_ids or \
   MODERATOR_ROLE_2 in member_role_ids or \
   MODERATOR_ROLE_3 in member_role_ids:
    has_permission = True
```

## 📊 Flux de Modération

```
┌─────────────────────────────────────────────────────────┐
│                UTILISATEUR                               │
│         Soumet un serveur dans le canal                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    BOT                                   │
│  1. Détecte le message                                  │
│  2. Ajoute réactions ✅ ❌                              │
│  3. Confirme la réception                               │
│  4. Stocke en attente                                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                MODÉRATEUR                                │
│         Clique sur ✅ ou ❌                             │
└────────────────────┬────────────────────────────────────┘
                     │
            ┌────────┴────────┐
            │                 │
            ▼                 ▼
      ┌─────────┐       ┌─────────┐
      │    ✅    │       │    ❌    │
      │ APPROUVÉ│       │  REFUSÉ │
      └────┬────┘       └────┬────┘
           │                 │
           ▼                 ▼
    ┌──────────┐      ┌──────────┐
    │ Publication│      │Suppression│
    │  serveur   │      │  message  │
    └──────────┘      └──────────┘
```

## 🔍 Détails Techniques

### Événements Utilisés

#### `MessageCreateEvent`
Détecte les nouveaux messages dans le canal de soumission.

```python
@client.on(stoat.MessageCreateEvent)
async def on_message(event, /):
    if message.channel.id == SUBMISSION_CHANNEL_ID:
        await handle_submission(message)
```

#### `MessageReactionAddEvent`
Détecte les réactions ajoutées aux soumissions.

```python
@client.on(stoat.MessageReactionAddEvent)
async def on_reaction_add(event, /):
    # Vérifier si modérateur
    # Traiter approbation ou refus
```

### Stockage des Soumissions

Les soumissions en attente sont stockées en mémoire :

```python
pending_submissions = {
    'message_id': {
        'author': 'user_id',
        'author_name': 'username',
        'content': 'message content',
        'channel': 'channel_id',
        'timestamp': 'message_id'
    }
}
```

**Note :** Les données sont perdues si le bot redémarre. Pour une persistence, utilisez une base de données.

### Vérification des Permissions

```python
# Récupérer les rôles du membre
member_role_ids = [role.id for role in member.roles]

# Vérifier si modérateur
if MODERATOR_ROLE_1 in member_role_ids or \
   MODERATOR_ROLE_2 in member_role_ids:
    has_permission = True
```

## 📝 Logs du Bot

Le bot affiche des logs détaillés :

```
[OK] Bot connecte en tant que QUOKKA Bot
[INFO] ID du bot: 01KHH28MG46TJV87ANE790EBNT
[INFO] Canal de soumission: 01KHH12F5XPFKADTQC44N9VPES
[MODERATION] Systeme de moderation active

[SOUMISSION] Nouvelle soumission de UserName
[SOUMISSION] Contenu: Serveur XYZ...
[MODERATION] Reactions ajoutees au message 12345

[APPROBATION] Soumission 12345 approuvee par ModName
[OK] Soumission 12345 traitee avec succes
```

## 🎨 Personnalisation

### Messages de Confirmation

Modifier ligne ~73 dans `moderation_bot.py` :

```python
confirmation = (
    f"📋 {message.author.mention} Votre message personnalisé ici !"
)
```

### Message d'Approbation

Modifier ligne ~150 :

```python
approved_message = (
    f"✅ **VOTRE TITRE PERSONNALISÉ**\n\n"
    f"{submission['content']}\n\n"
    f"*Approuvé par:* {moderator.mention}"
)
```

### Message de Refus

Modifier ligne ~174 :

```python
rejection_notice = (
    f"❌ **VOTRE MESSAGE DE REFUS**\n\n"
    f"*Refusé par:* {moderator.mention}"
)
```

## 🔒 Sécurité

### Vérifications Implémentées

✅ Le bot ignore ses propres réactions
✅ Seuls les modérateurs autorisés peuvent approuver/refuser
✅ Vérification du serveur cible
✅ Gestion des erreurs pour éviter les crashs

### Recommandations

- **Permissions du bot :**
  - Lire les messages
  - Envoyer des messages
  - Ajouter des réactions
  - Gérer les messages (pour suppression - optionnel)

- **Permissions des modérateurs :**
  - Avoir l'un des rôles configurés
  - Pouvoir ajouter des réactions

## 🐛 Dépannage

### Le bot n'ajoute pas de réactions

**Cause :** Permissions manquantes

**Solution :**
1. Vérifier que le bot a la permission "Ajouter des réactions"
2. Vérifier que le canal autorise les réactions

### Les modérateurs ne peuvent pas modérer

**Cause :** Rôles mal configurés

**Solution :**
1. Vérifier les IDs des rôles dans `.env`
2. Vérifier que les modérateurs ont bien ces rôles
3. Consulter les logs pour voir les détails

### Le message n'est pas supprimé après refus

**Cause :** Le bot n'a pas la permission de supprimer les messages

**Solution :**
1. Donner au bot la permission "Gérer les messages"
2. Ou désactiver la suppression dans le code (ligne ~183)

### Les soumissions disparaissent après redémarrage

**Cause :** Stockage en mémoire uniquement

**Solution :**
- Implémenter une base de données (SQLite, PostgreSQL, etc.)
- Ou accepter cette limitation pour un système simple

## 📈 Améliorations Futures

### Version 2.1

- [ ] Persistance en base de données
- [ ] Canal de logs séparé pour les actions de modération
- [ ] Statistiques de modération
- [ ] Raisons de refus configurables
- [ ] File d'attente de modération avec pagination

### Version 2.2

- [ ] Modération par votes (plusieurs modérateurs)
- [ ] Système de blacklist automatique
- [ ] Templates de messages configurables
- [ ] Notifications DM aux soumissionnaires
- [ ] Interface web de modération

## 📞 Support

Pour toute question sur le système de modération :

1. Consultez les logs du bot
2. Vérifiez la configuration dans `.env`
3. Testez avec `!moderation` dans le serveur
4. Consultez ce guide

## 🎉 Récapitulatif

**Ce qui fonctionne maintenant :**

✅ Détection automatique des soumissions
✅ Ajout des réactions ✅ et ❌
✅ Vérification des rôles modérateurs
✅ Approbation et refus des soumissions
✅ Messages de confirmation
✅ Logs détaillés

**Pour démarrer :**

```bash
python moderation_bot.py
```

---

**Version :** 1.0  
**Créé pour :** Projet QUOKKA  
**Canal de soumission :** https://stoat.chat/server/01KHCAG6RSNPY7DE9MDEVYKRFD/channel/01KHH12F5XPFKADTQC44N9VPES
