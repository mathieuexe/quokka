# 📚 Référence API - Bot Stoat.chat

Ce document liste les principales fonctionnalités de l'API stoat.py utilisées dans le bot.

## 🔌 Connexion

### Client
```python
import stoat

client = stoat.Client()
client.run('token')
```

## 📡 Événements

### ReadyEvent
Déclenché quand le bot est connecté et prêt.

```python
@client.on(stoat.ReadyEvent)
async def on_ready(event, /):
    print(f'Bot connecté: {event.me.tag}')
    print(f'ID: {event.me.id}')
```

**Attributs de l'événement:**
- `event.me` - Informations sur le bot (User object)
- `event.me.tag` - Nom d'utilisateur du bot
- `event.me.id` - ID unique du bot

### ServerMemberJoinEvent
Déclenché quand un membre rejoint un serveur.

```python
@client.on(stoat.ServerMemberJoinEvent)
async def on_member_join(event, /):
    member = event.member
    print(f'Nouveau membre: {member.name}')
```

**Attributs de l'événement:**
- `event.server_id` - ID du serveur
- `event.member` - Objet Member représentant le nouveau membre
- `event.member.id` - ID du membre
- `event.member.name` - Nom d'utilisateur
- `event.member.mention` - Mention formatée (@utilisateur)

### MessageCreateEvent
Déclenché lors de la réception d'un nouveau message.

```python
@client.on(stoat.MessageCreateEvent)
async def on_message(event, /):
    message = event.message
    if message.content.startswith('!ping'):
        await message.channel.send('Pong!')
```

**Attributs de l'événement:**
- `event.message` - Objet Message
- `event.message.content` - Contenu du message
- `event.message.author` - Auteur du message (User)
- `event.message.channel` - Canal où le message a été envoyé
- `event.message.author.relationship` - Relation avec le bot

## 💬 Envoi de messages

### Envoyer dans un canal

```python
# Récupérer un canal
channel = await client.fetch_channel('channel_id')

# Envoyer un message
await channel.send('Hello World!')

# Message avec formatage
await channel.send('**Gras** *Italique* `Code`')
```

### Répondre à un message

```python
@client.on(stoat.MessageCreateEvent)
async def on_message(event, /):
    message = event.message
    await message.channel.send('Réponse')
```

## 👤 Objets utilisateur

### User
Représente un utilisateur Stoat.

**Attributs:**
- `id` - ID unique
- `name` - Nom d'utilisateur
- `tag` - Tag complet
- `mention` - Mention formatée
- `relationship` - Statut de relation

### Member
Représente un membre d'un serveur (hérite de User).

**Attributs supplémentaires:**
- `server` - Serveur du membre
- `nickname` - Surnom sur le serveur (si défini)
- `roles` - Liste des rôles du membre

## 🛡️ RelationshipStatus

Énumération des statuts de relation :

```python
stoat.RelationshipStatus.user        # C'est le bot lui-même
stoat.RelationshipStatus.friend      # Ami
stoat.RelationshipStatus.blocked     # Bloqué
stoat.RelationshipStatus.none        # Aucune relation
```

**Usage:**
```python
if message.author.relationship is stoat.RelationshipStatus.user:
    return  # Ignorer les messages du bot
```

## 🎨 Formatage des messages

Stoat supporte le Markdown :

```python
# Gras
await channel.send('**Texte en gras**')

# Italique
await channel.send('*Texte en italique*')

# Code inline
await channel.send('`code`')

# Bloc de code
await channel.send('```python\nprint("Hello")\n```')

# Liens
await channel.send('[Texte](https://exemple.com)')

# Mentions
await channel.send(f'Bienvenue {member.mention} !')

# Émojis
await channel.send('🎉 🎊 🎈')

# Titres
await channel.send('# Titre 1\n## Titre 2')

# Listes
await channel.send('• Point 1\n• Point 2')
```

## 🔍 Récupération d'objets

### Récupérer un canal

```python
channel = await client.fetch_channel('channel_id')
```

### Récupérer un utilisateur

```python
user = await client.fetch_user('user_id')
```

### Récupérer un serveur

```python
server = await client.fetch_server('server_id')
```

## ⚠️ Gestion des erreurs

```python
try:
    channel = await client.fetch_channel(CHANNEL_ID)
    await channel.send('Message')
except stoat.NotFound:
    print('Canal non trouvé')
except stoat.Forbidden:
    print('Pas de permission')
except stoat.HTTPException as e:
    print(f'Erreur HTTP: {e}')
except Exception as e:
    print(f'Erreur: {e}')
```

## 🔐 Permissions

Le bot doit avoir les permissions nécessaires sur le serveur :
- 📖 Lecture des messages
- ✉️ Envoi de messages
- 👥 Voir les membres

## 📊 Événements additionnels disponibles

- `ServerMemberLeaveEvent` - Membre quitte le serveur
- `MessageUpdateEvent` - Message modifié
- `MessageDeleteEvent` - Message supprimé
- `ChannelCreateEvent` - Canal créé
- `ChannelUpdateEvent` - Canal modifié
- `ChannelDeleteEvent` - Canal supprimé
- `ServerRoleCreateEvent` - Rôle créé
- `ServerRoleUpdateEvent` - Rôle modifié
- `ServerRoleDeleteEvent` - Rôle supprimé

## 🔗 Ressources

- [Documentation stoat.py](https://stoatpy.readthedocs.io/)
- [Documentation API Stoat](https://developers.stoat.chat/)
- [GitHub stoat.py](https://github.com/MCausc78/stoat.py)
- [Serveur Stoat de support](https://rvlt.gg/ZZQb4sxx)

## 💡 Exemples d'utilisation

### Bot qui compte les messages

```python
message_count = {}

@client.on(stoat.MessageCreateEvent)
async def on_message(event, /):
    author_id = event.message.author.id
    message_count[author_id] = message_count.get(author_id, 0) + 1
    
    if event.message.content == '!count':
        count = message_count.get(author_id, 0)
        await event.message.channel.send(f'Tu as envoyé {count} messages')
```

### Bot avec commandes personnalisées

```python
commands = {
    'salut': 'Bonjour ! 👋',
    'aide': 'Commandes: !salut, !aide, !ping',
    'ping': 'Pong! 🏓'
}

@client.on(stoat.MessageCreateEvent)
async def on_message(event, /):
    msg = event.message
    
    if msg.author.relationship is stoat.RelationshipStatus.user:
        return
    
    if msg.content.startswith('!'):
        cmd = msg.content[1:].lower()
        if cmd in commands:
            await msg.channel.send(commands[cmd])
```

### Bot avec réactions

```python
@client.on(stoat.MessageCreateEvent)
async def on_message(event, /):
    msg = event.message
    
    # Réagir avec un emoji si le message contient "merci"
    if 'merci' in msg.content.lower():
        await msg.add_reaction('❤️')
```
