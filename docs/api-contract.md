# API-Contract: Backend ↔ Frontend

Verbindliche Quelle der Wahrheit für das Wire-Format, solange es kein
geteiltes TypeScript-Types-Package zwischen `backend/` und `frontend/`
gibt. Zod-Schemas in `backend/src/types/qa.types.ts` sind die
Implementierung dieses Vertrags — bei Widerspruch gewinnt der Code, aber
diese Datei sollte dann sofort nachgezogen werden.

## Authentifizierung — anonyme Supabase-Session

Echte Auth statt der früheren, clientseitig frei erfundenen `user_key`-UUID
— aber bewusst **ohne** E-Mail/Passwort-Schritt: Für eine private
Single-User-App reicht eine echte, nicht fälschbare Nutzer-ID völlig aus,
ein E-Mail-Roundtrip bringt nur Reibung (Magic-Link-Browser-Probleme,
Rate-Limits) ohne Mehrwert.

Ablauf: Frontend ruft beim ersten Start automatisch
`supabase.auth.signInAnonymously()` auf (`state/AuthContext.tsx`), falls
noch keine Session existiert. Das liefert eine echte, in `auth.users`
verankerte Nutzer-ID — kein Login-Screen, keine Nutzerinteraktion nötig.
Das Access-Token wird bei **jeder** Anfrage an geschützte Routen als

```
Authorization: Bearer <access_token>
```

mitgeschickt. Das Backend verifiziert das Token serverseitig
(`middleware/auth.ts`, `supabase.auth.getUser(token)`) und leitet daraus
die echte, geprüfte Nutzer-ID ab — sie kommt **nie** aus dem Request-Body.
`POST /recommendations` erfordert Auth (401 `UNAUTHORIZED` ohne gültiges
Token — in der Praxis nur bei manuell gelöschtem Speicher). `GET
/destinations` und `GET /geocode` bleiben öffentlich (unsensible Daten).

**Einschränkung:** Die Session ist an dieses eine Gerät/diesen Browser
gebunden (kein Cross-Device-Verlauf). Eine anonyme Session lässt sich
später bei Bedarf über `supabase.auth.updateUser()` mit einer echten
E-Mail verknüpfen, ohne den bisherigen Verlauf zu verlieren — aktuell
nicht implementiert, da kein Bedarf.

## `POST /recommendations`

### Request-Body

```jsonc
{
  // Phase 1 - harte Filter
  // Startort: die drei Standard-Staedte haben im Frontend fest hinterlegte
  // Koordinaten; "Andere Stadt" wird vorher ueber GET /geocode aufgeloest.
  "origin_lat": 47.3769,
  "origin_lng": 8.5417,
  "origin_label": "Zürich",           // Anzeige-Label, frei oder aus der Staedteliste
  "duration_days": 7,                 // integer > 0
  "travel_months": [6, 7],            // integer[] 1-12. WICHTIG: leeres Array [] = "ich bin flexibel".
                                       // NICHT null senden - Feld weglassen oder [] senden.
  "budget_level": "mittel",            // "niedrig" | "mittel" | "gehoben" | "hoch"
  "party_type": "solo",                 // "solo" | "paar" | "familie" | "freunde"
  "comfort_zone": "ausgewogen",         // "sicher" | "ausgewogen" | "abenteuer"
  "car_preference": "wenn_noetig",      // "ja" | "wenn_noetig" | "auf_keinen_fall"

  // Phase 2 - Geschmacks-Achsen, bipolar -100..100, 0 = neutral/keine Praeferenz
  // WICHTIG: NICHT 0-100! Negative Werte = Pol A, positive Werte = Pol B.
  "axis_nature_city": -60,              // -100 = Natur & Landschaft ... +100 = Stadt & Kultur
  "axis_activity_relax": -40,           // -100 = Aktiv & Abenteuer ... +100 = Ruhe & Geniessen
  "axis_iconic_hidden": 50,             // -100 = Ikonische Highlights ... +100 = Abseits des Trubels
  "axis_luxury_authentic": 30,          // -100 = Stilvoller Komfort ... +100 = Einfach & Authentisch

  // Feintuning, ueberspringbar
  "axis_photogenic_importance": 70,     // integer 0-100, ODER null/weglassen = uebersprungen
  "exploration_level": 40               // integer 0-100, Default 50 falls weggelassen (0=sicherste Treffer, 100=experimentierfreudig)
}
```

Kein Identitätsfeld im Body — die Nutzer-ID kommt ausschließlich aus dem
`Authorization`-Header (siehe oben).

**Zahlen als Strings sind tolerant:** Alle numerischen Felder nutzen
`z.coerce.number()` im Backend — ein versehentlich als String gesendeter
Wert (z. B. `"7"` statt `7`, typisch bei rohen HTML-Range-/Number-Inputs)
wird akzeptiert. Explizites `null` bei `axis_photogenic_importance` bleibt
`null` (kein Coercion-Bug: `Number(null)` würde `0` ergeben, das Backend
prüft `null` aber vor jeder Coercion ab).

### Erfolgs-Antwort (200)

```jsonc
{
  "trip_request_id": "uuid",
  "recommendations": [
    { "rank": 1, "destination_id": "durmitor_me", "name": "Durmitor & Tara-Canyon", "reasoning": "...", "match_score": 92 },
    // ... 5-10 Eintraege je nach Groesse der Shortlist (siehe unten)
  ]
}
```

`match_score` (integer, 75–98) ist ein reines **Anzeige-Signal** fürs
MatchBadge: der interne Gewichtungs-Score, min-max-normalisiert über den
Kandidatenpool. Optional — fehlt das Feld, blendet das Frontend das Badge
aus (niemals einen Platzhalter anzeigen).

