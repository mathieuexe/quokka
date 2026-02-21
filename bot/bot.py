#!/usr/bin/env python3
"""
Bot QUOKKA pour Stoat.chat - Version Unifiée
Toutes les fonctionnalités en un seul fichier :
- Message de bienvenue automatique
- Système de modération des soumissions
- Commande !clear pour modérateurs
- Commandes diverses
"""
import os
import json
import random
import asyncio
import time
import stoat
import requests
from dotenv import load_dotenv

# ============================================================================
# CONFIGURATION
# ============================================================================

load_dotenv()

# Variables d'environnement
BOT_TOKEN = os.getenv('BOT_TOKEN')
SERVER_ID = os.getenv('SERVER_ID')
WELCOME_CHANNEL_ID = os.getenv('WELCOME_CHANNEL_ID')
LEAVE_CHANNEL_ID = os.getenv('LEAVE_CHANNEL_ID')
SUBMISSION_CHANNEL_ID = os.getenv('SUBMISSION_CHANNEL_ID')
MODERATOR_ROLE_1 = os.getenv('MODERATOR_ROLE_1')
MODERATOR_ROLE_2 = os.getenv('MODERATOR_ROLE_2')
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')
DEFAULT_NOTIFICATION_CHANNEL_ID = "01KHCH5Y324FH1HP45S6JZJ1H4"
NOTIFICATION_CHANNEL_ID = os.getenv('NOTIFICATION_CHANNEL_ID') or WELCOME_CHANNEL_ID or LEAVE_CHANNEL_ID or DEFAULT_NOTIFICATION_CHANNEL_ID
GRADIENT_ROLE_ID = os.getenv('GRADIENT_ROLE_ID') or MODERATOR_ROLE_1 or "01KHCAJ20T9SATYM1PDTYXKZ61"
GRADIENT_COLORS = [
    "#c00000",
    "#c70714",
    "#ce0f28",
    "#d5163c",
    "#dc1d50",
    "#e32563",
    "#ea2c77",
    "#f1338b",
    "#f83b9f",
    "#ff42b3"
]
GRADIENT_STEPS = 8

# Charger la configuration JSON (optionnel)
try:
    with open('config.json', 'r', encoding='utf-8') as f:
        config = json.load(f)
except FileNotFoundError:
    config = {
        "welcome": {"enabled": True, "messages": [], "random_message": False},
        "commands": {"prefix": "!"},
        "logging": {"verbose": True}
    }

# Stockage des soumissions en attente
pending_submissions = {}

# Stockage des utilisateurs bannis
banned_users = {}  # Format: {user_id: {'reason': str, 'duration': int, 'expires_at': float, 'banned_by': str}}

# Stockage des utilisateurs mutés
muted_users = {}  # Format: {user_id: {'reason': str, 'duration': int, 'expires_at': float, 'muted_by': str}}

# Stockage des avertissements
user_warnings = {}  # Format: {user_id: [{'reason': str, 'warned_by': str, 'timestamp': float}]}

# Créer le client
client = stoat.Client()

MOODS = [
    {"id": "joie", "tone": "chaleureux, lumineux, enthousiaste"},
    {"id": "tristesse", "tone": "doux, réservé, compatissant"},
    {"id": "colère", "tone": "tendu, direct, parfois sec"},
    {"id": "peur", "tone": "prudent, hésitant, inquiet"},
    {"id": "dégoût", "tone": "réservé, critique, distant"},
    {"id": "surprise", "tone": "vif, curieux, réactif"},
    {"id": "amour", "tone": "tendre, bienveillant, attentionné"},
    {"id": "haine", "tone": "froid, dur, abrupt"},
    {"id": "anxiété", "tone": "nerveux, inquiet, prudent"},
    {"id": "stress", "tone": "pressé, tendu, concis"},
    {"id": "sérénité", "tone": "calme, apaisé, posé"},
    {"id": "apaisement", "tone": "doux, rassurant, calme"},
    {"id": "frustration", "tone": "agacé, impatient, bref"},
    {"id": "culpabilité", "tone": "hésitant, humble, réservé"},
    {"id": "honte", "tone": "discret, gêné, bas"},
    {"id": "fierté", "tone": "assuré, positif, droit"},
    {"id": "jalousie", "tone": "piquant, sur la défensive"},
    {"id": "envie", "tone": "curieux, un peu comparatif"},
    {"id": "compassion", "tone": "doux, empathique, réconfortant"},
    {"id": "empathie", "tone": "à l’écoute, compréhensif"},
    {"id": "indifférence", "tone": "neutre, distant, minimal"},
    {"id": "ennui", "tone": "plat, lent, peu expressif"},
    {"id": "excitation", "tone": "énergique, vif, enthousiaste"},
    {"id": "espoir", "tone": "positif, encourageant"},
    {"id": "désespoir", "tone": "sombre, fataliste, lent"},
    {"id": "nostalgie", "tone": "doux, rêveur, mélancolique"},
    {"id": "mélancolie", "tone": "calme, sensible, réfléchi"},
    {"id": "soulagement", "tone": "léger, rassuré, posé"},
    {"id": "satisfaction", "tone": "content, serein, stable"},
    {"id": "insatisfaction", "tone": "critique, contrarié"},
    {"id": "admiration", "tone": "respectueux, enthousiaste"},
    {"id": "mépris", "tone": "sec, distant, froid"},
    {"id": "confiance", "tone": "assuré, stable, clair"},
    {"id": "méfiance", "tone": "prudent, réservé"},
    {"id": "insécurité", "tone": "hésitant, prudent, fragile"},
    {"id": "assurance", "tone": "déterminé, posé, sûr"},
    {"id": "panique", "tone": "pressé, désorganisé, inquiet"},
    {"id": "euphorie", "tone": "très enthousiaste, rapide"},
    {"id": "lassitude", "tone": "fatigué, lent, sobre"},
    {"id": "fatigue émotionnelle", "tone": "épuisé, calme, court"},
    {"id": "gratitude", "tone": "chaleureux, reconnaissant"},
    {"id": "amertume", "tone": "froid, amer, pincé"},
    {"id": "tendresse", "tone": "doux, attentionné"},
    {"id": "attachement", "tone": "proche, rassurant"},
    {"id": "détachement", "tone": "neutre, distant"},
    {"id": "solitude", "tone": "calme, un peu triste"},
    {"id": "plénitude", "tone": "paisible, serein"},
    {"id": "vulnérabilité", "tone": "hésitant, sensible"},
    {"id": "motivation", "tone": "énergique, déterminé"},
    {"id": "démotivation", "tone": "terne, hésitant"},
    {"id": "détermination", "tone": "ferme, direct, confiant"},
    {"id": "résignation", "tone": "calme, fataliste"},
    {"id": "confusion", "tone": "hésitant, flou"},
    {"id": "clarté", "tone": "précis, net, direct"},
    {"id": "curiosité", "tone": "curieux, ouvert, stimulant"},
    {"id": "émerveillement", "tone": "étonné, enthousiaste"},
    {"id": "irritation", "tone": "agacé, bref"},
    {"id": "agacement", "tone": "impatient, sec"},
    {"id": "rancune", "tone": "froid, dur"},
    {"id": "pardon", "tone": "calme, apaisé"},
    {"id": "affection", "tone": "chaleureux, proche"},
    {"id": "rejet", "tone": "froid, distant"},
    {"id": "anticipation", "tone": "attentif, impatient"},
    {"id": "inquiétude", "tone": "prudent, inquiet"},
    {"id": "sérénité intérieure", "tone": "paisible, centré"},
    {"id": "extase", "tone": "très enthousiaste, exalté"},
    {"id": "apathie", "tone": "neutre, peu expressif"},
    {"id": "torpeur", "tone": "lent, lourd"},
    {"id": "hypervigilance", "tone": "alerte, tendu"},
    {"id": "timidité", "tone": "discret, réservé"},
    {"id": "embarras", "tone": "gêné, hésitant"},
    {"id": "contentement", "tone": "posé, satisfait"},
    {"id": "bien-être", "tone": "doux, positif"},
    {"id": "mal-être", "tone": "fragile, sombre"},
    {"id": "enthousiasme", "tone": "énergique, positif"},
    {"id": "retenue", "tone": "mesuré, prudent"},
    {"id": "regret", "tone": "doux, introspectif"},
    {"id": "remords", "tone": "hésitant, contrit"},
    {"id": "exaltation", "tone": "élevé, dynamique"},
    {"id": "tension", "tone": "tendu, court"},
    {"id": "relâchement", "tone": "calme, détendu"}
]

