# 🤖 Bot QUOKKA - Stoat.chat

Bot Python pour Stoat.chat avec système de bienvenue automatique et modération de serveurs.

## 🚀 Démarrage Rapide

### Installation

```bash
# 1. Installer les dépendances
pip install -r requirements.txt

# 2. Démarrer le bot
python moderation_bot.py
```

## 📁 Structure du Projet

```
bot/
├── docs/                      # 📚 Documentation complète
│   ├── README_DOCS.md         # Index de la documentation
│   ├── QUICKSTART.md          # Guide de démarrage rapide
│   ├── README_MODERATION.md   # Guide système de modération
│   └── ...                    # Autres docs
│
├── moderation_bot.py          # ⭐ Bot avec modération (recommandé)
├── advanced_bot.py            # Bot avancé avec config JSON
├── welcome_bot.py             # Bot simple
│
├── test_config.py             # Tests de configuration
├── test_moderation.py         # Tests du système de modération
│
├── config.json                # Configuration avancée
├── .env                       # Variables d'environnement (sensible)
├── requirements.txt           # Dépendances Python
│
└── start_bot.bat/sh           # Scripts de démarrage
```

## ✨ Fonctionnalités

### ✅ Message de Bienvenue Automatique
- Détecte les nouveaux membres
- Envoie un message personnalisé
- Configurable via JSON

### 🛡️ Système de Modération
- Validation des soumissions de serveurs
- Approbation/Refus par réactions ✅ ❌
- Vérification des rôles modérateurs
- Logs détaillés

### 🎮 Commandes
- `!ping` - Test de connexion
- `!aide` - Afficher l'aide
- `!moderation` - Infos système de modération

## 📚 Documentation

Toute la documentation est dans le dossier **`docs/`** :

| Document | Description |
|----------|-------------|
| [README_DOCS.md](docs/README_DOCS.md) | **Index de toute la documentation** |
| [QUICKSTART.md](docs/QUICKSTART.md) | Guide de démarrage en 3 étapes |
| [README.md](docs/README.md) | Documentation générale complète |
| [README_MODERATION.md](docs/README_MODERATION.md) | Guide système de modération |
| [MODERATION_GUIDE.md](docs/MODERATION_GUIDE.md) | Détails techniques modération |
| [API_REFERENCE.md](docs/API_REFERENCE.md) | Référence API stoat.py |
| [TROUBLESHOOTING_INVALIDSESSION.md](docs/TROUBLESHOOTING_INVALIDSESSION.md) | Dépannage erreur token |

**👉 Commencez par [docs/README_DOCS.md](docs/README_DOCS.md) pour naviguer dans la documentation**

## 🧪 Tests

```bash
# Tester la configuration générale
python test_config.py

# Tester le système de modération
python test_moderation.py
```

## ⚙️ Configuration

### Fichier `.env` (Variables)

```env
# Bot
BOT_TOKEN=votre_token_ici
SERVER_ID=01KHCAG6RSNPY7DE9MDEVYKRFD

# Bienvenue
WELCOME_CHANNEL_ID=01KHCH5Y324FH1HP45S6JZJ1H4

# Modération
SUBMISSION_CHANNEL_ID=01KHH12F5XPFKADTQC44N9VPES
MODERATOR_ROLE_1=01KHCAJ20T9SATYM1PDTYXKZ61
MODERATOR_ROLE_2=01KHCHBGR6Z5G9KCNF3CXNDM7R
```

### Fichier `config.json` (Messages personnalisés)

```json
{
  "welcome": {
    "enabled": true,
    "messages": ["Message 1", "Message 2"],
    "random_message": false
  }
}
```

## 🎯 Versions du Bot

### `moderation_bot.py` ⭐ (Recommandé)
- Toutes les fonctionnalités
- Système de modération complet
- Messages de bienvenue
- **À utiliser en production**

### `advanced_bot.py`
- Configuration JSON
- Messages multiples
- Sans modération

### `welcome_bot.py`
- Version simple
- Un seul message de bienvenue
- Idéal pour apprendre

## 🛠️ Scripts

```bash
# Windows
start_bot.bat

# Linux/Mac
chmod +x start_bot.sh
./start_bot.sh
```

## 🔒 Sécurité

⚠️ **IMPORTANT** : Le fichier `.env` contient des données sensibles (token du bot).
- Ne le partagez jamais
- Ne le versionnez pas sur Git (déjà dans `.gitignore`)
- Régénérez le token si compromis

## 🐛 Dépannage

### Le bot ne démarre pas

**Erreur `InvalidSession`** → Consultez [docs/TROUBLESHOOTING_INVALIDSESSION.md](docs/TROUBLESHOOTING_INVALIDSESSION.md)

**Solution rapide :**
1. Régénérer le token sur Stoat.chat
2. Mettre à jour `.env`
3. Redémarrer le bot

### Autres problèmes

Consultez la documentation complète dans le dossier **`docs/`**

## 📞 Support

1. Consultez la [documentation](docs/README_DOCS.md)
2. Vérifiez les logs du bot
3. Exécutez les tests appropriés

## 🔗 Liens Utiles

- [Documentation stoat.py](https://stoatpy.readthedocs.io/)
- [Stoat Developer Docs](https://developers.stoat.chat/)
- [GitHub stoat.py](https://github.com/MCausc78/stoat.py)

## 📄 Licence

Développé pour le projet **QUOKKA**.

---

**Version :** 2.0  
**Statut :** ✅ Production Ready  
**Documentation complète :** [docs/README_DOCS.md](docs/README_DOCS.md)
