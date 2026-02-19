# 📦 Structure du Projet Bot Stoat.chat

## 📁 Arborescence complète

```
QUOKKA/bot/
├── welcome_bot.py          # Bot version simple
├── advanced_bot.py         # Bot version avancée avec config JSON
├── test_config.py          # Script de test de configuration
├── requirements.txt        # Dépendances Python
├── config.json             # Configuration avancée (messages, commandes)
├── .env                    # Variables d'environnement (TOKEN, IDs)
├── .env.example            # Exemple de configuration
├── .gitignore              # Fichiers à ignorer par Git
├── start_bot.bat           # Script de démarrage Windows
├── start_bot.sh            # Script de démarrage Linux/Mac
├── README.md               # Documentation complète
├── QUICKSTART.md           # Guide de démarrage rapide
├── API_REFERENCE.md        # Référence API stoat.py
└── PROJECT_STRUCTURE.md    # Ce fichier
```

## 📄 Description des fichiers

### Fichiers principaux

#### `welcome_bot.py` ⭐
**Bot version simple et directe**
- Message de bienvenue fixe
- Commandes de base : `!ping`, `!aide`
- Idéal pour un démarrage rapide
- Code simple et lisible

**Caractéristiques:**
- ✅ Événement de bienvenue automatique
- ✅ Détection de nouveau membre
- ✅ Envoi dans le canal configuré
- ✅ Gestion des erreurs basique
- ✅ Logs console

**Quand l'utiliser:**
- Pour un bot simple et efficace
- Quand un seul message de bienvenue suffit
- Pour comprendre les bases de stoat.py

