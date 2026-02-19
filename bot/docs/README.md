# 🤖 Bot Stoat.chat - Message de Bienvenue

Bot Python pour Stoat.chat qui souhaite automatiquement la bienvenue aux nouveaux membres qui rejoignent le serveur.

## 📋 Fonctionnalités

- ✅ Message de bienvenue automatique pour les nouveaux membres
- ✅ Commandes de test (`!ping` et `!aide`)
- ✅ Gestion des erreurs robuste
- ✅ Configuration via variables d'environnement

## 🚀 Installation

### Prérequis

- Python 3.8 ou supérieur
- pip (gestionnaire de paquets Python)

### Étapes d'installation

1. **Installer les dépendances**

```bash
cd QUOKKA/bot
pip install -r requirements.txt
```

2. **Configurer les variables d'environnement**

Le fichier `.env` est déjà configuré avec les informations du bot. Si vous devez le modifier, copiez `.env.example` vers `.env` et renseignez les valeurs :

```bash
cp .env.example .env
```

Puis éditez le fichier `.env` :

```env
BOT_TOKEN=votre_token_ici
WELCOME_CHANNEL_ID=01KHCH5Y324FH1HP45S6JZJ1H4
SERVER_ID=01KHCAG6RSNPY7DE9MDEVYKRFD
```

## 🎯 Configuration

### Informations du bot

- **ID du bot**: `01KHH28MG46TJV87ANE790EBNT`
- **Token**: Configuré dans `.env`
- **Serveur**: `01KHCAG6RSNPY7DE9MDEVYKRFD`
- **Canal de bienvenue**: `01KHCH5Y324FH1HP45S6JZJ1H4`

## 🏃 Utilisation

### Démarrer le bot

```bash
cd QUOKKA/bot
python welcome_bot.py
```

Le bot affichera un message de confirmation quand il sera connecté :

```
🔄 Démarrage du bot Stoat...
✅ Bot connecté en tant que [nom_du_bot]
📋 ID du bot: 01KHH28MG46TJV87ANE790EBNT
🏠 Serveur cible: 01KHCAG6RSNPY7DE9MDEVYKRFD
💬 Canal de bienvenue: 01KHCH5Y324FH1HP45S6JZJ1H4
🚀 Le bot est maintenant opérationnel!
```

### Arrêter le bot

Appuyez sur `Ctrl+C` pour arrêter le bot proprement.

## 💬 Commandes disponibles

- `!ping` - Vérifier si le bot est en ligne
- `!aide` - Afficher l'aide des commandes

## 🎉 Message de bienvenue

Quand un nouveau membre rejoint le serveur, le bot envoie automatiquement ce message dans le canal configuré :

```
🎉 **Bienvenue @membre !**

Nous sommes ravis de t'accueillir sur notre serveur !
N'hésite pas à te présenter et à explorer les différents canaux.

Si tu as des questions, n'hésite pas à demander ! 😊
```

## 🛠️ Structure du projet

```
bot/
├── welcome_bot.py      # Fichier principal du bot
├── requirements.txt    # Dépendances Python
├── .env               # Configuration (non versionné)
├── .env.example       # Exemple de configuration
└── README.md          # Documentation
```

## 📚 Documentation

- [stoat.py Documentation](https://stoatpy.readthedocs.io/)
- [Stoat Developer Documentation](https://developers.stoat.chat/)
- [GitHub Repository stoat.py](https://github.com/MCausc78/stoat.py)

## 🐛 Dépannage

### Le bot ne démarre pas

Vérifiez que :
- Python 3.8+ est installé : `python --version`
- Les dépendances sont installées : `pip install -r requirements.txt`
- Le fichier `.env` existe et contient les bonnes valeurs

### Le bot ne répond pas

Vérifiez que :
- Le token du bot est correct
- Le bot a les permissions nécessaires sur le serveur
- L'ID du canal de bienvenue est correct

### Erreur de connexion

Si vous obtenez une erreur de connexion, vérifiez :
- Votre connexion Internet
- Que le token du bot n'a pas expiré
- Que le bot n'a pas été supprimé de Stoat

## 📝 Logs

Le bot affiche des logs détaillés pour faciliter le débogage :

- 👋 : Nouveau membre détecté
- ✉️ : Message de bienvenue envoyé
- ❌ : Erreur
- ✅ : Succès
- 🔄 : Action en cours

## 🔐 Sécurité

**Important** : Ne partagez JAMAIS votre token de bot ! Le fichier `.env` contient des informations sensibles et ne doit pas être versionné dans Git.

## 📄 Licence

Ce bot est développé pour le projet QUOKKA.

## 🤝 Contribution

Pour toute question ou suggestion, contactez l'équipe de développement de QUOKKA.
