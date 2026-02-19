# 🤝 Guide de Contribution - Bot Stoat.chat QUOKKA

Merci de votre intérêt pour contribuer au bot Stoat.chat de QUOKKA ! Ce document vous guidera à travers le processus de contribution.

## 📋 Table des matières

1. [Code de conduite](#code-de-conduite)
2. [Comment contribuer](#comment-contribuer)
3. [Structure du projet](#structure-du-projet)
4. [Standards de code](#standards-de-code)
5. [Tests](#tests)
6. [Documentation](#documentation)
7. [Soumettre une contribution](#soumettre-une-contribution)

## 🤗 Code de conduite

- Soyez respectueux et constructif
- Acceptez les critiques constructives
- Concentrez-vous sur ce qui est meilleur pour la communauté
- Faites preuve d'empathie envers les autres contributeurs

## 🎯 Comment contribuer

### Types de contributions acceptées

#### 🐛 Rapporter des bugs
- Utilisez les issues GitHub
- Décrivez le comportement attendu vs observé
- Fournissez les logs d'erreur
- Précisez votre environnement (OS, Python version)

#### ✨ Proposer des fonctionnalités
- Ouvrez une issue pour discussion
- Expliquez le cas d'usage
- Proposez une implémentation si possible

#### 📚 Améliorer la documentation
- Corrections de fautes
- Ajout d'exemples
- Clarifications
- Traductions

#### 💻 Contribuer du code
- Corrections de bugs
- Nouvelles fonctionnalités
- Optimisations
- Tests

## 🏗️ Structure du projet

```
bot/
├── welcome_bot.py          # Bot simple
├── advanced_bot.py         # Bot avancé
├── test_config.py          # Tests de configuration
├── config.json             # Configuration
├── .env                    # Variables (non versionné)
├── requirements.txt        # Dépendances
└── docs/                   # Documentation
    ├── README.md
    ├── QUICKSTART.md
    ├── API_REFERENCE.md
    ├── PROJECT_STRUCTURE.md
    └── CONTRIBUTING.md (ce fichier)
```

## 📝 Standards de code

### Python

#### Style de code
Suivez [PEP 8](https://pep8.org/) :

```python
# Bon
def send_welcome_message(member, channel):
    """Envoie un message de bienvenue."""
    message = f"Bienvenue {member.mention} !"
    await channel.send(message)

# Mauvais
def SendWelcome(m,c):
    msg=f"Bienvenue {m.mention} !"
    await c.send(msg)
```

#### Conventions de nommage

```python
# Variables et fonctions : snake_case
user_count = 0
def get_channel_id():
    pass

# Classes : PascalCase
class WelcomeBot:
    pass

# Constantes : UPPER_CASE
MAX_RETRIES = 3
DEFAULT_MESSAGE = "Bienvenue"
```

#### Documentation

```python
def send_message(channel, content):
    """
    Envoie un message dans un canal.
    
    Args:
        channel: Canal de destination
        content (str): Contenu du message
        
    Returns:
        Message: L'objet message envoyé
        
    Raises:
        PermissionError: Si le bot n'a pas la permission
    """
    return await channel.send(content)
```

#### Gestion des erreurs

```python
# Bon - Erreurs spécifiques
try:
    channel = await client.fetch_channel(channel_id)
except stoat.NotFound:
    print(f"Canal {channel_id} non trouvé")
except stoat.Forbidden:
    print("Permission refusée")
except Exception as e:
    print(f"Erreur inattendue: {e}")

# Mauvais - Erreur générique seule
try:
    channel = await client.fetch_channel(channel_id)
except:
    pass
```

#### Async/Await

```python
# Bon - Utiliser async/await
async def on_message(event, /):
    message = event.message
    await message.channel.send("Réponse")

# Mauvais - Mélanger sync/async
def on_message(event, /):
    message = event.message
    message.channel.send("Réponse")  # Erreur !
```

### JSON

```json
{
  "bot": {
    "name": "Bot Name",
    "description": "Description"
  },
  "welcome": {
    "enabled": true,
    "messages": [
      "Message 1",
      "Message 2"
    ]
  }
}
```

- Indentation : 2 espaces
- Clés en snake_case
- Pas de virgule finale

## 🧪 Tests

### Test de configuration

Toujours tester avec `test_config.py` :

```bash
python test_config.py
```

### Test du bot

```bash
# Version simple
python welcome_bot.py

# Version avancée
python advanced_bot.py
```

### Tests unitaires (futur)

```python
import unittest

class TestWelcomeBot(unittest.TestCase):
    def test_message_formatting(self):
        """Test du formatage du message."""
        member_name = "TestUser"
        message = format_welcome(member_name)
        self.assertIn("Bienvenue", message)
        self.assertIn(member_name, message)
```

## 📖 Documentation

### Documenter les fonctions

```python
async def send_welcome(member, channel_id):
    """
    Envoie un message de bienvenue à un nouveau membre.
    
    Cette fonction récupère le canal de bienvenue, formate
    un message personnalisé et l'envoie.
    
    Args:
        member (Member): Le nouveau membre
        channel_id (str): L'ID du canal de destination
        
    Returns:
        bool: True si le message a été envoyé, False sinon
        
    Example:
        >>> member = event.member
        >>> await send_welcome(member, "01KHCH5Y324FH1HP45S6JZJ1H4")
        True
    """
    pass
```

### Mettre à jour les docs

Après modification, mettre à jour :
- `README.md` si fonctionnalité majeure
- `CHANGELOG.md` pour toute modification
- `API_REFERENCE.md` si nouvelle API
- Commentaires dans le code

## 🚀 Soumettre une contribution

### 1. Fork et Clone

```bash
# Fork sur GitHub, puis :
git clone https://github.com/votre-username/projet.git
cd projet/QUOKKA/bot
```

### 2. Créer une branche

```bash
# Nom descriptif
git checkout -b feature/nouvelle-fonctionnalite
# ou
git checkout -b fix/correction-bug
```

### 3. Développer

```bash
# Installer les dépendances
pip install -r requirements.txt

# Faire vos modifications

# Tester
python test_config.py
python welcome_bot.py  # Ou advanced_bot.py
```

### 4. Commiter

```bash
# Messages clairs et descriptifs
git add .
git commit -m "feat: Ajout de la commande !stats"
# ou
git commit -m "fix: Correction du bug de mention"
```

**Format des messages de commit :**

```
<type>: <description courte>

<description détaillée optionnelle>
```

**Types :**
- `feat` - Nouvelle fonctionnalité
- `fix` - Correction de bug
- `docs` - Documentation uniquement
- `style` - Formatage, pas de changement de code
- `refactor` - Refactoring du code
- `test` - Ajout de tests
- `chore` - Maintenance, dépendances

**Exemples :**

```bash
git commit -m "feat: Ajout mode aléatoire pour messages bienvenue"
git commit -m "fix: Correction encodage Windows dans logs"
git commit -m "docs: Mise à jour README avec nouvelles commandes"
git commit -m "refactor: Simplification gestion événements"
```

### 5. Pousser

```bash
git push origin feature/nouvelle-fonctionnalite
```

### 6. Pull Request

1. Allez sur GitHub
2. Créez une Pull Request
3. Décrivez vos changements
4. Attendez la review

**Template de PR :**

```markdown
## Description
Brève description des changements

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Documentation
- [ ] Refactoring

## Tests effectués
- [ ] test_config.py passe
- [ ] Bot démarre sans erreur
- [ ] Fonctionnalité testée manuellement

## Checklist
- [ ] Code suit les standards PEP 8
- [ ] Documentation mise à jour
- [ ] CHANGELOG.md mis à jour
- [ ] Pas de warnings/erreurs
```

## 🔍 Review Process

### Ce que nous vérifions

1. **Fonctionnalité**
   - Le code fait ce qu'il doit faire
   - Pas de régression
   - Tests passent

2. **Qualité**
   - Suit les standards
   - Code lisible
   - Bien documenté

3. **Sécurité**
   - Pas de failles
   - Pas de données sensibles exposées
   - Validation des entrées

4. **Performance**
   - Pas d'impact négatif
   - Optimisations si possible

## 💡 Bonnes pratiques

### Code

✅ **Faire**
- Écrire du code simple et lisible
- Commenter les parties complexes
- Gérer les erreurs proprement
- Tester avant de commiter
- Suivre les conventions

❌ **Ne pas faire**
- Commiter du code commenté
- Ignorer les erreurs
- Utiliser des variables globales excessivement
- Commiter des fichiers sensibles (.env)
- Faire de gros commits monolithiques

### Commits

✅ **Faire**
- Commits atomiques (une fonctionnalité = un commit)
- Messages descriptifs
- Commiter souvent
- Séparer refactoring et fonctionnalités

❌ **Ne pas faire**
- Commits énormes
- Messages vagues ("fix", "update")
- Mélanger plusieurs changements
- Commiter des fichiers générés

### Communication

✅ **Faire**
- Poser des questions
- Accepter les critiques
- Expliquer vos choix
- Être patient

❌ **Ne pas faire**
- Être défensif
- Ignorer les commentaires
- Partir dans des débats hors-sujet

## 🎓 Ressources

### Documentation officielle
- [Python Docs](https://docs.python.org/)
- [stoat.py Docs](https://stoatpy.readthedocs.io/)
- [Stoat API](https://developers.stoat.chat/)

### Standards
- [PEP 8 - Style Guide](https://pep8.org/)
- [PEP 257 - Docstrings](https://www.python.org/dev/peps/pep-0257/)
- [Keep a Changelog](https://keepachangelog.com/)

### Outils
- [Black](https://black.readthedocs.io/) - Formatage automatique
- [Pylint](https://pylint.org/) - Linter Python
- [MyPy](http://mypy-lang.org/) - Type checking

## ❓ Questions ?

- 💬 Ouvrez une issue sur GitHub
- 📧 Contactez l'équipe QUOKKA
- 📚 Consultez la documentation

## 🙏 Remerciements

Merci à tous les contributeurs qui aident à améliorer ce bot !

### Contributeurs actuels
- Équipe QUOKKA - Développement initial

### Contributions spéciales
- MCausc78 - Bibliothèque stoat.py
- Stoat Team - Plateforme Stoat.chat

---

**Bonne contribution ! 🎉**
