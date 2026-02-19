# 🌐 Plateforme de promotion de serveurs de jeux et communautés

## 📌 Concept du projet

Créer un site internet responsive permettant l’ajout et la promotion de serveurs de jeux ainsi que de serveurs communautaires (Discord, Stoat, etc.).

Les utilisateurs pourront :
- Ajouter leurs serveurs
- Promouvoir leurs serveurs
- Rechercher des serveurs
- Mettre en avant leurs serveurs
- Gérer leurs serveurs depuis un tableau de bord

---

## 🗄️ Base de données

Les données seront stockées sur Neon.

Neon Project ID :
billowing-truth-15759738

---

## 🖥️ Stack technique

### Front-end
- React
- TypeScript
- HTML
- CSS

### Back-end
- Node.js
- TypeScript
- Express

---

## 🎨 Design global

### Background page d'accueil
Dégradé vertical :
- Haut : #2596be
- Bas : blanc

---

## 🧭 Header

Menu en haut du site :

À gauche :
- Logo du site
- Accueil
- Ajouter
- Publicités

À droite :
- Icône profil
  - Connexion
  - Inscription

---

## 🔎 Page d’accueil

Contenu :

- Barre de recherche de serveur par nom
- Liste des serveurs par catégories

Ordre d'affichage :

1. Serveurs Quokka+ (premium max)
2. Serveurs Quokka Essentiel
3. Serveurs les plus populaires
   - vues
   - likes
   - visites

---

## 👤 Système utilisateur

### Inscription

Champs :
- Pseudo
- Email
- Mot de passe
- Confirmation mot de passe

### Connexion
Email + mot de passe

---

## 🧑‍💻 Dashboard utilisateur

L'utilisateur peut :

- Voir ses serveurs ajoutés
- Mettre en avant ses serveurs
- Gérer ses abonnements
- Modifier son pseudo
- Modifier sa bio

---

## ➕ Ajout de serveur

### Étape 1 : Catégorie

Catégories avec image :

- Arma 3
- Bedrock
- Counter Strike
- Discord
- Stoat
- Garry's Mod
- Minecraft
- GTA V (FiveM)
- Hytale
- Rust
- Roblox

---

### Étape 2 : Infos serveur

Champs communs :
- Nom du serveur
- Site web
- Description
- Pays (menu déroulant de tous les pays)

---

### Si serveur de jeu (hors Discord/Stoat)
- IP serveur
- Port
- Public ou privé

---

### Si Discord

Champ non modifiable :
https://discord.gg/

Utilisateur ajoute :
ID invitation

---

### Si Stoat

Champ non modifiable :
https://stt.gg/

Utilisateur ajoute :
ID Stoat

---

## 🛠️ Panel admin (backend)

### Gestion utilisateurs
- Voir membres
- Voir profils
- Voir serveurs d’un utilisateur

### Gestion serveurs
- Liste par catégorie
- Voir détails
- Supprimer
- Modifier
- Avertir
- Mettre en avant
- Choisir emplacement premium
- Choisir durée
- Masquer serveur
- Rendre invisible

### Maintenance
- Activer maintenance site

---

## 💰 Système premium

Types :
- Quokka+
- Quokka Essentiel

Fonctions :
- Mise en avant en haut
- Emplacement premium
- Durée abonnement

---

## 📊 Statistiques serveur

Chaque serveur possède :
- vues
- likes
- visites
- clics

---

## 🗃️ STRUCTURE SQL (tout dans ce fichier)

### TABLE users
- id
- pseudo
- email
- password
- bio
- created_at

### TABLE servers
- id
- user_id
- name
- category
- description
- website
- ip
- port
- invite_link
- is_public
- created_at

### TABLE subscriptions
- id
- server_id
- type (quokka_plus, essentiel)
- start_date
- end_date

### TABLE stats
- id
- server_id
- views
- likes
- visits

---

## 🚀 Objectif final

Créer une plateforme complète permettant :
- Ajout de serveurs
- Promotion
- Premium
- Dashboard utilisateur
- Panel admin
- Recherche
- Responsive
- Évolutif

---

## 🤖 Instructions pour Cursor

Ce projet doit être généré automatiquement avec :

Frontend :
React + TypeScript

Backend :
Node.js + Express + TypeScript

Database :
PostgreSQL Neon

Le code doit être :
- propre
- scalable
- modulaire
- sécurisé
- prêt production
