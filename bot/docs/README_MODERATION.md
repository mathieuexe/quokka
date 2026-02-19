# 🛡️ Bot QUOKKA avec Système de Modération

## 🎉 Résumé

Le bot QUOKKA dispose maintenant d'un **système de modération automatique** pour gérer les soumissions de serveurs. Chaque message posté dans le canal de soumission nécessite une approbation par un modérateur autorisé.

## ⚡ Démarrage Rapide

```bash
# 1. Se placer dans le dossier
cd QUOKKA/bot

# 2. Démarrer le bot avec modération
python moderation_bot.py
```

C'est tout ! Le bot est opérationnel avec modération activée. ✅

## 📋 Fonctionnalités

### ✅ Inclus

- **Message de bienvenue automatique** (fonctionnalité existante)
- **Détection automatique des soumissions**
- **Réactions ✅ ❌ ajoutées automatiquement**
- **Vérification des rôles modérateurs**
- **Approbation** → Message formaté publié
- **Refus** → Message supprimé
- **Logs détaillés** en temps réel
- **Commandes** : !ping, !aide, !moderation

## 🎮 Comment Utiliser

### Pour les Utilisateurs

1. **Soumettre un serveur**
   - Poster votre message dans le canal : https://stoat.chat/server/01KHCAG6RSNPY7DE9MDEVYKRFD/channel/01KHH12F5XPFKADTQC44N9VPES
   - Le bot ajoute automatiquement ✅ et ❌
   - Attendre la décision d'un modérateur

### Pour les Modérateurs

1. **Approuver une soumission**
   - Cliquer sur la réaction ✅
   - Le serveur est publié avec votre mention

2. **Refuser une soumission**
   - Cliquer sur la réaction ❌
   - Le message est supprimé (si permissions)

**Important** : Seuls les membres avec l'un des rôles configurés peuvent modérer :
- Rôle 1 : `01KHCAJ20T9SATYM1PDTYXKZ61`
- Rôle 2 : `01KHCHBGR6Z5G9KCNF3CXNDM7R`

## 📊 Schéma de Fonctionnement

```
┌──────────────────────────────────────┐
│  UTILISATEUR                         │
│  Poste un message                    │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  BOT                                 │
│  1. Détecte le message               │
│  2. Ajoute ✅ et ❌                 │
│  3. Confirme la réception            │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  MODÉRATEUR                          │
│  Clique sur ✅ ou ❌                │
└────────────┬─────────────────────────┘
             │
        ┌────┴────┐
        ▼         ▼
     [✅]       [❌]
  Approuvé    Refusé
  Publié    Supprimé
```

## 🔧 Configuration

### Fichier .env (Déjà Configuré)

```env
# Bot
BOT_TOKEN=votre_token
SERVER_ID=01KHCAG6RSNPY7DE9MDEVYKRFD

# Bienvenue
WELCOME_CHANNEL_ID=01KHCH5Y324FH1HP45S6JZJ1H4

# Modération
SUBMISSION_CHANNEL_ID=01KHH12F5XPFKADTQC44N9VPES
MODERATOR_ROLE_1=01KHCAJ20T9SATYM1PDTYXKZ61
MODERATOR_ROLE_2=01KHCHBGR6Z5G9KCNF3CXNDM7R
```

Tout est déjà configuré ! ✅

## 📁 Fichiers du Système

| Fichier | Description | Taille |
|---------|-------------|--------|
| `moderation_bot.py` | **Bot principal avec modération** | 11.8 KB |
| `test_moderation.py` | Tests automatisés | 4.5 KB |
| `MODERATION_GUIDE.md` | Guide complet | 10.5 KB |
| `MODERATION_SUMMARY.md` | Résumé détaillé | 9.2 KB |
| `TROUBLESHOOTING_INVALIDSESSION.md` | Dépannage token | 6.8 KB |

## 🎮 Commandes Disponibles

### Dans n'importe quel canal

```
!ping           → Teste la connexion du bot
!aide           → Affiche l'aide générale
!moderation     → Infos sur le système de modération
```

### Exemple de Réponse à `!moderation`

```
🛡️ **Système de Modération**

**Canal de soumission:** #soumissions
**Rôles modérateurs:** 2 rôles configurés

**Fonctionnement:**
1. Un utilisateur soumet un serveur
2. Le bot ajoute ✅ et ❌
3. Un modérateur approuve ou refuse
4. Le message est traité

**Statut:** ✅ Actif
```

## 🧪 Tests

### Tester le Système

```bash
# Exécuter tous les tests
python test_moderation.py
```

**Résultat attendu :**
```
============================================================
[SUCCES] TOUS LES TESTS SONT PASSES !
============================================================
```

### Tests Effectués

