# Datenbank Schema

Supabase (PostgreSQL). Alle drei Tabellen sind **final und implementiert**: `destinations` (Migration `001_create_destinations.sql`, Startdaten `seed/destinations.json`) sowie `trip_requests` + `recommendations` (Migration `002_create_qa_tables.sql`, siehe unten).

## destinations — FINAL

Kuratierte Reiseziel-Datenbank (300 Orte), Wissensbasis fuer die Vorauswahl. Rolle im Datenfluss: Das Backend filtert `destinations` nach harten Kriterien und schickt nur die Kandidaten an die Claude API (siehe `CLAUDE.md`).

**31 Spalten pro Ort:**

| Gruppe | Spalten |
|--------|---------|
| Identitaet | `id` (PK, slug, z. B. `madeira_pt`), `name`, `country`, `region`, `continent` |
| Klassifizierung | `categories[]` (14 erlaubte Werte, DE) |
| Texte (DE) | `description`, `highlights[]` |
| Erlebnis-Scores 0–100 | `nature_score`, `photography_score`, `adventure_score`, `hiking_score`, `city_score`, `culture_score`, `beach_score`, `wildlife_score`, `nightlife_score`, `luxury_score` |
| Leit-Score 0–100 | `wow_factor_score` (haut mich um) |
| Richtungs-Scores 0–100 | `budget_score` (hoch=guenstig), `tourist_density_score` (hoch=voll), `trip_effort_score` (hoch=aufwendig) |
| Rahmen-Scores 0–100 | `flight_access_score`, `safety_score`, `season_flexibility_score` |
| Reiseinfos | `best_months[]` (1–12), `minimum_days`, `ideal_days`, `estimated_budget_level` (`niedrig`/`mittel`/`gehoben`/`hoch`), `car_needed`, `solo_friendly` |
| Meta | `created_at`, `updated_at` |

**Invarianten (SQL-Constraints):** alle `*_score` in [0,100]; `ideal_days >= minimum_days > 0`; `budget_score` passt zum `estimated_budget_level` (niedrig 75–100 / mittel 55–74 / gehoben 35–54 / hoch 0–34); `continent` in {Europa, Asien, Nordamerika, Suedamerika, Afrika, Ozeanien, Sonderregion}; `id` eindeutig.

**Indizes:** `wow_factor_score`, `continent`, `budget_score`, `safety_score`, `minimum_days`, `trip_effort_score` + GIN auf `categories[]` und `best_months[]`.

**RLS:** oeffentliches Lesen erlaubt; Schreiben nur ueber Service-Role-Key (Seed).

> **Klarstellung zur Public-Read-Policy:** Sie ist beabsichtigt — Reisezieldaten sind nicht sensibel, und die Policy haelt die Tuer fuer moegliche spaetere oeffentliche Seiten offen. Das Frontend liest `destinations` aber **trotzdem nie direkt** ueber den Supabase-Client, sondern ausschliesslich ueber `GET /destinations?ids=...` im Backend (siehe `docs/api-contract.md`) — Konsistenz mit der Backend-only-Konvention aus `CLAUDE.md` hat Vorrang vor der theoretischen Moeglichkeit eines Direktzugriffs.

Score-Definitionen: siehe [`scoring_rules.md`](./scoring_rules.md).

> Hinweis: Diese finale `destinations`-Struktur ersetzt bewusst den frueheren groben Entwurf (name/country/region/best_seasons/budget_level/tags/notes). Die alten `tags` entsprechen jetzt `categories[]` + den Scores, `best_seasons` -> `best_months[]`, `budget_level` -> `estimated_budget_level` (+ `budget_score`).

---

## trip_requests + recommendations — FINAL

Implementiert in `migrations/002_create_qa_tables.sql`. Ersetzt den fruaeheren groben Entwurf (der eine separate `profiles`-Tabelle vorsah) durch eine schlankere Loesung: es gibt noch keine Authentifizierung, daher **keine** `profiles`-Tabelle in v1. Ein client-seitig generierter `user_key` (UUID, siehe `docs/api-contract.md`) identifiziert denselben Nutzer ueber mehrere Anfragen hinweg.

### trip_requests
Eine Anfrage = alle 11 Antworten des Q&A-Katalogs (Phase 1 harte Filter + Phase 2 Geschmacks-Achsen).
- `id`, `user_key`, `duration_days`, `travel_months[]`, `budget_level`, `party_type`, `comfort_zone`, `car_preference`, `axis_nature_city`, `axis_activity_relax`, `axis_iconic_hidden`, `axis_luxury_authentic`, `axis_photogenic_importance` (nullable), `exploration_level`, `created_at`
- Index auf `(user_key, created_at)` fuer den Verlaufs-Ausschluss

### recommendations
Was Claude fuer eine `trip_request` tatsaechlich vorgeschlagen hat — Grundlage des Verlaufs-Ausschlusses (siehe `docs/api-contract.md`, Abschnitt "Wiederholungs-Ausschluss").
- `id`, `trip_request_id` (FK -> trip_requests), `destination_id` (FK -> destinations), `rank`, `reasoning`, `created_at`

**RLS:** aktiviert, **keine** Public-Policy (im Gegensatz zu `destinations`) — beide Tabellen enthalten nutzerbezogene Daten, Zugriff ausschliesslich ueber den Service-Role-Key im Backend.

---

## Migrations & Seed

- `migrations/001_create_destinations.sql` — Tabelle `destinations`.
- `migrations/002_create_qa_tables.sql` — Tabellen `trip_requests` + `recommendations`.
- `seed/destinations.json` -> per `seed/seed_destinations.js` (Upsert) einspielen.
- Setup-Anleitung: [`README.md`](./README.md). API-Vertrag fuer Backend-Routen: [`../docs/api-contract.md`](../docs/api-contract.md).
