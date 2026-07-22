# Datenbank

Supabase-Schema (Migrations) und Startdaten (Seed) fuer die Reiseapp. Supabase selbst laeuft extern; hier wird nur Struktur + Daten versioniert.

## Inhalt

| Pfad | Zweck |
|------|-------|
| `schema.md` | Datenmodell-Uebersicht (finale `destinations`-Tabelle + geplante weitere Tabellen). |
| `scoring_rules.md` | **Verbindliche Bewertungsdefinition** — was jeder Score von 0–100 bedeutet. |
| `migrations/001_create_destinations.sql` | Legt die Tabelle `destinations` an (Constraints, Indizes, RLS). |
| `seed/destinations.json` | 300 kuratierte Reiseziele (Objekt mit `_meta` + `destinations[]`). |
| `seed/seed_destinations.js` | Importiert `destinations.json` per Upsert nach Supabase. |
| `seed/validate.js` | Konsistenzpruefung der `destinations.json` (lokal, kein DB-Zugriff). |

## Die Reiseziel-Datenbank

300 aussergewoehnliche Reiseziele als **intelligente Vorauswahl fuer die Claude-API** (nicht direkt durchsuchbar). Das Backend filtert nach harten Kriterien (Jahreszeit, Budget, Dauer) und schickt nur die Kandidaten an Claude — siehe Datenfluss in der Projekt-`CLAUDE.md`. Auswahlfokus: Erlebnisqualitaet, Einzigartigkeit, Fotografie, Natur & Abenteuer, Authentizitaet, Preis-Leistung — mit hohem Anteil an **Hidden Gems** (spezifische Orte statt ganzer Laender).

### 31 Felder pro Ort
- **Identitaet:** `id` (slug), `name`, `country`, `region`, `continent` (`Europa`/`Asien`/`Nordamerika`/`Suedamerika`/`Afrika`/`Ozeanien`/`Sonderregion`)
- **Klassifizierung:** `categories[]` aus `Natur, Berge, Wandern, Insel, Strand, Stadt, Skyline, Kultur, Abenteuer, Roadtrip, Backpacking, Wildlife, Winter, Wueste`
- **Texte (DE):** `description`, `highlights[]` (Unsicherheiten sind in der `description` gekennzeichnet)
- **Erlebnis-Scores 0–100:** `nature_score`, `photography_score`, `adventure_score`, `hiking_score`, `city_score`, `culture_score`, `beach_score`, `wildlife_score`, `nightlife_score`, `luxury_score`
- **Leit-Score:** `wow_factor_score` (haut mich um)
- **Richtungs-Scores (Richtung beachten!):** `budget_score` (hoch = guenstig), `tourist_density_score` (hoch = ueberlaufen), `trip_effort_score` (hoch = aufwendig)
- **Rahmen-Scores:** `flight_access_score` (hoch = leicht erreichbar), `safety_score` (hoch = sicher), `season_flexibility_score` (hoch = ganzjaehrig)
- **Reiseinfos:** `best_months[]` (1–12), `minimum_days`, `ideal_days` (≥ minimum), `estimated_budget_level` (`niedrig`/`mittel`/`gehoben`/`hoch`), `car_needed`, `solo_friendly`

Score-Definitionen: `scoring_rules.md`.

## Setup (Schritt fuer Schritt)

```bash
# 1. Tabelle anlegen: Inhalt von migrations/001_create_destinations.sql
#    im Supabase SQL-Editor ausfuehren.

# 2. In .env (Projekt-Root) setzen:
#      SUPABASE_URL=https://<projekt>.supabase.co
#      SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# 3. Seed einspielen (aus dem Projekt-Root):
node database/seed/seed_destinations.js
```

Der Seed ist **idempotent** (Upsert auf `id`) — beliebig oft wiederholbar.

## Erweitern & Pflegen

1. **Neuen Ort:** In `seed/destinations.json` ein Objekt mit allen 31 Feldern ergaenzen. Scores strikt nach `scoring_rules.md`.
2. **Pruefen:** `node database/seed/validate.js` (Score-Ranges, Budget-Mapping, `ideal_days ≥ minimum_days`, eindeutige IDs, gueltige Kategorien/Kontinente, Kategorie↔Score-Koheraenz, wow-Verteilung).
3. **Re-Seed:** `node database/seed/seed_destinations.js`.

### Konsistenzregeln (Kurzfassung)
- Kategorien spiegeln die Top-Scores (z. B. `Strand` nur bei `beach_score >= 60`).
- Keine „Alles-gut"-Orte (fuenf oder mehr Scores ≥ 85 ist verdaechtig).
- `budget_score` passt zum `estimated_budget_level` (niedrig 75–100 / mittel 55–74 / gehoben 35–54 / hoch 0–34) — auch per SQL-Constraint erzwungen.
- `wow_factor_score ≥ 90` nur fuer eine Minderheit.
- Unsicherheiten (`best_months`, `safety_score`, `flight_access_score`) in der `description` kennzeichnen.

## Verteilung

Europa 80 · Asien 70 · Nordamerika 40 · Suedamerika 35 · Afrika 35 · Ozeanien 25 · Sonderregion 15 = **300**.
