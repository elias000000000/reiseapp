# Deployment (Vercel — ein Projekt für Frontend + Backend)

Frontend (Vite-SPA) und Backend (Express) laufen als **ein** Vercel-Projekt auf
**derselben Domain**. Das Backend ist eine Serverless Function unter `/api`,
das Frontend ruft sie same-origin auf (`/api/...`) — kein CORS, keine
hartkodierte Backend-URL.

## Wie es zusammenhängt

- `vercel.json` — `buildCommand: npm run vercel-build`, `outputDirectory: frontend/dist`,
  Rewrites: `/api/*` → Serverless Function, alles andere → `index.html` (SPA-Routing).
- Root-`package.json` — `vercel-build` kompiliert das Backend (`tsc -p backend/tsconfig.json`
  → `backend/dist`) und baut danach das Frontend. Enthält die Backend-Runtime-Deps,
  damit die Function sie zur Laufzeit auflösen kann.
- `api/index.js` — die Serverless Function. Entfernt das `/api`-Präfix und reicht
  den Request an die Express-App (`backend/dist/app.js`) weiter.
- `frontend/src/lib/api.ts` — im Produktions-Build ist die API-Basis `/api`
  (same-origin). Lokal weiterhin `http://<host>:3001`.

## Vercel-Projekteinstellungen

1. **Root Directory:** Repo-Wurzel (NICHT `frontend`). `vercel.json` steuert den Rest.
2. **Framework Preset:** *Other* (Build-Command/Output kommen aus `vercel.json`).
3. Build-Command / Output-Directory NICHT manuell überschreiben — `vercel.json` gilt.

## Environment Variables (Settings → Environment Variables)

Ohne diese Variablen: Frontend zeigt eine Konfig-Fehlerseite (kein Whitescreen mehr),
API antwortet mit 500. **Alle für "Production" (und ruhig auch Preview) setzen, dann neu deployen.**

| Variable | Zweck | Sichtbarkeit |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase-Projekt-URL — **Frontend-Build** (Präfix `VITE_` zwingend!) | im Client sichtbar (ok) |
| `VITE_SUPABASE_ANON_KEY` | Supabase **Anon**-Key — Frontend-Build | im Client sichtbar (ok) |
| `SUPABASE_URL` | Supabase-URL — Backend-Function | geheim |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **Service-Role**-Key — Backend | **geheim, nie ins Frontend** |
| `ANTHROPIC_API_KEY` | Claude-API — Backend | geheim |
| `PEXELS_API_KEY` | nur für die Seed-Skripte (Bilder), zur Laufzeit optional | geheim |

> `PORT` wird auf Vercel NICHT gebraucht (Serverless, kein eigener Port).
> Anonyme Anmeldung muss im Supabase-Dashboard aktiviert sein
> (Authentication → Providers → Anonymous sign-ins).

## Nach dem Deploy prüfen

- `https://<domain>/api/health` → `{"status":"ok"}` (Backend erreichbar).
- Startseite lädt (kein Whitescreen). Onboarding → Empfehlungen kommen durch.
- Fehlt eine `VITE_`-Variable, zeigt die App eine klare Meldung statt einer weißen Seite.

## Lokale Entwicklung (unverändert)

```bash
# Terminal 1 – Backend (Port 3001)
cd backend && npm install && npm run dev
# Terminal 2 – Frontend (Port 5173)
cd frontend && npm install && npm run dev
```
