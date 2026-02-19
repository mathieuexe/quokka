# 📝 Changelog - Bot Stoat.chat QUOKKA

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [2.0.0] - 2026-02-15

### ✨ Ajouté
- **Bot version avancée** (`advanced_bot.py`)
  - Support de messages multiples configurables
  - Mode aléatoire pour varier les messages de bienvenue
  - Configuration externe via `config.json`
  - Commandes supplémentaires (`!info`, `!status`)
  - Logs détaillés et configurables
  - Gestion d'erreurs avec traceback optionnel

- **Configuration JSON** (`config.json`)
  - Section bot (nom, description)
  - Section welcome (messages, mode aléatoire)
  - Section commandes (préfixe, réponses personnalisées)
  - Section logging (verbosité, informations membres)

- **Script de test** (`test_config.py`)
  - Vérification de la version Python
  - Test des dépendances installées
  - Validation du fichier `.env`
  - Vérification du fichier `config.json`
  - Liste des fichiers du projet

- **Documentation complète**
  - `README.md` - Documentation générale
  - `QUICKSTART.md` - Guide de démarrage rapide
  - `API_REFERENCE.md` - Référence API stoat.py
  - `PROJECT_STRUCTURE.md` - Structure détaillée du projet
  - `CHANGELOG.md` - Ce fichier

- **Scripts de démarrage**
  - `start_bot.bat` - Script Windows avec vérifications
  - `start_bot.sh` - Script Linux/Mac

- **Configuration Git**
  - `.gitignore` - Protection des fichiers sensibles
  - `.env.example` - Template de configuration

### 🔧 Modifié
- **welcome_bot.py**
  - Amélioration des logs
  - Meilleure gestion des erreurs
  - Messages plus informatifs
  - Ajout de la commande `!aide`

- **requirements.txt**
  - Version stoat.py ajustée à 1.2.0+ (disponible sur PyPI)

### 📚 Documentation
- Guide complet d'installation
- Exemples de code
- Référence API complète
- Dépannage détaillé
- Schémas de flux d'exécution

## [1.0.0] - 2026-02-15

### ✨ Ajouté (Version Initiale)
- **Bot de base** (`welcome_bot.py`)
  - Message de bienvenue automatique
  - Détection de nouveaux membres
  - Événement `ServerMemberJoinEvent`
  - Commande `!ping` pour test

- **Configuration**
  - Fichier `.env` pour les variables sensibles
  - Support du token bot
  - Configuration ID canal et serveur

- **Dépendances**
  - stoat.py - Bibliothèque client Stoat
  - python-dotenv - Gestion variables d'environnement

- **Fonctionnalités**
  - Connexion au serveur Stoat
  - Envoi de messages dans un canal spécifique
  - Gestion des événements de connexion (ReadyEvent)
  - Logs console basiques

### 🎯 Configuration Initiale
- **Bot ID**: `01KHH28MG46TJV87ANE790EBNT`
- **Serveur**: `01KHCAG6RSNPY7DE9MDEVYKRFD`
- **Canal de bienvenue**: `01KHCH5Y324FH1HP45S6JZJ1H4`

## 🔮 Prévisions futures

### [2.1.0] - À venir
- [ ] Support des réactions automatiques
- [ ] Base de données pour statistiques
- [ ] Compteur de membres
- [ ] Messages d'anniversaire
- [ ] Système de rôles automatiques

### [2.2.0] - À venir
- [ ] Interface web de configuration
- [ ] Dashboard de statistiques
- [ ] Logs persistants en fichier
- [ ] Support multi-serveurs
- [ ] API REST pour contrôle externe

### [3.0.0] - À venir
- [ ] Système de plugins
- [ ] Extension commands framework
- [ ] Support Slash commands
- [ ] Intégration base de données
- [ ] Système de permissions avancé

## 📋 Types de changements

- `✨ Ajouté` - Nouvelles fonctionnalités
- `🔧 Modifié` - Changements de fonctionnalités existantes
- `🐛 Corrigé` - Corrections de bugs
- `🗑️ Supprimé` - Fonctionnalités retirées
- `🔒 Sécurité` - Corrections de vulnérabilités
- `📚 Documentation` - Changements de documentation uniquement
- `⚡ Performance` - Améliorations de performance

## 🔗 Liens

- [GitHub stoat.py](https://github.com/MCausc78/stoat.py)
- [Documentation stoat.py](https://stoatpy.readthedocs.io/)
- [Stoat Developers](https://developers.stoat.chat/)

## 👥 Contributeurs

- Développement initial : Équipe QUOKKA
- Bibliothèque stoat.py : MCausc78
- Plateforme Stoat.chat : Stoat Team

---

**Format inspiré de [Keep a Changelog](https://keepachangelog.com/)**
