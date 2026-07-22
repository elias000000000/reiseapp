# Reiseapp

Persoenliche KI Reiseapp fuer Elias. Kein klassisches Reiseportal, sondern ein persoenlicher KI Reiseberater der aussergewoehnliche Reiseziele vorschlaegt, die zur aktuellen Situation passen (Interessen, Reisedauer, Jahreszeit, Budget, Stimmung).

Erste Version ist nur fuer den privaten Gebrauch, aber technisch so aufgebaut, dass spaeter eine Web App oder iPhone App problemlos moeglich ist.

## Architektur

Vier getrennte Bereiche, damit Backend, Datenbank, KI Logik und Frontend unabhaengig voneinander austauschbar bleiben:

- `backend/` — Node.js + TypeScript API Server. Nimmt Anfragen vom Frontend entgegen, spricht mit Supabase und mit der Claude API. Enthaelt die gesamte Business Logik.
- `database/` — Supabase Schema, Migrations, Seed Daten. Supabase selbst laeuft extern (Cloud), hier wird nur die Struktur versioniert.
- `backend/src/ai/` — Claude API Anbindung, Prompt Templates, Empfehlungslogik. Bewusst kein eigener Top Level Ordner, weil die KI Logik nicht als eigener Dienst laeuft, sondern im selben Prozess wie das Backend.
- `frontend/` — Web Oberflaeche (React + TypeScript geplant). Enthaelt keine Business Logik, nur Darstellung. Dadurch spaeter einfach durch eine Mobile App ersetzbar oder ergaenzbar.

## Datenfluss

1. Frontend stellt Q&A Fragen zum Reiseprofil
2. Backend speichert Profil in Supabase
3. Backend filtert die Reiseziel Datenbank nach harten Kriterien (Jahreszeit, Budget, Dauer) — guenstig und schnell, kein API Call noetig
4. Backend schickt nur die gefilterten Kandidaten an die Claude API
5. Claude liefert finale Auswahl und Begruendung
6. Backend gibt Ergebnis ans Frontend zurueck

Wichtig: Claude wird nur fuer die finale Bewertung genutzt, nicht fuer die Vorfilterung. Das haelt die API Kosten niedrig.

## Tech Stack

- Backend: Node.js, TypeScript, Express
- Datenbank: Supabase (Postgres + Auth)
- KI: Claude API (@anthropic-ai/sdk)
- Frontend: React 19 + TypeScript, Vite, Tailwind v4, Framer Motion, PWA (`vite-plugin-pwa`)
- Validierung: zod

## Aktueller Stand (2026-07-22)

**Backend fertig, end-to-end getestet:**
- Reiseziel-Datenbank: 300 kuratierte Orte in Supabase (31+ Felder/Ort), Bewertungslogik in `database/scoring_rules.md` (14 Score-Felder inkl. Leit-Score `wow_factor_score`). Migration `001`.
- Q&A: 13 Fragen (Startort per Geocoding + 6 harte Filter + 4 Geschmacks-Achsen + 2 optionale Feintuning-Fragen). Persistenz in `trip_requests`/`recommendations` (Migration `002`).
- Empfehlungs-Pipeline: Phase-1-SQL-Filter (`destinationFilter.service.ts`, inkl. Haversine-Distanzfilter Startort↔Ziel) → Phase-2-Scoring/Sampling/MMR (`scoring.service.ts`) → Claude-Tool-Use (`recommend.service.ts`) → Persistenz. Routen: `POST /recommendations` (Auth-pflichtig), `GET /destinations?ids=...`, `GET /geocode?q=...` (beide oeffentlich).
- **Auth: anonyme Supabase-Session** (`supabase.auth.signInAnonymously()`), kein Login-Screen, keine E-Mail — echte, nicht faelschbare `auth.uid()` statt frueherem `user_key`. Migration `004` (`trip_requests.user_id`), Middleware `backend/src/middleware/auth.ts`.
- Bilder-Pipeline (Pexels) + Geo-Pipeline (Nominatim, Migration `005`): `database/seed/fetch_images.js`, `database/seed/fetch_coordinates.js` — beide idempotent/resumierbar. Stand zuletzt: 282/300 Orte mit Koordinaten (Rest bei Bedarf per erneutem Lauf nachladbar).
- Wire-Contract: [`docs/api-contract.md`](./docs/api-contract.md).
- Bekannte, bewusst nicht behobene Einschraenkung: `party_type` ausser `solo` hat keine harte Filterwirkung (nur Kontext fuer Claude).

**Frontend fertig (Kernpfad), im Browser getestet:**
- Design-Grundlage: [`docs/design/design-system.md`](./docs/design/design-system.md) (Tokens, Prinzipien), [`docs/design/screens.md`](./docs/design/screens.md) (alle Screens S0–S18 mit API-Bezug — verbindliche Quelle fuer UI-Details).
- Kompletter Flow lauffaehig: Welcome → 13 Onboarding-Fragen (inkl. neuem Startort-Schritt mit Zuerich/Basel/Genf + Freitext-Geocoding) → Loading (auf echte Claude-Latenz choreografiert) → Empfehlungen (mit Match-Badges, Bildern) → Detail. Edge Cases (`NO_CANDIDATES`, Netzwerkfehler) abgedeckt.
- PWA-faehig (`vite-plugin-pwa`, Icons generiert), Backend-URL leitet sich automatisch vom Hostnamen ab (funktioniert am Desktop wie am iPhone im selben WLAN ohne manuelle Konfiguration).

**Zuletzt laufender Test (noch nicht final verifiziert):** Distanzfilter-Verhalten nach Koordinaten-Befuellung (Startort Zuerich + kurze Reisedauer sollte weit entfernte Ziele ausschliessen) — sollte in einer neuen Session als Erstes wiederholt werden.

**Kein Git-Repo im Projekt** (Stand zuletzt geprueft) — falls gewuenscht, waere jetzt ein guter Zeitpunkt fuer `git init` + ersten Commit.

## Konventionen

- Sprache im Code: Englisch fuer Variablen/Funktionen, Kommentare auf Deutsch wo sinnvoll
- Keine Business Logik im Frontend
- Keine direkten Datenbankzugriffe vom Frontend, immer ueber das Backend
- Vor groesseren Aenderungen an Architektur: kurz planen und Trade-offs nennen, nicht direkt grossflaechig Code schreiben
- Bei technischen Risiken oder schlechten Ideen: offen ansprechen statt einfach umzusetzen

## Naechste Schritte

1. Distanzfilter-Test wiederholen (Startort Zuerich, kurze Reisedauer) und Ergebnis pruefen, jetzt wo Koordinaten befuellt sind
2. Verbleibende ~18 Orte ohne Koordinaten bei Bedarf nachladen: `node database/seed/fetch_coordinates.js` (idempotent)
3. Visuelle Feinpolitur im Browser (Spacing/Animationen "in echt" pruefen, siehe README-Hinweis zu Screenshot-Einschraenkungen der Browser-Pane)
4. Phase 2 (bewusst zurueckgestellt): Favoriten, Profil/Verlauf, Kartenansicht auf der Detailseite (Koordinaten sind jetzt vorhanden)
