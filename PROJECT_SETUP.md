# Quokka - Setup rapide

## 1) Base de donnees (Neon)

Project ID: `billowing-truth-15759738`

Executer dans l'ordre:

1. `sql/001_init.sql`
2. `sql/002_seed_categories.sql`

## 2) Backend

```bash
cd backend
npm install
npm run dev
```

API disponible sur `http://localhost:4000`.

## 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Application disponible sur `http://localhost:5173`.

## 4) Variables d'environnement

- Copier `backend/.env.example` vers `backend/.env` puis renseigner la vraie `DATABASE_URL`.
- Copier `frontend/.env.example` vers `frontend/.env` si besoin.