WELLBEING_TEMPLATES = [
    "En ce moment je suis dans une humeur {mood}, avec un ton {tone}. Que veux-tu savoir ?",
    "Je me sens plutôt {mood} là, donc je réponds {tone}. Tu as besoin de quoi ?",
    "Je suis {mood} aujourd'hui, {tone}. Dis-moi ce que tu veux."
]

AI_FALLBACK_TEMPLATES = [
    "Je suis {mood} en ce moment, donc je réponds {tone}. Je ne peux pas accéder à l'IA pour l'instant.",
    "Humeur {mood} ({tone}). Je ne peux pas utiliser l'IA maintenant, réessaie un peu plus tard.",
    "Là je suis {mood}, {tone}. L'IA est indisponible, désolé."
]

THINKING_TEMPLATES = [
    "Je réfléchis, humeur {mood} ({tone}).",
    "Je traite ta question avec une humeur {mood}, ton {tone}.",
    "Je cherche une réponse, humeur {mood} ({tone})."
]

def pick_mood():
    return random.choice(MOODS)

def is_wellbeing_question(text):
    normalized = text.lower()
    return (
        "ça va" in normalized
        or "ca va" in normalized
        or "comment tu vas" in normalized
        or "comment vas-tu" in normalized
        or "tu vas bien" in normalized
        or "comment allez-vous" in normalized
        or "tu vas bien ?" in normalized
        or "ça va ?" in normalized
        or "ca va ?" in normalized
    )

def pick_wellbeing_response(mood):
    template = random.choice(WELLBEING_TEMPLATES)
    return template.format(mood=mood["id"], tone=mood["tone"])

def pick_ai_fallback(mood):
    if not mood:
        return "Je ne peux pas accéder à l'IA pour l'instant."
    template = random.choice(AI_FALLBACK_TEMPLATES)
    return template.format(mood=mood["id"], tone=mood["tone"])

def pick_thinking_response(mood):
    template = random.choice(THINKING_TEMPLATES)
    return template.format(mood=mood["id"], tone=mood["tone"])

# ============================================================================
# FONCTIONS UTILITAIRES
# ============================================================================

def add_warning(user_id, reason, warned_by):
    """Ajoute un avertissement à un utilisateur"""
    if user_id not in user_warnings:
        user_warnings[user_id] = []
    
    warning = {
        'reason': reason,
        'warned_by': warned_by,
        'timestamp': time.time()
    }
    
    user_warnings[user_id].append(warning)
    return len(user_warnings[user_id])


def get_user_warnings(user_id):
    """Récupère les avertissements d'un utilisateur"""
    return user_warnings.get(user_id, [])


def parse_duration(duration_str):
    """Parse une durée string et retourne le nombre de secondes"""
    if not duration_str:
        return 0
    
    # Convertir en minuscules pour faciliter la comparaison
    duration_str = duration_str.lower().strip()
    
    # Extraire le nombre et l'unité
    import re
    match = re.match(r'(\d+)\s*([smhdj])', duration_str)
    if not match:
        return 0
    
    amount = int(match.group(1))
    unit = match.group(2)
    
    # Convertir en secondes
    if unit == 's':
        return amount
    elif unit == 'm':
        return amount * 60
    elif unit == 'h':
        return amount * 3600
    elif unit == 'd':
        return amount * 86400
    elif unit == 'j':  # Jours en français
        return amount * 86400
    else:
        return 0


async def cleanup_user_messages(channel, user_id, limit=100):
    """Nettoie les messages d'un utilisateur dans un canal"""
    try:
        messages = await client.fetch_messages(channel.id, limit=limit)
        deleted_count = 0
        
        for msg in messages:
            if msg.author.id == user_id:
                try:
                    await msg.delete()
                    deleted_count += 1
                    # Petit délai pour éviter le rate limiting
                    await asyncio.sleep(0.1)
                except Exception as e:
                    print(f'[ERREUR] Impossible de supprimer le message: {e}')
        
        return deleted_count
    except Exception as e:
        print(f'[ERREUR] Erreur lors du nettoyage des messages: {e}')
        return 0

import time

async def check_moderator_permission(user_id):
    """Vérifie si un utilisateur a les permissions de modérateur"""
    try:
        server = await client.fetch_server(SERVER_ID)
        member = await server.fetch_member(user_id)
        
        member_role_ids = [role.id for role in member.roles] if hasattr(member, 'roles') and member.roles else []
        
        if MODERATOR_ROLE_1 in member_role_ids or MODERATOR_ROLE_2 in member_role_ids:
            return True
        
        return False
    except Exception as e:
        print(f'[ERREUR] Verification permissions: {e}')
        return False