#### `advanced_bot.py` ⭐⭐⭐
**Bot version avancée avec personnalisation**
- Messages multiples configurables
- Mode aléatoire (sélection d'un message parmi plusieurs)
- Commandes étendues : `!ping`, `!aide`, `!info`, `!status`
- Configuration JSON externe
- Logs détaillés et configurables

**Caractéristiques:**
- ✅ Tout ce que fait `welcome_bot.py`
- ✅ Messages multiples personnalisables
- ✅ Mode aléatoire pour varier les messages
- ✅ Configuration JSON (sans modifier le code)
- ✅ Commandes supplémentaires
- ✅ Logs verbeux optionnels
- ✅ Gestion d'erreurs avancée avec traceback

**Quand l'utiliser:**
- Pour un bot personnalisable
- Quand vous voulez varier les messages
- Pour un usage en production
- Quand vous avez besoin de logs détaillés

#### `test_config.py`
**Script de vérification de configuration**
- Vérifie Python 3.8+
- Teste les dépendances (stoat.py, python-dotenv)
- Valide le fichier `.env`
- Vérifie `config.json`
- Liste les fichiers présents

**Usage:**
```bash
python test_config.py
```

### Fichiers de configuration

#### `.env` 🔐
**Variables d'environnement (SENSIBLE)**
```env
BOT_TOKEN=vzhCCcguBMZJX_HZ0-v49Opt6xnI1QEi7cyPY68O8gXIwOBEziZEg_d3TVubzTt9
WELCOME_CHANNEL_ID=01KHCH5Y324FH1HP45S6JZJ1H4
SERVER_ID=01KHCAG6RSNPY7DE9MDEVYKRFD
```

⚠️ **NE JAMAIS VERSIONNER CE FICHIER** ⚠️

#### `.env.example`
**Template de configuration**
- Copie à faire pour créer `.env`
- Contient les clés sans les valeurs sensibles
- Peut être versionné sur Git

#### `config.json`
**Configuration avancée pour `advanced_bot.py`**

Structure:
```json
{
  "bot": {
    "name": "Nom du bot",
    "description": "Description"
  },
  "welcome": {
    "enabled": true,
    "messages": ["Message 1", "Message 2", "..."],
    "random_message": false
  },
  "commands": {
    "prefix": "!",
    "ping": { "enabled": true, "response": "..." },
    "aide": { "enabled": true, "response": "..." }
  },
  "logging": {
    "verbose": true,
    "show_member_info": true
  }
}
```

**Personnalisation:**
- Ajouter/modifier des messages de bienvenue
- Activer/désactiver le mode aléatoire
- Changer les réponses des commandes
- Configurer les logs

#### `requirements.txt`
**Dépendances Python**
```
stoat.py>=1.2.0
python-dotenv>=1.0.0
```

Installation:
```bash
pip install -r requirements.txt
```

### Scripts de démarrage

#### `start_bot.bat` (Windows)
- Vérifie Python
- Installe les dépendances si nécessaire
- Vérifie `.env`
- Lance `welcome_bot.py`

**Usage:**
- Double-clic sur le fichier
- Ou : `start_bot.bat` dans le terminal

#### `start_bot.sh` (Linux/Mac)
- Équivalent Linux/Mac de `start_bot.bat`
- Rendre exécutable : `chmod +x start_bot.sh`

**Usage:**
```bash
./start_bot.sh
```

### Documentation

#### `README.md`
**Documentation complète du projet**
- Présentation
- Fonctionnalités
- Installation détaillée
- Configuration
- Utilisation
- Commandes disponibles
- Dépannage
- Sécurité

#### `QUICKSTART.md`
**Guide de démarrage rapide**
- Installation en 3 étapes
- Comparaison des versions
- Test rapide
- Troubleshooting express

#### `API_REFERENCE.md`
**Référence API stoat.py**
- Objets principaux
- Événements
- Méthodes
- Exemples de code
- Formatage des messages
- Gestion des erreurs
- Liens vers documentation officielle

#### `PROJECT_STRUCTURE.md`
**Ce fichier - Vue d'ensemble du projet**
- Arborescence
- Description de chaque fichier
- Flux d'exécution
- Choix de conception

### Autres fichiers

#### `.gitignore`
**Fichiers à exclure du versioning**
- `.env` (sensible)
- `__pycache__/` (cache Python)
- Environnements virtuels
- Fichiers IDE
- Logs

## 🔄 Flux d'exécution

### Version Simple (welcome_bot.py)

```
┌─────────────────────────────────────────┐
│ 1. Charger .env                         │
│    - BOT_TOKEN                          │
│    - WELCOME_CHANNEL_ID                 │
│    - SERVER_ID                          │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 2. Créer client stoat.Client()         │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 3. Enregistrer les événements           │
│    - ReadyEvent (connexion)             │
│    - ServerMemberJoinEvent (bienvenue)  │
│    - MessageCreateEvent (commandes)     │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 4. Démarrer le bot client.run(TOKEN)   │
└────────────┬────────────────────────────┘
             │
             ▼
    ┌────────────────┐
    │ Bot en ligne   │
    └────────────────┘
```

### Version Avancée (advanced_bot.py)

```
┌─────────────────────────────────────────┐
│ 1. Charger .env + config.json           │
│    - Variables d'environnement          │
│    - Configuration personnalisée        │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 2. Vérifier configuration               │
│    - Messages de bienvenue activés ?    │
│    - Mode aléatoire ?                   │
│    - Nombre de messages disponibles     │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 3. Créer client + événements            │
│    Comme version simple +               │
│    - Logs configurables                 │
│    - Commandes étendues                 │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 4. Démarrer le bot                      │
└────────────┬────────────────────────────┘
             │
             ▼
    ┌────────────────┐
    │ Bot en ligne   │
    │ (mode avancé)  │
    └────────────────┘
```

## 🎯 Événements du bot

### 1. ReadyEvent (Connexion)
```python
@client.on(stoat.ReadyEvent)
async def on_ready(event, /):
    # Bot connecté et prêt
    # Afficher les infos de connexion
```

**Déclenché:** Une fois au démarrage quand le bot est connecté

**Actions:**
- Afficher le nom du bot
- Afficher l'ID du bot
- Afficher la configuration
- Confirmer que le bot est opérationnel

### 2. ServerMemberJoinEvent (Bienvenue)
```python
@client.on(stoat.ServerMemberJoinEvent)
async def on_member_join(event, /):
    # Nouveau membre détecté
    # Envoyer message de bienvenue
```

**Déclenché:** À chaque fois qu'un membre rejoint le serveur

**Actions:**
1. Vérifier que c'est le bon serveur
2. Récupérer les infos du nouveau membre
3. Récupérer le canal de bienvenue
4. Sélectionner le message (fixe ou aléatoire)
5. Personnaliser avec la mention du membre
6. Envoyer le message
7. Logger l'action

### 3. MessageCreateEvent (Commandes)
```python
@client.on(stoat.MessageCreateEvent)
async def on_message(event, /):
    # Message reçu
    # Vérifier si c'est une commande
    # Exécuter la commande
```

**Déclenché:** À chaque message dans un canal où le bot est présent

**Actions:**
1. Ignorer les messages du bot lui-même
2. Vérifier si message commence par `!`
3. Extraire la commande
4. Exécuter l'action correspondante
5. Répondre dans le canal

**Commandes disponibles:**
- `!ping` - Test de connexion
- `!aide` - Afficher l'aide
- `!info` - Info sur le bot (avancé)
- `!status` - Statut du bot (avancé)

## 🎨 Choix de conception

### Pourquoi deux versions ?

#### Version Simple
**Pour:** Débutants, tests, déploiement rapide

**Avantages:**
- Code plus court et lisible
- Facile à comprendre
- Configuration dans le code
- Moins de dépendances externes

**Inconvénients:**
- Pas de personnalisation sans modifier le code
- Un seul message de bienvenue
- Logs basiques

#### Version Avancée
**Pour:** Production, personnalisation, évolution

**Avantages:**
- Configuration externe (JSON)
- Messages multiples
- Mode aléatoire
- Logs configurables
- Commandes étendues
- Gestion d'erreurs avancée

**Inconvénients:**
- Code plus complexe
- Dépendance au fichier JSON
- Plus de configuration initiale

### Sécurité

#### Token séparé dans `.env`
✅ **Bonne pratique:**
- Token isolé du code
- Pas versionné sur Git
- Facile à changer
- Conforme aux standards

#### .gitignore configuré
✅ **Protection:**
- `.env` non versionné
- Cache Python exclu
- Fichiers sensibles protégés

### Extensibilité

Le bot est conçu pour être facilement étendu :

**Ajouter un événement:**
```python
@client.on(stoat.ServerMemberLeaveEvent)
async def on_member_leave(event, /):
    # Code pour gérer les départs
    pass
```

**Ajouter une commande:**
```python
elif command == 'nouvelle_commande':
    await message.channel.send('Réponse')
```

**Ajouter un message de bienvenue:**
Modifier `config.json` :
```json
"messages": [
    "Message 1",
    "Message 2",
    "Nouveau message 3"
]
```

## 📊 Statistiques du projet

- **Fichiers Python:** 3 (welcome_bot, advanced_bot, test_config)
- **Lignes de code:** ~400
- **Dépendances:** 2 (stoat.py, python-dotenv)
- **Documentation:** 5 fichiers Markdown
- **Scripts:** 2 (Windows + Linux/Mac)
- **Événements gérés:** 3
- **Commandes disponibles:** 4 (simple) / 6 (avancé)

## 🚀 Recommandations

### Pour débuter
1. Utilisez `welcome_bot.py`
2. Testez avec `!ping` et `!aide`
3. Invitez un compte test pour tester la bienvenue

### Pour la production
1. Utilisez `advanced_bot.py`
2. Personnalisez `config.json`
3. Activez le mode aléatoire
4. Configurez les logs selon vos besoins
5. Déployez sur un serveur (VPS, cloud)

### Pour étendre
1. Lisez `API_REFERENCE.md`
2. Consultez la doc stoat.py
3. Ajoutez de nouveaux événements
4. Créez des commandes personnalisées

## 📞 Support

Pour toute question ou problème :
1. Consultez `README.md` (dépannage)
2. Relisez `QUICKSTART.md`
3. Vérifiez `API_REFERENCE.md`
4. Contactez l'équipe QUOKKA

## 🔗 Liens utiles

- [stoat.py Documentation](https://stoatpy.readthedocs.io/)
- [Stoat Developer Docs](https://developers.stoat.chat/)
- [GitHub stoat.py](https://github.com/MCausc78/stoat.py)
- [Serveur Stoat](https://rvlt.gg/ZZQb4sxx)
- [GitHub Stoat](https://github.com/stoatchat)

---

**Créé pour le projet QUOKKA**
Version 2.0 - Février 2026