- ✅ Variables d'environnement
- ✅ Fichier moderation_bot.py
- ✅ Imports (stoat.py, asyncio)
- ✅ Syntaxe Python
- ✅ Événements (MessageCreate, MessageReactionAdd)
- ✅ Fonctions (handle_submission, handle_approval, handle_rejection)
- ✅ Configuration complète
- ✅ Documentation

## 📝 Logs du Bot

Le bot affiche des logs détaillés :

```
[OK] Bot connecte en tant que QUOKKA Bot
[INFO] Canal de soumission: 01KHH12F5XPFKADTQC44N9VPES
[MODERATION] Systeme de moderation active

[SOUMISSION] Nouvelle soumission de UserName
[MODERATION] Reactions ajoutees au message 12345

[APPROBATION] Soumission 12345 approuvee par ModName
[OK] Soumission 12345 traitee avec succes
```

## 🔒 Sécurité

### Vérifications Implémentées

✅ Le bot ignore ses propres réactions
✅ Seuls les modérateurs autorisés peuvent modérer
✅ Vérification du serveur cible
✅ Gestion des erreurs pour éviter les crashs

### Permissions Requises

**Pour le bot :**
- Lire les messages
- Envoyer des messages
- Ajouter des réactions
- Gérer les messages (optionnel, pour suppression)

**Pour les modérateurs :**
- Avoir l'un des deux rôles configurés

## 🐛 Dépannage

### Le bot ne démarre pas

**Erreur : InvalidSession**

Solution → Consultez `TROUBLESHOOTING_INVALIDSESSION.md`

Résumé rapide :
1. Régénérer le token sur Stoat.chat
2. Mettre à jour `.env`
3. Redémarrer le bot

### Les réactions ne sont pas ajoutées

**Cause :** Permissions manquantes

**Solution :**
1. Vérifier que le bot a la permission "Ajouter des réactions"
2. Vérifier que le canal autorise les réactions

### Les modérateurs ne peuvent pas modérer

**Cause :** Rôles mal configurés

**Solution :**
1. Vérifier les IDs des rôles dans `.env`
2. Vérifier que les modérateurs ont bien ces rôles
3. Consulter les logs du bot

### Plus de solutions

Consultez `MODERATION_GUIDE.md` section "Dépannage"

## 📚 Documentation Complète

| Document | Contenu |
|----------|---------|
| **MODERATION_GUIDE.md** | Guide complet du système |
| **MODERATION_SUMMARY.md** | Résumé et checklist |
| **TROUBLESHOOTING_INVALIDSESSION.md** | Résoudre les problèmes de token |
| **README.md** | Documentation générale du bot |

## 🎨 Personnalisation

### Ajouter un Rôle Modérateur

**1. Dans `.env` :**
```env
MODERATOR_ROLE_3=nouvel_id_de_role
```

**2. Dans `moderation_bot.py` ligne ~27 :**
```python
MODERATOR_ROLE_3 = os.getenv('MODERATOR_ROLE_3', '')
```

**3. Dans `moderation_bot.py` ligne ~103 :**
```python
if MODERATOR_ROLE_1 in member_role_ids or \
   MODERATOR_ROLE_2 in member_role_ids or \
   MODERATOR_ROLE_3 in member_role_ids:
    has_permission = True
```

### Modifier les Messages

**Message de confirmation (ligne ~73) :**
```python
confirmation = (
    f"📋 {message.author.mention} Votre message personnalisé !"
)
```

**Message d'approbation (ligne ~150) :**
```python
approved_message = (
    f"✅ **VOTRE TITRE**\n\n"
    f"Votre format personnalisé"
)
```

## 🔮 Fonctionnalités Futures

- [ ] Base de données pour persistance
- [ ] Canal de logs pour les actions
- [ ] Statistiques de modération
- [ ] Raisons de refus configurables
- [ ] Modération par votes
- [ ] Notifications DM aux soumissionnaires

## 📞 Support

**En cas de problème :**

1. Consulter les logs du bot
2. Exécuter `python test_moderation.py`
3. Lire `MODERATION_GUIDE.md`
4. Utiliser `!moderation` dans le serveur

## ✅ Checklist de Démarrage

```
[✓] Bot créé (moderation_bot.py)
[✓] Configuration (.env mise à jour)
[✓] Documentation complète
[✓] Tests automatisés passés
[✓] Événements configurés
[✓] Permissions vérifiées

🎉 PRÊT À UTILISER !
```

## 🚀 Pour Commencer

```bash
# Étape 1 : Tester
python test_moderation.py

# Étape 2 : Démarrer
python moderation_bot.py

# Étape 3 : Tester dans le serveur
# - Poster un message dans le canal de soumission
# - Vérifier les réactions ✅ ❌
# - Tester avec un compte modérateur
```

---

**Version :** 1.0  
**Créé pour :** Projet QUOKKA  
**Statut :** ✅ Production Ready  

**🎉 Bon usage du système de modération ! 🛡️**
