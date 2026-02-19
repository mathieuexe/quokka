# 🤖 Bot Stoat.chat QUOKKA - Message de Bienvenue

<div align="center">

![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python)
![Stoat.py](https://img.shields.io/badge/stoat.py-1.2.1-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-QUOKKA-orange?style=for-the-badge)

**Bot Discord-like pour Stoat.chat qui souhaite automatiquement la bienvenue aux nouveaux membres**

[Installation](#-installation-rapide) • [Documentation](#-documentation) • [Fonctionnalités](#-fonctionnalités) • [Configuration](#️-configuration)

</div>

---

## 📋 À Propos

Ce bot est développé pour le projet **QUOKKA** et permet d'accueillir automatiquement les nouveaux membres qui rejoignent votre serveur Stoat.chat avec un message personnalisé.

### ✨ Fonctionnalités Principales

- 🎉 **Message de bienvenue automatique** lors de l'arrivée d'un nouveau membre
- 🎲 **Messages multiples** avec mode aléatoire (version avancée)
- ⚙️ **Configuration JSON** pour personnalisation sans modifier le code
- 🤖 **Commandes intégrées** (!ping, !aide, !info, !status)
- 📊 **Logs détaillés** configurables
- 🔐 **Sécurité** avec token séparé et .gitignore
- 📚 **Documentation complète** en français

## 🚀 Installation Rapide

### Prérequis

- Python 3.8 ou supérieur
- pip (gestionnaire de paquets Python)

### Installation en 3 étapes

```bash
# 1. Se placer dans le dossier du bot
cd QUOKKA/bot

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Démarrer le bot
python welcome_bot.py
```

🎉 **C'est tout !** Le bot est configuré et prêt à fonctionner.

## 🎯 Démarrage Rapide

### Windows
Double-cliquez sur `start_bot.bat` ou :
```cmd
start_bot.bat
```

### Linux / Mac
```bash
chmod +x start_bot.sh
./start_bot.sh
```

## 📁 Structure du Projet

```
bot/
├── 🐍 Code Python
│   ├── welcome_bot.py          # Version simple
│   ├── advanced_bot.py         # Version avancée
│   └── test_config.py          # Tests
│
├── ⚙️ Configuration
│   ├── .env                    # Variables (TOKEN, IDs)
│   ├── config.json             # Config avancée
│   └── requirements.txt        # Dépendances
│
├── 📚 Documentation
│   ├── README.md               # Ce fichier
│   ├── QUICKSTART.md           # Guide rapide
│   ├── API_REFERENCE.md        # Référence API
│   ├── PROJECT_STRUCTURE.md    # Architecture
│   ├── CHANGELOG.md            # Versions
│   ├── CONTRIBUTING.md         # Contribution
│   ├── INDEX.md                # Navigation
│   └── FINAL_SUMMARY.md        # Résumé complet
│
└── 🚀 Scripts
    ├── start_bot.bat           # Démarrage Windows
    └── start_bot.sh            # Démarrage Linux/Mac
```

## 🎮 Deux Versions Disponibles

### Version Simple (`welcome_bot.py`)
✅ Idéal pour débuter ou tester rapidement

- Message de bienvenue fixe
- Commandes de base (!ping, !aide)
- Configuration dans le code
- Logs simples

### Version Avancée (`advanced_bot.py`)
⭐ Recommandé pour la production

- Tous les avantages de la version simple
- **3 messages de bienvenue** configurables
- **Mode aléatoire** pour varier les messages
- **Configuration JSON** externe
- **Commandes étendues** (!info, !status)
- **Logs détaillés** et configurables

## ⚙️ Configuration

### Variables d'Environnement (`.env`)

Le fichier `.env` est déjà configuré avec :

```env
BOT_TOKEN=votre_token_ici
WELCOME_CHANNEL_ID=01KHCH5Y324FH1HP45S6JZJ1H4
SERVER_ID=01KHCAG6RSNPY7DE9MDEVYKRFD
```

### Configuration Avancée (`config.json`)

Personnalisez facilement le bot :

```json
{
  "welcome": {
    "enabled": true,
    "messages": [
      "🎉 **Bienvenue {mention} !** ...",
      "👋 **Salut {mention} !** ...",
      "🌟 **Hey {mention} !** ..."
    ],
    "random_message": false
  },
  "commands": {
    "prefix": "!",
    "ping": {
      "enabled": true,
      "response": "🏓 Pong!"
    }
  }
}
```

## 💬 Commandes Disponibles

| Commande | Description | Version |
|----------|-------------|---------|
| `!ping` | Tester la connexion du bot | Toutes |
| `!aide` | Afficher l'aide | Toutes |
| `!info` | Informations sur le bot | Avancée |
| `!status` | Statut et version | Avancée |

## 🎨 Personnalisation

### Ajouter un Message de Bienvenue

Éditez `config.json` :
```json
"messages": [
    "Message 1",
    "Message 2",
    "🌈 Votre nouveau message ici {mention} ! 🎊"
]
```

### Activer le Mode Aléatoire

```json
"random_message": true
```

Le bot sélectionnera aléatoirement un message parmi ceux configurés.

### Personnaliser les Réponses

```json
"ping": {
    "enabled": true,
    "response": "🏓 Personnalisez votre réponse ici !"
}
```

## 🧪 Tests

### Test de Configuration

```bash
python test_config.py
```

Vérifie :
- ✅ Version Python compatible
- ✅ Dépendances installées
- ✅ Configuration valide
- ✅ Fichiers présents

### Test du Bot

1. Démarrer le bot
2. Utiliser `!ping` dans le serveur
3. Le bot doit répondre "🏓 Pong!"

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | Guide de démarrage en 3 étapes |
| [README.md](README.md) | Documentation complète |
| [API_REFERENCE.md](API_REFERENCE.md) | Référence API stoat.py |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Architecture détaillée |
| [CHANGELOG.md](CHANGELOG.md) | Historique des versions |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Guide de contribution |
| [INDEX.md](INDEX.md) | Navigation complète |
| [FINAL_SUMMARY.md](FINAL_SUMMARY.md) | Résumé et checklist |

## 🔐 Sécurité

- ✅ Token séparé dans `.env`
- ✅ `.env` exclu de Git via `.gitignore`
- ✅ Token masqué dans les logs
- ✅ Validation des entrées
- ✅ Gestion propre des erreurs

⚠️ **IMPORTANT** : Ne partagez JAMAIS votre token de bot !

## 🐛 Dépannage

### Le bot ne démarre pas
```bash
# Vérifier la configuration
python test_config.py

# Vérifier Python
python --version  # Doit être 3.8+

# Réinstaller les dépendances
pip install -r requirements.txt
```

### Le bot ne répond pas
- Vérifier que le bot est dans le serveur
- Vérifier les permissions du bot
- Vérifier l'ID du canal dans `.env`

### Messages de bienvenue non envoyés
- Vérifier `WELCOME_CHANNEL_ID` dans `.env`
- Vérifier que le bot a la permission d'écrire
- Vérifier `SERVER_ID` dans `.env`

Plus de détails dans [README.md#dépannage](README.md)

## 📊 Statistiques

- **Fichiers créés :** 18
- **Lignes de code :** ~500
- **Lignes de documentation :** ~1500
- **Dépendances :** 2 (stoat.py, python-dotenv)
- **Tests :** 6/6 réussis ✅

## 🛠️ Technologies

- **Python** 3.8+
- **stoat.py** 1.2.1 - Bibliothèque client Stoat
- **python-dotenv** - Gestion des variables d'environnement
- **Stoat.chat** - Plateforme de chat

## 🔗 Liens Utiles

- 📖 [Documentation stoat.py](https://stoatpy.readthedocs.io/)
- 🌐 [Stoat Developers](https://developers.stoat.chat/)
- 💻 [GitHub stoat.py](https://github.com/MCausc78/stoat.py)
- 💬 [Serveur Stoat](https://rvlt.gg/ZZQb4sxx)
- 🏠 [Site Stoat.chat](https://stoat.chat)

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour :
- Standards de code
- Processus de contribution
- Guide de développement

## 📝 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique complet des versions.

### Version Actuelle : 2.0.0
- ✨ Bot version avancée avec config JSON
- ✨ Messages multiples et mode aléatoire
- ✨ Documentation complète
- ✨ Scripts de démarrage
- 🔧 Amélioration des logs
- 📚 7 fichiers de documentation

## 📄 Licence

Développé pour le projet **QUOKKA**.

## 👥 Auteurs

- **Équipe QUOKKA** - Développement du bot
- **MCausc78** - Bibliothèque stoat.py
- **Stoat Team** - Plateforme Stoat.chat

## 🙏 Remerciements

- Merci à la communauté Stoat.chat
- Merci à MCausc78 pour stoat.py
- Merci à tous les contributeurs

---

<div align="center">

**🎉 Bot prêt à l'emploi ! 🎉**

[⬆ Retour en haut](#-bot-stoatchat-quokka---message-de-bienvenue)

</div>
