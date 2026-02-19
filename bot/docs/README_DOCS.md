# 📚 Documentation - Bot QUOKKA Stoat.chat

Bienvenue dans la documentation du Bot QUOKKA pour Stoat.chat !

## 🗂️ Index de la Documentation

Tous les fichiers de documentation sont organisés dans ce dossier `docs/`.

### 📖 Guides de Démarrage

| Document | Description | Niveau |
|----------|-------------|--------|
| [QUICKSTART.md](QUICKSTART.md) | Guide de démarrage rapide (3 étapes) | 🟢 Débutant |
| [README.md](README.md) | Documentation générale complète | 🟢 Débutant |
| [README_GITHUB.md](README_GITHUB.md) | Présentation visuelle pour GitHub | 🟢 Débutant |

### 🛡️ Système de Modération

| Document | Description | Niveau |
|----------|-------------|--------|
| [README_MODERATION.md](README_MODERATION.md) | Guide de démarrage modération | 🟢 Débutant |
| [MODERATION_GUIDE.md](MODERATION_GUIDE.md) | Guide complet du système | 🟡 Intermédiaire |
| [MODERATION_SUMMARY.md](MODERATION_SUMMARY.md) | Résumé détaillé avec exemples | 🟡 Intermédiaire |

### 🔧 Référence Technique

| Document | Description | Niveau |
|----------|-------------|--------|
| [API_REFERENCE.md](API_REFERENCE.md) | Référence API stoat.py | 🔴 Avancé |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Architecture du projet | 🟡 Intermédiaire |
| [PROJECT_COMPLETE.md](PROJECT_COMPLETE.md) | Présentation visuelle complète | 🟡 Intermédiaire |

### 🤝 Contribution

| Document | Description | Niveau |
|----------|-------------|--------|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Guide de contribution | 🔴 Avancé |
| [CHANGELOG.md](CHANGELOG.md) | Historique des versions | 🟢 Tous niveaux |

### 🐛 Dépannage

| Document | Description | Niveau |
|----------|-------------|--------|
| [TROUBLESHOOTING_INVALIDSESSION.md](TROUBLESHOOTING_INVALIDSESSION.md) | Résoudre erreur InvalidSession | 🟢 Débutant |

### 📊 Résumés

| Document | Description | Niveau |
|----------|-------------|--------|
| [FINAL_SUMMARY.md](FINAL_SUMMARY.md) | Résumé final du projet | 🟢 Tous niveaux |
| [INDEX.md](INDEX.md) | Navigation complète | 🟢 Tous niveaux |

## 🚀 Par où commencer ?

### Je découvre le bot

1. Lisez [QUICKSTART.md](QUICKSTART.md) pour démarrer en 3 minutes
2. Consultez [README.md](README.md) pour la documentation complète
3. Exécutez `python test_config.py` pour tester votre installation

### Je veux utiliser la modération

1. Lisez [README_MODERATION.md](README_MODERATION.md) pour comprendre le système
2. Consultez [MODERATION_GUIDE.md](MODERATION_GUIDE.md) pour les détails
3. Exécutez `python test_moderation.py` pour valider la configuration
4. Démarrez avec `python moderation_bot.py`

### Je veux développer

1. Lisez [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) pour l'architecture
2. Consultez [API_REFERENCE.md](API_REFERENCE.md) pour l'API
3. Lisez [CONTRIBUTING.md](CONTRIBUTING.md) avant de contribuer

### J'ai un problème

1. Consultez [TROUBLESHOOTING_INVALIDSESSION.md](TROUBLESHOOTING_INVALIDSESSION.md) si erreur de token
2. Vérifiez les logs du bot
3. Exécutez les scripts de test appropriés

## 📁 Organisation

```
QUOKKA/bot/
├── docs/                           # 📚 Toute la documentation (vous êtes ici)
│   ├── README.md                   # Documentation générale
│   ├── QUICKSTART.md               # Démarrage rapide
│   ├── README_MODERATION.md        # Guide modération
│   ├── MODERATION_GUIDE.md         # Détails modération
│   ├── API_REFERENCE.md            # Référence API
│   ├── PROJECT_STRUCTURE.md        # Architecture
│   ├── CONTRIBUTING.md             # Contribution
│   ├── CHANGELOG.md                # Versions
│   └── ...                         # Autres docs
│
├── welcome_bot.py                  # Bot simple
├── advanced_bot.py                 # Bot avancé
├── moderation_bot.py               # Bot avec modération
├── test_config.py                  # Tests configuration
├── test_moderation.py              # Tests modération
├── config.json                     # Configuration
├── .env                            # Variables (sensible)
├── requirements.txt                # Dépendances
└── start_bot.bat/sh                # Scripts de démarrage
```

## 🎯 Liens Rapides

### Documentation Essentielle

- **Démarrer rapidement** → [QUICKSTART.md](QUICKSTART.md)
- **Documentation complète** → [README.md](README.md)
- **Système de modération** → [README_MODERATION.md](README_MODERATION.md)
- **Référence API** → [API_REFERENCE.md](API_REFERENCE.md)
- **Dépannage** → [TROUBLESHOOTING_INVALIDSESSION.md](TROUBLESHOOTING_INVALIDSESSION.md)

### Par Fonctionnalité

**Message de bienvenue :**
- [README.md](README.md) - Section "Message de bienvenue"
- [welcome_bot.py](../welcome_bot.py) - Code source

**Modération de serveurs :**
- [README_MODERATION.md](README_MODERATION.md) - Guide complet
- [MODERATION_GUIDE.md](MODERATION_GUIDE.md) - Détails techniques
- [moderation_bot.py](../moderation_bot.py) - Code source

**Configuration :**
- [QUICKSTART.md](QUICKSTART.md) - Configuration rapide
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Configuration avancée

## 📊 Statistiques de la Documentation

- **Fichiers Markdown :** 14
- **Lignes de documentation :** ~2500
- **Taille totale :** ~120 KB
- **Langues :** Français
- **Format :** Markdown avec tables et exemples

## 🔗 Ressources Externes

- [Documentation stoat.py](https://stoatpy.readthedocs.io/)
- [Stoat Developer Docs](https://developers.stoat.chat/)
- [GitHub stoat.py](https://github.com/MCausc78/stoat.py)
- [Serveur Stoat](https://rvlt.gg/ZZQb4sxx)

## 📞 Besoin d'Aide ?

1. **Consultez la documentation appropriée** dans ce dossier
2. **Exécutez les tests** pour diagnostiquer les problèmes
3. **Vérifiez les logs** du bot pour plus de détails
4. **Lisez le guide de dépannage** si vous avez une erreur spécifique

---

**Version :** 2.0  
**Dernière mise à jour :** 15 février 2026  
**Projet :** QUOKKA Bot Stoat.chat
