# Reiseapp

Persoenliche KI Reiseapp. Details zu Architektur und Stand siehe `CLAUDE.md`.

## Struktur

- `backend/` — API Server (Node.js, TypeScript)
- `database/` — Supabase Schema und Migrations
- `frontend/` — Web Oberflaeche (folgt)
- `docs/` — zusaetzliche Dokumentation

## Backend starten (sobald Supabase und Claude Keys vorhanden sind)

```
cd backend
npm install
cp .env.example .env   # Keys eintragen
npm run dev
```
