# Reiseapp

Private, minimalistische Reiseplanung. Läuft komplett ohne API-Keys — Keys kommen erst rein, wenn du dich entschieden hast, dass es dir gefällt.

## Was funktioniert ohne Keys

- Reisen anlegen, bearbeiten, löschen (Daten in `localStorage`)
- Karte (MapLibre + OpenStreetMap-Raster)
- Tagesplanung mit Drag-&-Drop
- AI-Reiseziel-Finder (handgemachte Mock-Antworten, 6 echte europäische Ziele)
- "Reise daraus erstellen" inkl. fertiger Start-Pins
- Reise-Präsentation mit Print-zu-PDF
- Deep-Links zu Booking, Airbnb, Google Flights, Google Maps

## Setup

```bash
npm install
npm run dev
```

Dann http://localhost:3000 öffnen.

## Wenn dir die App gefällt — Keys hinzufügen

```bash
cp .env.local.example .env.local
```

Dann optional eintragen:

- `ANTHROPIC_API_KEY` — echte Claude-Vorschläge statt Mock. https://console.anthropic.com/
- `NEXT_PUBLIC_MAPBOX_TOKEN` — hübschere Karten-Styles. https://account.mapbox.com/

Nach Neustart von `npm run dev` swappt der Mock automatisch auf die echten Services. **Kein Code-Change nötig.**

## Struktur

```
app/
  page.tsx                      Dashboard
  discover/page.tsx             AI-Reiseziel-Finder
  trips/[id]/page.tsx           Übersicht + Karte
  trips/[id]/plan/page.tsx      Tagesplan
  trips/[id]/present/page.tsx   Reise-Magazin (druckbar)
  api/ai/suggest/route.ts       Mock + Claude-Pfad
components/
  map/         MapLibre-Karte mit Pins
  trip/        Trip-Card, Header, PlaceList, DayTimeline
  ui/          Button, Input, Hydrate
lib/
  types.ts     Domain-Typen
  ai-mock.ts   Handgemachte Reiseziel-Vorschläge
  wikipedia.ts Wikipedia REST (keyless)
  weather.ts   Open-Meteo (keyless)
  deep-links.ts URL-Builder für externe Dienste
  seed-places.ts Start-Pins pro Ziel
stores/
  trips-store.ts Zustand-Store mit localStorage-Persistenz
```

Aktuell ~25 Dateien. Wenn es über 60 wächst, läuft etwas falsch.

## Was später noch sinnvoll wäre

- **Supabase** statt localStorage, sobald du auf zwei Geräten planst.
- **AI-Tag-optimieren** Button (Claude reordert die Pins eines Tages nach Geo + Öffnungszeiten).
- **Wikipedia/Unsplash-Enrichment** beim Hinzufügen von Pins (URL ist da, Hook fehlt).
- **PWA-Service-Worker** für Offline-Caching aktiver Reisen.

## Tech

Next.js 15 · React 19 · TypeScript · Tailwind · Zustand · MapLibre · Framer Motion · Anthropic SDK (optional)