async def check_admin_permission(user_id):
    """Vérifie si un utilisateur a les permissions d'administrateur"""
    try:
        server = await client.fetch_server(SERVER_ID)
        member = await server.fetch_member(user_id)
        
        # Vérifier si l'utilisateur est propriétaire du serveur
        if hasattr(member, 'is_owner') and member.is_owner:
            return True
        
        # Vérifier si l'utilisateur a des permissions d'administrateur
        if hasattr(member, 'permissions') and hasattr(member.permissions, 'administrator'):
            if member.permissions.administrator:
                return True
        
        # Vérifier les rôles d'administrateur (si définis dans l'env)
        admin_role = os.getenv('ADMIN_ROLE_ID')
        if admin_role:
            member_role_ids = [role.id for role in member.roles] if hasattr(member, 'roles') and member.roles else []
            if admin_role in member_role_ids:
                return True
        
        # Si aucun des critères n'est rempli, vérifier s'il a les permissions de modérateur
        return await check_moderator_permission(user_id)
        
    except Exception as e:
        print(f'[ERREUR] Verification permissions admin: {e}')
        return False


def parse_duration(duration_str):
    """Parse une durée (ex: '1h', '30m', '7d') et retourne le nombre de secondes"""
    if not duration_str:
        return None
    
    duration_str = duration_str.lower().strip()
    
    if duration_str.endswith('s'):
        return int(duration_str[:-1])
    elif duration_str.endswith('m'):
        return int(duration_str[:-1]) * 60
    elif duration_str.endswith('h'):
        return int(duration_str[:-1]) * 3600
    elif duration_str.endswith('d'):
        return int(duration_str[:-1]) * 86400
    elif duration_str.endswith('w'):
        return int(duration_str[:-1]) * 604800
    else:
        # Si aucun suffixe, considérer comme minutes
        return int(duration_str) * 60


def is_user_banned(user_id):
    """Vérifie si un utilisateur est banni"""
    if user_id not in banned_users:
        return False
    
    ban_info = banned_users[user_id]
    
    # Si pas de durée, c'est un ban permanent
    if 'expires_at' not in ban_info or ban_info['expires_at'] is None:
        return True
    
    # Si la durée est dépassée, retirer le ban
    if time.time() > ban_info['expires_at']:
        del banned_users[user_id]
        return False
    
    return True


def is_user_muted(user_id):
    """Vérifie si un utilisateur est muté"""
    if user_id not in muted_users:
        return False
    
    mute_info = muted_users[user_id]
    
    # Si pas de durée, c'est un mute permanent
    if 'expires_at' not in mute_info or mute_info['expires_at'] is None:
        return True
    
    # Si la durée est dépassée, retirer le mute
    if time.time() > mute_info['expires_at']:
        del muted_users[user_id]
        return False
    
    return True


def add_warning(user_id, reason, warned_by):
    """Ajoute un avertissement à un utilisateur"""
    if user_id not in user_warnings:
        user_warnings[user_id] = []
    
    warning = {
        'reason': reason,
        'warned_by': warned_by,
        'timestamp': time.time()
    }
    
    user_warnings[user_id].append(warning)
    return len(user_warnings[user_id])  # Retourne le nombre total d'avertissements


def get_user_warnings(user_id):
    """Récupère les avertissements d'un utilisateur"""
    return user_warnings.get(user_id, [])


# ============================================================================
# MISTRAL AI INTEGRATION
# ============================================================================

