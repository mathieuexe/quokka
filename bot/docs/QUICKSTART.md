# 🚀 Guide de Démarrage Rapide

## Installation en 3 étapes

### 1️⃣ Installer les dépendances

```bash
cd QUOKKA/bot
pip install -r requirements.txt
```

### 2️⃣ Vérifier la configuration

Le fichier `.env` est déjà configuré avec :
- ✅ Token du bot
- ✅ ID du canal de bienvenue
- ✅ ID du serveur

### 3️⃣ Démarrer le bot

**Sur Windows :**
Double-cliquez sur `start_bot.bat` ou :
```bash
python welcome_bot.py
```

**Sur Linux/Mac :**
```bash
chmod +x start_bot.sh
./start_bot.sh
```

## 🎯 Deux versions disponibles

### Version Simple (`welcome_bot.py`)
- ✅ Message de bienvenue fixe
- ✅ Commandes de base (!ping, !aide)
- ✅ Simple et rapide

### Version Avancée (`advanced_bot.py`)
- ✅ Messages de bienvenue multiples (mode aléatoire)
- ✅ Configuration JSON personnalisable
- ✅ Commandes supplémentaires (!info, !status)
- ✅ Logs détaillés

Pour utiliser la version avancée :
```bash
python advanced_bot.py
```

## 📝 Personnalisation

Éditez `config.json` pour :
- Ajouter de nouveaux messages de bienvenue
- Activer le mode aléatoire
- Personnaliser les réponses des commandes
- Configurer les logs

## 🧪 Test

Une fois le bot démarré, testez avec :
- `!ping` - Vérifier la connexion
- `!aide` - Afficher l'aide
- `!info` - Informations sur le bot (version avancée)
- `!status` - Statut du bot (version avancée)

## ❓ Problème ?

Consultez le fichier `README.md` pour le dépannage complet.

## 📞 Support

Pour toute question, contactez l'équipe de développement QUOKKA.