Absichtlich **schlank**: nur `rank`/`destination_id`/`name`/`reasoning`
("was & warum"). Für Anzeige-Details (Bild, Beschreibung, Highlights,
Scores) ruft das Frontend danach einmal `GET /destinations?ids=...` mit
allen zurückgegebenen `destination_id`s auf (siehe unten).

**Anzahl der Empfehlungen:** normalerweise 5–10. Bei sehr eng kombinierten
Phase-1-Kriterien kann der Kandidatenpool kleiner sein — dann liefert die
Route entsprechend weniger (nie mehr, als tatsächlich zur Verfügung
stehen). Das Frontend sollte die Anzahl nicht hart auf "immer mindestens
5" annehmen.

### Fehler-Antworten

Alle Fehler haben die Form `{ "code": "...", "error": "menschenlesbare Meldung" }`.

| HTTP-Status | `code` | Bedeutung | Empfohlene Frontend-Reaktion |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | Body entspricht nicht dem Schema (zusätzlich `details` mit Zod-Issues) | Eingabe korrigieren, ggf. pro Feld anzeigen via `details[].path` |
| 401 | `UNAUTHORIZED` | Kein oder ungültiges/abgelaufenes Bearer-Token | Zu `/login` weiterleiten |
| 422 | `NO_CANDIDATES` | Phase-1-Kriterien (inkl. Distanz/Machbarkeit ab Startort) schliessen sich gegenseitig komplett aus (0 Treffer) | Gezielt "Kriterien lockern" anbieten (z. B. Dauer/Budget/Komfortzone), nicht als generischen Fehler behandeln |
| 500 | `INTERNAL_ERROR` | Unerwarteter Server-/Supabase-/Claude-Fehler | Generische "später nochmal versuchen"-Meldung; Detail steht nur im Server-Log |

## `GET /destinations?ids=id1,id2,id3`

Liefert volle Destination-Details für eine Menge von IDs. Zuständig für
die Anzeige, getrennt von der Entscheidungslogik in `/recommendations`.
Frontend darf **niemals** direkt gegen Supabase lesen, auch wenn die
`destinations`-Tabelle eine Public-Read-RLS-Policy hat — immer über diese
Route (siehe `database/schema.md`).

- `ids` ist **Pflicht**, kommagetrennt. Fehlt der Parameter → 400 `MISSING_IDS`.
- Antwort: `{ "destinations": [ { ...alle Felder... } ] }` — siehe
  `DestinationRowSchema` in `backend/src/types/qa.types.ts` für die exakte
  Feldliste (inkl. `description`, `highlights[]`, `categories[]`, alle
  14 Scores).
- Seit Migration 003 zusätzlich: `image_url` und `image_attribution`
  (beide `string | null`). Bei `null` zeigt das Frontend den kuratierten
  Kategorie-Fallback (siehe `design/design-system.md` §7), nie einen
  leeren Kasten. `image_attribution` muss bei Anzeige des Bildes als
  Fußnote erscheinen (Lizenz-Nachweis).
- Nicht gefundene IDs werden stillschweigend weggelassen (kein Fehler).
- Seit Migration 005 zusätzlich: `latitude`, `longitude` (beide `number | null`,
  Grundlage des Distanzfilters unten und später der Kartenansicht).

## `GET /geocode?q=<Stadt>`

Serverseitiger Proxy zu OpenStreetMap Nominatim, öffentlich, nur für den
"Andere Stadt"-Fall im Startort-Schritt. Die drei Standard-Städte
(Zürich/Basel/Genf) haben fest hinterlegte Koordinaten im Frontend und
brauchen keinen Call.

- `q` **Pflicht**. Fehlt/leer → 400 `MISSING_QUERY`. Kein Treffer → 404 `NOT_FOUND`.
- Antwort: `{ "lat": 47.3769, "lng": 8.5417, "label": "Zürich" }`

## Distanz-/Machbarkeits-Filter

Teil der Phase-1-Hartfilter (`destinationFilter.service.ts`): die
Great-Circle-Distanz zwischen Startort (`origin_lat`/`origin_lng`) und
Ziel wird gegen `duration_days` geprüft. Reine **Heuristik**, kein echter
Flugsuche-Abgleich:

| Distanz | Zusätzlich nötige Mindesttage |
|---|---|
| < 1500 km | 2 |
| 1500–6000 km | 5 |
| > 6000 km | 8 |

Gilt zusätzlich zu (nicht anstelle von) `destination.minimum_days` — das
Maximum beider Werte zählt. Orte ohne Koordinaten werden **nicht**
ausgeschlossen (kein Ausschluss ohne Datengrundlage).

## Wiederholungs-Ausschluss (kein separater Endpoint)

Bei jeder `POST /recommendations`-Anfrage schliesst das Backend
automatisch alle `destination_id`s aus, die demselben Nutzer (verifizierte
Nutzer-ID aus dem Bearer-Token) in früheren Anfragen bereits empfohlen
wurden (siehe `scoring.service.ts`). Das Frontend muss dafür nichts
Zusätzliches tun.

## Bekannte Einschränkung

`party_type` mit Wert `paar`/`familie`/`freunde` hat aktuell **keine**
harte Filterwirkung (nur `solo` filtert deterministisch auf
`solo_friendly`). Die Reiseform fliesst nur als Kontext-Text in den
Claude-Prompt ein. Ein echtes `family_friendly_score`-Feld über alle 300
Orte hinweg wäre eine separate, grössere Aufgabe und ist bewusst nicht
Teil dieses Contracts.