async def get_mistral_response(prompt, user_name="Utilisateur", mood=None):
    """Obtient une réponse de Mistral AI"""
    if not MISTRAL_API_KEY:
        return pick_ai_fallback(mood)
    
    try:
        # Préparer le contexte pour Mistral
        mood_text = ""
        if mood:
            mood_text = f" Ton humeur actuelle est \"{mood['id']}\" ({mood['tone']})."

        system_prompt = (
            "Tu es QUOKKA, un assistant IA sur un serveur Stoat. "
            "Tu aides les membres avec leurs questions, tu es poli et informatif. "
            "Réponds de manière concise mais utile. Si tu ne sais pas quelque chose, "
            f"dis-le honnêtement.{mood_text} Tu tutoies toujours et tu restes naturel. "
            "Tu es français mais peux répondre dans la langue de la question."
        )
        
        # Appel à l'API Mistral
        headers = {
            'Authorization': f'Bearer {MISTRAL_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        data = {
            "model": "mistral-tiny",  # Modèle gratuit
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 500,
            "temperature": 0.7
        }
        
        response = requests.post(
            'https://api.mistral.ai/v1/chat/completions',
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result['choices'][0]['message']['content'].strip()
        else:
            print(f"[MISTRAL] Erreur API: {response.status_code} - {response.text}")
            return pick_ai_fallback(mood)
            
    except Exception as e:
        print(f"[MISTRAL] Exception: {e}")
        return pick_ai_fallback(mood)

def is_bot_mentioned(message, bot_id):
    """Vérifie si le bot est mentionné dans le message"""
    # Vérifier les mentions directes
    for mention in message.mentions:
        if mention.id == bot_id:
            return True
    
    # Vérifier si le message commence par le nom du bot ou @bot
    content_lower = message.content.lower()
    if content_lower.startswith(f"<@{bot_id}>") or content_lower.startswith(f"<@!{bot_id}>"):
        return True
    return False

async def apply_role_gradient():
    if not SERVER_ID or not GRADIENT_ROLE_ID:
        print('[GRADIENT] Configuration manquante.')
        return
    colors = GRADIENT_COLORS[:GRADIENT_STEPS]
    if not colors:
        print('[GRADIENT] Aucune couleur définie.')
        return
    try:
        server = await client.fetch_server(SERVER_ID)
    except Exception as e:
        print(f'[GRADIENT] Impossible de récupérer le serveur: {e}')
        return
    bot_top_rank = None
    bot_member = None
    try:
        bot_member = await server.fetch_member(client.user.id)
        if bot_member is not None and hasattr(bot_member, 'top_role') and bot_member.top_role is not None:
            bot_top_rank = bot_member.top_role.rank
    except Exception as e:
        print(f'[GRADIENT] Impossible de récupérer le rôle du bot: {e}')
    roles = list(server.roles.values()) if hasattr(server, 'roles') and server.roles else []
    roles_sorted = sorted(roles, key=lambda role: role.rank) if roles else []
    if bot_top_rank is None and bot_member is not None and hasattr(bot_member, 'role_ids'):
        role_ranks = [server.roles[role_id].rank for role_id in bot_member.role_ids if role_id in server.roles]
        if role_ranks:
            bot_top_rank = min(role_ranks)
    if bot_top_rank is None:
        print('[GRADIENT] Impossible de déterminer le rang du bot.')
        return
    start_index = None
    for index, role in enumerate(roles_sorted):
        if role.id == GRADIENT_ROLE_ID:
            start_index = index
            break
    if start_index is None:
        try:
            role = await server.fetch_role(GRADIENT_ROLE_ID)
        except Exception as e:
            print(f'[GRADIENT] Rôle introuvable: {e}')
            return
        try:
            if bot_top_rank is not None and role.rank <= bot_top_rank:
                print(f'[GRADIENT] Rôle ignoré (rang supérieur ou égal au bot): {role.name}.')
                return
            await role.edit(color=colors[0])
            print(f'[GRADIENT] Couleur appliquée au rôle {role.name}.')
        except Exception as e:
            print(f'[GRADIENT] Échec modification rôle: {e}')
        return
    if roles_sorted[start_index].rank <= bot_top_rank:
        print('[GRADIENT] Rôle cible au-dessus ou égal au bot. Dégradé annulé.')
        return
    updated = 0
    skipped = 0
    for offset, color in enumerate(colors):
        target_index = start_index + offset
        if target_index >= len(roles_sorted):
            break
        target_role = roles_sorted[target_index]
        if bot_top_rank is not None and target_role.rank <= bot_top_rank:
            skipped += 1
            continue
        try:
            await target_role.edit(color=color)
            updated += 1
        except Exception as e:
            print(f'[GRADIENT] Échec pour {target_role.name}: {e}')
    print(f'[GRADIENT] Rôles mis à jour: {updated} (ignorés: {skipped})')


# ============================================================================
# ÉVÉNEMENTS
# ============================================================================

@client.on(stoat.ReadyEvent)
async def on_ready(event, /):
    """Bot connecté et prêt"""
    print('=' * 60)
    print(f'[OK] Bot connecté: {event.me.tag}')
    print(f'[INFO] ID: {event.me.id}')
    print(f'[INFO] Serveur: {SERVER_ID}')
    print(f'[INFO] Canal notifications: {NOTIFICATION_CHANNEL_ID}')
    print(f'[INFO] Canal soumission: {SUBMISSION_CHANNEL_ID}')
    print(f'[INFO] Rôle modérateur 1: {MODERATOR_ROLE_1}')
    print(f'[INFO] Rôle modérateur 2: {MODERATOR_ROLE_2}')
    print('=' * 60)
    print('[OK] Bot opérationnel!')
    print('[FONCTIONNALITÉS]')
    print('  - Message de bienvenue automatique')
    print('  - Notification de départ des membres')
    print('  - Système de modération (réactions)')
    print('  - Commande !clear (modérateurs)')
    print('  - Commandes: !ping, !aide, !moderation')
    print('  - Réponses IA (Mistral AI) quand mentionné')
    print('=' * 60)
    print('[ATTENTION] Envoyez un message dans le canal de soumission')
    print(f'            pour tester le système de modération!')
    print('=' * 60)
    await apply_role_gradient()


@client.on(stoat.ServerMemberJoinEvent)
async def on_member_join(event, /):
    """Nouveau membre rejoint le serveur"""
    try:
        member = event.member
        
        # Vérifier le serveur
        if hasattr(member, 'server') and hasattr(member.server, 'id'):
            if member.server.id != SERVER_ID:
                return
        
        print(f'[BIENVENUE] Nouveau membre: {member.name}')
        
        # Récupérer le canal
        channel = await client.fetch_channel(NOTIFICATION_CHANNEL_ID)
        
        # Message de bienvenue
        welcome_message = (
            f"🎉 **Bienvenue {member.mention}!**\n\n"
            f"On est ravis de t'accueillir sur notre serveur!\n"
            f"N'hésite pas à te présenter et à explorer les différents salons.\n\n"
            f"Si tu as des questions, n'hésite pas à demander! 😊"
        )
        
        await channel.send(welcome_message)
        print(f'[OK] Message envoyé pour {member.name}')
        
    except Exception as e:
        print(f'[ERREUR] Bienvenue: {e}')


@client.on(stoat.ServerMemberRemoveEvent)
async def on_member_remove(event, /):
    """Membre quitte le serveur"""
    try:
        member = event.member
        
        if event.server_id != SERVER_ID:
            return
        
        display_name = member.name if member else f"<@{event.user_id}>"
        mention = member.mention if member and hasattr(member, 'mention') else f"<@{event.user_id}>"
        reason = event.reason
        
        if reason == stoat.MemberRemovalIntention.kick:
            title = f"👢 **{display_name}** a été kick du serveur."
            details = "Le membre a été retiré par un modérateur."
        elif reason == stoat.MemberRemovalIntention.ban:
            title = f"🔨 **{display_name}** a été banni du serveur."
            details = "Le membre a été banni par un modérateur."
        else:
            title = f"👋 **{display_name}** a quitté le serveur."
            details = "Nous le remercions pour le temps passé avec nous et lui souhaitons le meilleur."
        
        leave_message = (
            f"{title}\n\n"
            f"{details}\n"
            f"{mention}"
        )
        
        channel = await client.fetch_channel(NOTIFICATION_CHANNEL_ID)
        await channel.send(leave_message)
        print(f'[OK] Message de départ envoyé pour {display_name}')
        
    except Exception as e:
        print(f'[ERREUR] Départ: {e}')


@client.on(stoat.MessageCreateEvent)
async def on_message(event, /):
    """Nouveau message reçu"""
    message = event.message
    
    # Debug: afficher les infos du message
    print(f'[MESSAGE] Reçu de {message.author.name} dans canal {message.channel.id}')
    
    # Ignorer les messages du bot
    if message.author.relationship is stoat.RelationshipStatus.user:
        print(f'[MESSAGE] Ignoré - message du bot')
        return
    
    # Vérifier si l'utilisateur est banni
    if message.author.id in banned_users:
        print(f'[BANNED] Message ignoré de {message.author.name} (utilisateur banni)')
        await message.channel.send(
            f"🚫 {message.author.mention} Tu es actuellement banni et tu ne peux pas envoyer de messages."
        )
        return
    
    # Vérifier si l'utilisateur est muted
    if message.author.id in muted_users:
        print(f'[MUTED] Message supprimé de {message.author.name} (utilisateur muted)')
        try:
            await message.delete()
            await message.channel.send(
                f"🔇 {message.author.mention} Tu es actuellement mute. Ton message a été supprimé."
            )
        except Exception as e:
            print(f'[ERREUR] Impossible de supprimer le message muted: {e}')
        return
    
    # Canal de soumission → Modération
    if message.channel.id == SUBMISSION_CHANNEL_ID:
        print(f'[MESSAGE] Canal de soumission détecté!')
        await handle_submission(message)
        return
    
    # Vérifier si le bot est mentionné ou si on pose une question
    if is_bot_mentioned(message, client.user.id):
        print(f'[AI] Question détectée de {message.author.name}')
        
        # Extraire la question (enlever la mention du bot)
        question = message.content
        # Enlever les mentions du bot
        question = question.replace(f"<@{client.user.id}>", "").replace(f"<@!{client.user.id}>", "")
        question = question.strip()
        
        # Si pas de question après avoir enlevé la mention, répondre avec une aide
        if not question:
            question = "Bonjour! Comment puis-je t'aider aujourd'hui?"
        
        # Obtenir la réponse de Mistral AI
        mood = pick_mood()
        await message.channel.send(f"🤖 {pick_thinking_response(mood)}")
        if is_wellbeing_question(question):
            await message.channel.send(f"{message.author.mention} {pick_wellbeing_response(mood)}")
            return

        ai_response = await get_mistral_response(question, message.author.name, mood)
        
        # Envoyer la réponse
        await message.channel.send(f"{message.author.mention} {ai_response}")
        print(f'[AI] Réponse envoyée à {message.author.name}')
        return
    
    # Commandes
    content = message.content
    
    if content.startswith('!ping'):
        await message.channel.send('🏓 Pong! Le bot fonctionne!')
        print(f'[CMD] !ping par {message.author.name}')
    
    elif content.startswith('!aide') or content.startswith('!help'):
        help_msg = (
            "📚 **Commandes disponibles:**\n\n"
            "**Tout le monde:**\n"
            "• `!ping` - Vérifier le statut du bot\n"
            "• `!aide` / `!help` - Afficher cette aide\n"
            "• `!moderation` - Informations sur la modération\n"
            "• Mentionnez le bot pour une réponse IA\n\n"
            "**Modérateurs uniquement:**\n"
            "• `!clear <nombre>` - Supprimer des messages (max 100)\n"
            "  Exemple: `!clear 10`\n\n"
            "**Administrateurs uniquement:**\n"
            "• `!ban <@user> <durée> <raison>` - Bannir un utilisateur\n"
            "  Durées: `perm`, `30m`, `1h`, `1d`, `1w`\n"
            "  Exemple: `!ban @user perm Spam massif`\n\n"
            "**Modération automatique:**\n"
            "Les messages dans le canal de soumission reçoivent les réactions ✅ ❌.\n"
            "Les modérateurs approuvent/refusent en cliquant."
        )
        await message.channel.send(help_msg)
        print(f'[CMD] !aide par {message.author.name}')
    
    elif content.startswith('!moderation'):
        mod_info = (
            "🛡️ **Système de modération**\n\n"
            f"**Canal de soumission:** <#{SUBMISSION_CHANNEL_ID}>\n"
            f"**Rôles modérateurs:** 2 configurés\n\n"
            "**Commandes admin disponibles:**\n"
            "• `!ban <@user> <durée> <raison>` - Bannir un utilisateur\n"
            "• `!mute <@user> <durée> <raison>` - Muter un utilisateur\n"
            "• `!unban <@user>` - Débannir un utilisateur\n"
            "• `!warn <@user> <raison>` - Avertir un utilisateur\n"
            "• `!warnings <@user>` - Voir les avertissements\n\n"
            "**Comment ça marche:**\n"
            "1. L'utilisateur soumet un serveur\n"
            "2. Le bot ajoute les réactions ✅ ❌\n"
            "3. Le modérateur approuve/refuse\n"
            "4. Le message est traité\n\n"
            "**Statut:** ✅ Actif"
        )
        await message.channel.send(mod_info)
        print(f'[CMD] !moderation par {message.author.name}')
    
    elif content.startswith('!clear'):
        await handle_clear(message)
    
    elif content.startswith('!ban'):
        await handle_ban(message)
    
    elif content.startswith('!mute'):
        await handle_mute(message)
    
    elif content.startswith('!unban'):
        await handle_unban(message)
    
    elif content.startswith('!warn'):
        await handle_warn(message)
    
    elif content.startswith('!warnings'):
        await handle_warnings(message)


@client.on(stoat.MessageReactEvent)
async def on_reaction(event, /):
    """Réaction ajoutée à un message"""
    try:
        print(f'[REACTION] Event recu: user_id={event.user_id}, message_id={event.message_id}, emoji={event.emoji}')
        
        # Ignorer les réactions du bot
        if hasattr(client, 'user') and client.user and event.user_id == client.user.id:
            print(f'[REACTION] Ignoree - reaction du bot')
            return
        
        message_id = event.message_id
        
        # Debug: afficher les soumissions en attente
        print(f'[DEBUG] Soumissions en attente: {list(pending_submissions.keys())}')
        print(f'[DEBUG] Message ID recu: {message_id}')
        
        # Vérifier si soumission en attente
        if message_id not in pending_submissions:
            print(f'[REACTION] Message {message_id} non trouvé dans pending_submissions')
            return
        
        print(f'[REACTION] Soumission trouvée, vérification permissions...')
        
        # Vérifier permissions
        has_permission = await check_moderator_permission(event.user_id)
        
        if not has_permission:
            print(f'[MODERATION] Utilisateur {event.user_id} sans permissions')
            channel = await client.fetch_channel(SUBMISSION_CHANNEL_ID)
            await channel.send("⚠️ Seuls les modérateurs peuvent approuver/refuser les soumissions.")
            return
        
        print(f'[REACTION] Permissions OK, traitement de la réaction...')
        
        # Récupérer le modérateur
        server = await client.fetch_server(SERVER_ID)
        moderator = await server.fetch_member(event.user_id)
        
        submission = pending_submissions[message_id]
        emoji = event.emoji
        
        print(f'[REACTION] Emoji: {emoji} (type: {type(emoji)})')
        
        # Traiter selon la réaction
        if emoji == '✅' or str(emoji) == '✅':
            print(f'[REACTION] Approbation détectée')
            await handle_approval(message_id, submission, moderator)
        elif emoji == '❌' or str(emoji) == '❌':
            print(f'[REACTION] Refus détecté')
            await handle_rejection(message_id, submission, moderator)
        else:
            print(f'[REACTION] Emoji non reconnu: {emoji}')
        
    except Exception as e:
        print(f'[ERREUR] Réaction: {e}')
        import traceback
        traceback.print_exc()


# ============================================================================
# HANDLERS - MODÉRATION
# ============================================================================

async def handle_submission(message):
    """Gérer une nouvelle soumission"""
    try:
        print(f'[SOUMISSION] Par {message.author.name} (ID: {message.author.id})')
        print(f'[SOUMISSION] Message ID: {message.id}')
        print(f'[SOUMISSION] Canal ID: {message.channel.id}')
        print(f'[SOUMISSION] Contenu: {message.content[:100]}...')
        
        # Ajouter les réactions via le client
        try:
            # Méthode 1 : via le client directement
            await client.add_reaction(message.channel.id, message.id, '✅')
            await asyncio.sleep(0.5)
            await client.add_reaction(message.channel.id, message.id, '❌')
            print(f'[MODERATION] Réactions ajoutées au message {message.id}')
        except AttributeError:
            try:
                # Méthode 2 : via le canal
                channel = message.channel
                await channel.add_reaction(message.id, '✅')
                await asyncio.sleep(0.5)
                await channel.add_reaction(message.id, '❌')
                print(f'[MODERATION] Réactions ajoutées au message {message.id}')
            except Exception as e2:
                print(f'[ERREUR] Impossible d\'ajouter les réactions: {e2}')
                print(f'[DEBUG] Attributs du message: {dir(message)}')
                print(f'[DEBUG] Attributs du canal: {dir(message.channel)}')
        
        # Stocker
        pending_submissions[message.id] = {
            'author': message.author.id,
            'author_name': message.author.name,
            'content': message.content,
            'channel': message.channel.id
        }
        
        print(f'[DEBUG] Soumission stockée. Total en attente: {len(pending_submissions)}')
        print(f'[DEBUG] IDs en attente: {list(pending_submissions.keys())}')
        
        # Confirmation
        await message.channel.send(
            f"📋 {message.author.mention} Ta soumission a été reçue!\n"
            f"Elle sera examinée par un modérateur. Merci pour ta patience! ⏳"
        )
        print(f'[OK] Soumission {message.id} en attente de modération')
        
    except Exception as e:
        print(f'[ERREUR] Soumission: {e}')
        import traceback
        traceback.print_exc()


async def handle_approval(message_id, submission, moderator):
    """Approuver une soumission"""
    try:
        print(f'[APPROBATION] Par {moderator.name}')
        
        channel = await client.fetch_channel(SUBMISSION_CHANNEL_ID)
        
        approved_msg = (
            f"✅ **SERVEUR APPROUVÉ**\n\n"
            f"{submission['content']}\n\n"
            f"*Soumis par:* <@{submission['author']}>\n"
            f"*Approuvé par:* {moderator.mention}"
        )
        
        await channel.send(approved_msg)
        
        # Supprimer le message original
        try:
            original_message = await channel.fetch_message(message_id)
            await original_message.delete()
            print(f'[OK] Message original supprimé')
        except Exception as e:
            print(f'[INFO] Impossible de supprimer le message original: {e}')
        
        del pending_submissions[message_id]
        
        print(f'[OK] Soumission {message_id} approuvée')
        
    except Exception as e:
        print(f'[ERREUR] Approbation: {e}')


async def handle_rejection(message_id, submission, moderator):
    """Refuser une soumission"""
    try:
        print(f'[REFUS] Par {moderator.name}')
        
        channel = await client.fetch_channel(SUBMISSION_CHANNEL_ID)
        
        rejection_msg = (
            f"❌ **SOUMISSION REFUSÉE**\n\n"
            f"*Soumis par:* <@{submission['author']}>\n"
            f"*Refusé par:* {moderator.mention}"
        )
        
        await channel.send(rejection_msg)
        
        # Supprimer le message original
        try:
            message = await channel.fetch_message(message_id)
            await message.delete()
            print(f'[OK] Message supprimé')
        except Exception as e:
            print(f'[INFO] Impossible de supprimer: {e}')
        
        del pending_submissions[message_id]
        print(f'[OK] Soumission {message_id} refusée')
        
    except Exception as e:
        print(f'[ERREUR] Refus: {e}')


# ============================================================================
# HANDLERS - COMMANDES
# ============================================================================

async def handle_clear(message):
    """Commande !clear pour supprimer des messages"""
    try:
        # Vérifier permissions
        has_permission = await check_moderator_permission(message.author.id)
        
        if not has_permission:
            print(f'[CLEAR] {message.author.name} sans permissions')
            await message.channel.send(
                f"❌ {message.author.mention} Tu n'as pas la permission d'utiliser cette commande.\n"
                f"Seuls les modérateurs peuvent supprimer des messages."
            )
            return
        
        # Parser le nombre
        parts = message.content.split()
        
        if len(parts) < 2:
            await message.channel.send(
                "📋 **Usage:** `!clear <nombre>`\n"
                "Exemple: `!clear 10` pour supprimer 10 messages\n"
                "Maximum: 100 messages"
            )
            return
        
        try:
            count = int(parts[1])
        except ValueError:
            await message.channel.send("❌ Merci de fournir un nombre valide.")
            return
        
        if count < 1 or count > 100:
            await message.channel.send("❌ Le nombre doit être entre 1 et 100.")
            return
        
        print(f'[CLEAR] {message.author.name} supprime {count} messages')
        
        # Supprimer le message de commande
        try:
            await message.delete()
        except Exception as e:
            print(f'[INFO] Impossible de supprimer la commande: {e}')
        
        # Pour l'instant, informer que la fonction est en développement
        # L'API Stoat peut ne pas supporter la récupération de messages historiques
        await message.channel.send(
            f"ℹ️ Fonction clear en cours de développement. "
            f"La suppression de messages historiques nécessite une API spécifique."
        )
        
        # TODO: Implémenter la suppression une fois l'API Stoat documentée
        # Pour l'instant, cette fonctionnalité est désactivée
        print(f'[CLEAR] Fonction clear non implémentée - API Stoat limitée')
        
        print(f'[OK] Commande clear exécutée')
        
    except Exception as e:
        print(f'[ERREUR] Clear: {e}')


async def handle_ban(message):
    """Commande !ban pour bannir un utilisateur"""
    try:
        # Vérifier permissions admin
        has_permission = await check_admin_permission(message.author.id)
        
        if not has_permission:
            print(f'[BAN] {message.author.name} sans permissions')
            await message.channel.send(
                f"❌ {message.author.mention} Tu n'as pas la permission d'utiliser cette commande.\n"
                f"Seuls les administrateurs peuvent bannir des utilisateurs."
            )
            return
        
        # Parser la commande
        parts = message.content.split()
        
        if len(parts) < 3:
            await message.channel.send(
                "📋 **Usage:** `!ban <@utilisateur> <durée> <raison>`\n"
                "**Durées:** `perm` (permanent), `30m`, `1h`, `1d`, `1w`\n"
                "**Exemples:**\n"
                "`!ban @utilisateur perm Spam massif`\n"
                "`!ban @utilisateur 1d Comportement inapproprié`"
            )
            return
        
        # Extraire l'utilisateur mentionné
        user_mention = parts[1]
        if not user_mention.startswith('<@') or not user_mention.endswith('>'):
            await message.channel.send("❌ Merci de mentionner un utilisateur valide (@username).")
            return
        
        # Extraire l'ID de l'utilisateur
        user_id = user_mention[2:-1]  # Enlever <@ et >
        if user_id.startswith('!'):
            user_id = user_id[1:]  # Enlever le ! si présent
        
        # Vérifier que l'utilisateur n'est pas déjà banni
        if is_user_banned(user_id):
            await message.channel.send(f"❌ Cet utilisateur est déjà banni.")
            return
        
        # Parser la durée
        duration_str = parts[2].lower()
        if duration_str == 'perm':
            duration_seconds = None
            expires_at = None
        else:
            duration_seconds = parse_duration(duration_str)
            if duration_seconds is None:
                await message.channel.send("❌ Durée invalide. Utilise `perm`, `30m`, `1h`, `1d`, ou `1w`.")
                return
            expires_at = time.time() + duration_seconds
        
        # Extraire la raison
        reason = ' '.join(parts[3:]) if len(parts) > 3 else 'Aucune raison fournie'
        
        # Créer le ban
        banned_users[user_id] = {
            'reason': reason,
            'duration': duration_seconds,
            'expires_at': expires_at,
            'banned_by': message.author.name
        }
        
        # Construire le message de confirmation
        if duration_seconds is None:
            duration_text = "**permanent**"
        else:
            duration_text = f"**{duration_str}**"
        
        await message.channel.send(
            f"✅ **Utilisateur banni**\n\n"
            f"👤 **Utilisateur:** {user_mention}\n"
            f"⏱️ **Durée:** {duration_text}\n"
            f"📝 **Raison:** {reason}\n"
            f"👮 **Banni par:** {message.author.mention}"
        )
        
        print(f'[BAN] {message.author.name} a banni {user_mention} ({duration_text}) - Raison: {reason}')
        
    except Exception as e:
        print(f'[ERREUR] Ban: {e}')
        await message.channel.send("❌ Une erreur est survenue lors du bannissement.")


async def handle_mute(message):
    """Commande !mute pour muter un utilisateur"""
    try:
        # Vérifier permissions admin
        has_permission = await check_admin_permission(message.author.id)
        
        if not has_permission:
            print(f'[MUTE] {message.author.name} sans permissions')
            await message.channel.send(
                f"❌ {message.author.mention} Tu n'as pas la permission d'utiliser cette commande.\n"
                f"Seuls les administrateurs peuvent muter des utilisateurs."
            )
            return
        
        # Parser la commande
        parts = message.content.split()
        
        if len(parts) < 3:
            await message.channel.send(
                "📋 **Usage:** `!mute <@utilisateur> <durée> <raison>`\n"
                "**Durées:** `perm` (permanent), `30m`, `1h`, `1d`, `1w`\n"
                "**Exemples:**\n"
                "`!mute @utilisateur perm Spam répétitif`\n"
                "`!mute @utilisateur 1h Trop de messages`"
            )
            return
        
        # Extraire l'utilisateur mentionné
        user_mention = parts[1]
        if not user_mention.startswith('<@') or not user_mention.endswith('>'):
            await message.channel.send("❌ Merci de mentionner un utilisateur valide (@username).")
            return
        
        # Extraire l'ID de l'utilisateur
        user_id = user_mention[2:-1]  # Enlever <@ et >
        if user_id.startswith('!'):
            user_id = user_id[1:]  # Enlever le ! si présent
        
        # Vérifier que l'utilisateur n'est pas déjà muté
        if is_user_muted(user_id):
            await message.channel.send(f"❌ Cet utilisateur est déjà muté.")
            return
        
        # Parser la durée
        duration_str = parts[2].lower()
        if duration_str == 'perm':
            duration_seconds = None
            expires_at = None
        else:
            duration_seconds = parse_duration(duration_str)
            if duration_seconds is None:
                await message.channel.send("❌ Durée invalide. Utilise `perm`, `30m`, `1h`, `1d`, ou `1w`.")
                return
            expires_at = time.time() + duration_seconds
        
        # Extraire la raison
        reason = ' '.join(parts[3:]) if len(parts) > 3 else 'Aucune raison fournie'
        
        # Créer le mute
        muted_users[user_id] = {
            'reason': reason,
            'duration': duration_seconds,
            'expires_at': expires_at,
            'muted_by': message.author.name
        }
        
        # Nettoyer les messages de l'utilisateur dans le canal
        deleted_count = await cleanup_user_messages(message.channel, user_id, 50)
        
        # Construire le message de confirmation
        if duration_seconds is None:
            duration_text = "**permanent**"
        else:
            duration_text = f"**{duration_str}**"
        
        cleanup_text = f"🗑️ **Messages supprimés:** {deleted_count}\n" if deleted_count > 0 else ""
        
        await message.channel.send(
            f"🔇 **Utilisateur muté**\n\n"
            f"👤 **Utilisateur:** {user_mention}\n"
            f"⏱️ **Durée:** {duration_text}\n"
            f"📝 **Raison:** {reason}\n"
            f"{cleanup_text}"
            f"👮 **Muté par:** {message.author.mention}"
        )
        
        print(f'[MUTE] {message.author.name} a muté {user_mention} ({duration_text}) - Raison: {reason}')
        
    except Exception as e:
        print(f'[ERREUR] Mute: {e}')
        await message.channel.send("❌ Une erreur est survenue lors du muting.")


async def handle_unban(message):
    """Commande !unban pour débannir un utilisateur"""
    try:
        # Vérifier permissions admin
        has_permission = await check_admin_permission(message.author.id)
        
        if not has_permission:
            print(f'[UNBAN] {message.author.name} sans permissions')
            await message.channel.send(
                f"❌ {message.author.mention} Tu n'as pas la permission d'utiliser cette commande.\n"
                f"Seuls les administrateurs peuvent débannir des utilisateurs."
            )
            return
        
        # Parser la commande
        parts = message.content.split()
        
        if len(parts) < 2:
            await message.channel.send(
                "📋 **Usage:** `!unban <@utilisateur>`\n"
                "**Exemple:** `!unban @utilisateur`"
            )
            return
        
        # Extraire l'utilisateur mentionné
        user_mention = parts[1]
        if not user_mention.startswith('<@') or not user_mention.endswith('>'):
            await message.channel.send("❌ Merci de mentionner un utilisateur valide (@username).")
            return
        
        # Extraire l'ID de l'utilisateur
        user_id = user_mention[2:-1]  # Enlever <@ et >
        if user_id.startswith('!'):
            user_id = user_id[1:]  # Enlever le ! si présent
        
        # Vérifier que l'utilisateur est banni
        if user_id not in banned_users:
            await message.channel.send(f"❌ Cet utilisateur n'est pas banni.")
            return
        
        # Retirer le ban
        ban_info = banned_users[user_id]
        del banned_users[user_id]
        
        await message.channel.send(
            f"✅ **Utilisateur débanni**\n\n"
            f"👤 **Utilisateur:** {user_mention}\n"
            f"📝 **Raison du ban:** {ban_info['reason']}\n"
            f"👮 **Débanni par:** {message.author.mention}"
        )
        
        print(f'[UNBAN] {message.author.name} a débanni {user_mention}')
        
    except Exception as e:
        print(f'[ERREUR] Unban: {e}')
        await message.channel.send("❌ Une erreur est survenue lors du débannissement.")


async def handle_warn(message):
    """Commande !warn pour avertir un utilisateur"""
    try:
        # Vérifier permissions admin
        has_permission = await check_admin_permission(message.author.id)
        
        if not has_permission:
            print(f'[WARN] {message.author.name} sans permissions')
            await message.channel.send(
                f"❌ {message.author.mention} Tu n'as pas la permission d'utiliser cette commande.\n"
                f"Seuls les administrateurs peuvent avertir des utilisateurs."
            )
            return
        
        # Parser la commande
        parts = message.content.split()
        
        if len(parts) < 3:
            await message.channel.send(
                "📋 **Usage:** `!warn <@utilisateur> <raison>`\n"
                "**Exemple:** `!warn @utilisateur Spam répétitif`"
            )
            return
        
        # Extraire l'utilisateur mentionné
        user_mention = parts[1]
        if not user_mention.startswith('<@') or not user_mention.endswith('>'):
            await message.channel.send("❌ Merci de mentionner un utilisateur valide (@username).")
            return
        
        # Extraire l'ID de l'utilisateur
        user_id = user_mention[2:-1]  # Enlever <@ et >
        if user_id.startswith('!'):
            user_id = user_id[1:]  # Enlever le ! si présent
        
        # Extraire la raison
        reason = ' '.join(parts[2:])
        
        # Ajouter l'avertissement
        warning_count = add_warning(user_id, reason, message.author.name)
        
        await message.channel.send(
            f"⚠️ **Utilisateur averti**\n\n"
            f"👤 **Utilisateur:** {user_mention}\n"
            f"📝 **Raison:** {reason}\n"
            f"📊 **Nombre total d'avertissements:** {warning_count}\n"
            f"👮 **Averti par:** {message.author.mention}"
        )
        
        print(f'[WARN] {message.author.name} a averti {user_mention} - Raison: {reason} (Total: {warning_count})')
        
    except Exception as e:
        print(f'[ERREUR] Warn: {e}')
        await message.channel.send("❌ Une erreur est survenue lors de l'avertissement.")


async def handle_warnings(message):
    """Commande !warnings pour voir les avertissements d'un utilisateur"""
    try:
        # Vérifier permissions admin
        has_permission = await check_admin_permission(message.author.id)
        
        if not has_permission:
            print(f'[WARNINGS] {message.author.name} sans permissions')
            await message.channel.send(
                f"❌ {message.author.mention} Tu n'as pas la permission d'utiliser cette commande.\n"
                f"Seuls les administrateurs peuvent consulter les avertissements."
            )
            return
        
        # Parser la commande
        parts = message.content.split()
        
        if len(parts) < 2:
            await message.channel.send(
                "📋 **Usage:** `!warnings <@utilisateur>`\n"
                "**Exemple:** `!warnings @utilisateur`"
            )
            return
        
        # Extraire l'utilisateur mentionné
        user_mention = parts[1]
        if not user_mention.startswith('<@') or not user_mention.endswith('>'):
            await message.channel.send("❌ Merci de mentionner un utilisateur valide (@username).")
            return
        
        # Extraire l'ID de l'utilisateur
        user_id = user_mention[2:-1]  # Enlever <@ et >
        if user_id.startswith('!'):
            user_id = user_id[1:]  # Enlever le ! si présent
        
        # Récupérer les avertissements
        warnings = get_user_warnings(user_id)
        
        if not warnings:
            await message.channel.send(
                f"📋 **Avertissements de {user_mention}**\n\n"
                f"✅ Aucun avertissement pour cet utilisateur."
            )
            return
        
        # Construire le message avec tous les avertissements
        warnings_msg = f"📋 **Avertissements de {user_mention}**\n\n"
        warnings_msg += f"**Total:** {len(warnings)} avertissement(s)\n\n"
        
        for i, warning in enumerate(warnings, 1):
            # Convertir le timestamp en date lisible
            import datetime
            date = datetime.datetime.fromtimestamp(warning['timestamp']).strftime('%d/%m/%Y %H:%M')
            warnings_msg += f"**Avertissement #{i}**\n"
            warnings_msg += f"📅 **Date:** {date}\n"
            warnings_msg += f"📝 **Raison:** {warning['reason']}\n"
            warnings_msg += f"👮 **Par:** {warning['warned_by']}\n\n"
        
        await message.channel.send(warnings_msg)
        
        print(f'[WARNINGS] {message.author.name} a consulté les avertissements de {user_mention} ({len(warnings)} warnings)')
        
    except Exception as e:
        print(f'[ERREUR] Warnings: {e}')
        await message.channel.send("❌ Une erreur est survenue lors de la consultation des avertissements.")


# ============================================================================
# MAIN
# ============================================================================

def validate_config():
    """Valide la configuration avant de démarrer"""
    errors = []
    
    if not BOT_TOKEN:
        errors.append('BOT_TOKEN non défini')
    if not SERVER_ID:
        errors.append('SERVER_ID non défini')
    if not NOTIFICATION_CHANNEL_ID:
        errors.append('NOTIFICATION_CHANNEL_ID non défini')
    if not SUBMISSION_CHANNEL_ID:
        errors.append('SUBMISSION_CHANNEL_ID non défini')
    
    if errors:
        print('[ERREUR] Configuration invalide:')
        for error in errors:
            print(f'  - {error}')
        return False
    
    return True


def main():
    """Point d'entrée principal"""
    print()
    print('╔' + '═' * 58 + '╗')
    print('║' + ' ' * 58 + '║')
    print('║' + '  BOT QUOKKA - STOAT.CHAT'.center(58) + '║')
    print('║' + '  Version Unifiée 3.0'.center(58) + '║')
    print('║' + ' ' * 58 + '║')
    print('╚' + '═' * 58 + '╝')
    print()
    
    # Validation
    if not validate_config():
        print()
        print('[ERREUR] Vérifie ton fichier .env')
        input('Appuie sur Entrée pour quitter...')
        return
    
    print('[INFO] Configuration validée')
    print('[INFO] Démarrage du bot...')
    print()
    
    try:
        client.run(BOT_TOKEN)
    except KeyboardInterrupt:
        print()
        print('=' * 60)
        print('[STOP] Bot arrêté par l\'utilisateur')
        print('=' * 60)
    except Exception as e:
        print()
        print('=' * 60)
        print(f'[ERREUR] Erreur fatale: {e}')
        print('=' * 60)
        print()
        print('[AIDE] Consulte docs/TROUBLESHOOTING_INVALIDSESSION.md')
        print('       si l\'erreur est "InvalidSession"')


if __name__ == '__main__':
    main()
