# Screens — Kernpfad (Phase 1)

Verbindliche UX-Spezifikation für den ersten Implementierungs-Durchlauf. Jeder Screen: Zweck, Aufbau (oben → unten), Verhalten, Animation, API-Bezug. Design-Tokens: siehe `design-system.md`. Wire-Format: siehe `../api-contract.md`.

**Navigationsmodell:** React Router, echte History (Browser-Back = App-Back).
Routen: `/` (Welcome) → `/onboarding/:step` (1–13) → `/loading` → `/results` → `/destination/:id`.
Übergänge: vorwärts Slide-in rechts, zurück Slide-in links.
**Auth:** Unsichtbar — anonyme Supabase-Session, automatisch beim ersten Start erstellt (`state/AuthContext.tsx`, `supabase.auth.signInAnonymously()`). Kein Login-Screen, keine E-Mail, kein `user_key` mehr (echte, nicht fälschbare `auth.uid()`). App wartet kurz (normalerweise <100 ms, kein sichtbarer Ladezustand) auf die Session-Auflösung, bevor sie routet. Bleibt auf diesem Gerät/Browser gültig, solange der Speicher nicht gelöscht wird.
**State:** Antworten in Context + `sessionStorage` (Reload-sicher). Letztes Ergebnis (`trip_request_id`, Empfehlungen, Timestamp) in `localStorage` — App-Start mit vorhandenem Ergebnis springt direkt zu `/results` („Neue Suche" jederzeit möglich).

---

## S0 — Splash & Welcome

**Splash:** PWA-Manifest-Splash (Icon auf `canvas`), danach <300 ms In-App-Fade. Kein eigener Screen mit Wartezeit.

**Welcome (`/`):**
- Full-bleed Hero (16:10, emotionale Landschaft — eines der kuratierten Fallback-Bilder, kein API-Call nötig), Scrim unten.
- Auf dem Bild: Eyebrow `DEINE NÄCHSTE REISE`, `display` „Orte, die dich umhauen.", ein Satz `body` auf Weiß: „Beantworte ein paar Fragen — ich finde Ziele, die wirklich zu dir passen."
- Bottom-fixiert: Primary-Button **„Reise finden"**.
- Existiert ein gespeichertes Ergebnis: Quiet-Button „Letzte Empfehlungen ansehen" darunter.
- Animation: Hero sanfter Ken-Burns-Zoom (Scale 1.0→1.05 über 12 s, einmalig), Texte gestaffelt einblenden.

---

## S1–S7 — Onboarding Phase 1 (harte Filter)

**Gemeinsames Layout (`QuestionShell`):**
- Oben: `ProgressSegments` (13 Segmente) + Zurück-Pfeil.
- `display`-Frage, optional eine `subhead`-Erklärzeile.
- Antwortbereich in der unteren Screenhälfte (Daumenzone).
- **Auto-Advance** bei Single-Choice: Auswahl bestätigt sich (Scale + Akzentrahmen, 220 ms), dann automatisch weiter — kein „Weiter"-Button. Multi-Select-/Freitext-Screens (S3, S1-„Andere Stadt") haben einen expliziten Weiter-Button.

| # | Frage | UI | → API-Feld |
|---|---|---|---|
| S1 | „Wo startest du?" | 3 `SelectCard`s (Zürich/Basel/Genf, fest hinterlegte Koordinaten) + „Andere Stadt" → `TextInput` + `GET /geocode` | `origin_lat`, `origin_lng`, `origin_label` |
| S2 | „Wie viel Zeit hast du?" | 4 `SelectCard`s: „3–4 Tage" / „5–7 Tage" / „8–14 Tage" / „Länger" | `duration_days`: 4 / 7 / 14 / 21 |
| S3 | „Wann soll es losgehen?" | `MonthGrid` (12 Pills, Multi-Select) + Toggle **„Ich bin flexibel"** (deaktiviert Pills). Weiter-Button. | `travel_months`: Auswahl oder `[]` bei flexibel — **nie `null`** |
| S4 | „Wie viel darf ein Tag kosten?" | 4 `SelectCard`s mit €-Zeichen + Klartext: „€ · Günstig unterwegs" / „€€ · Solide Mitte" / „€€€ · Gerne komfortabel" / „€€€€ · Nach oben offen" | `budget_level`: niedrig/mittel/gehoben/hoch |
| S5 | „Wer reist mit?" | 4 `SelectCard`s: Allein / Zu zweit / Familie / Freunde (Icon + Label) | `party_type`: solo/paar/familie/freunde |
| S6 | „Wie abenteuerlustig darf's werden?" | 3 **erzählerische** `SelectCard`s (2-zeilig): „Sicher & entspannt — ich will ankommen und genießen" / „Offen für mehr, wenn es sich lohnt" / „Je unberührter, desto besser" | `comfort_zone`: sicher/ausgewogen/abenteuer |
| S7 | „Würdest du vor Ort selbst fahren?" | 3 `SelectCard`s: „Ja, gerne" / „Wenn nötig" / „Lieber nicht" | `car_preference`: ja/wenn_noetig/auf_keinen_fall |

**S1-Sonderfall „Andere Stadt":** Tippt der Nutzer eine eigene Stadt, ruft das Frontend beim Absenden `GET /geocode?q=...` auf. Erfolg → Koordinaten übernehmen, weiter. Fehler (404/500) → Inline-Fehlertext unter dem Feld, Nutzer kann erneut versuchen oder „Zurück zur Auswahl".

---

## S8–S11 — Onboarding Phase 2 (Geschmacks-Achsen)

**Der emotionale Höhepunkt des Onboardings.** Jeder Screen: zwei Bild-Pole (1:1, oben nebeneinander), dazwischen der `AxisSlider`.

- Slider: −100…+100, **Mittel-Raste bei 0** („ausgeglichen"), Beschriftung der Pole in `subhead`.
- Die Bilder reagieren: Der bevorzugte Pol wird minimal größer/heller (Scale 1.0→1.04, Opacity des anderen 1→0.55), proportional zum Sliderwert. Haptik-Gefühl ohne Haptik.
- Weiter-Button (Slider hat keinen eindeutigen „Fertig"-Moment). Default-Stellung: Mitte.

| # | Frage | Pol A (−100) | Pol B (+100) | → API-Feld |
|---|---|---|---|---|
| S8 | „Was zieht dich mehr an?" | Natur & Landschaft (Bergsee) | Stadt & Kultur (Skyline abends) | `axis_nature_city` |
| S9 | „Wie soll sich die Reise anfühlen?" | Aktiv & fordernd (Trekking) | Ruhig & genießend (Infinity-Pool) | `axis_activity_relax` |
| S10 | „Welche Orte reizen dich?" | Ikonische Highlights (Machu Picchu) | Abseits des Trubels (einsamer Fjord) | `axis_iconic_hidden` |
| S11 | „Wie willst du wohnen & reisen?" | Stilvoller Komfort (Boutique-Lodge) | Einfach & authentisch (Homestay) | `axis_luxury_authentic` |

**Achtung Implementierung:** Wire-Format ist **−100…+100** (0 = neutral). Kein 0–100-Slider-Rohwert durchreichen — siehe `api-contract.md`.

## S12–S13 — Feintuning (überspringbar)

- **S12 „Wie wichtig sind dir Postkarten-Momente?"** — unipolarer Slider 0–100 + Quiet-Button „Überspringen" (→ `axis_photogenic_importance: null`).
- **S13 „Wie mutig darf dein Reiseberater sein?"** — unipolarer Slider, Pole „Sichere Treffer" ↔ „Überrasch mich", Default 50 (→ `exploration_level`). Weiter-Button heißt hier **„Empfehlungen finden"** — das ist der Absende-Moment.

---

## S14 — Loading Experience (`/loading`)

**Choreografiert auf die echte Latenz** (Claude-Call: ~20–35 s; Filter/Scoring: <1 s). Kein Fake-Fortschritt, der nach 3 s fertig „aussieht".

`LoadingChecklist`, Schritte erscheinen sequenziell, Häkchen zeichnet sich (SVG-Stroke):

| Zeitpunkt | Schritt |
|---|---|
| ~1,5 s | ✓ Reiseprofil analysieren |
| ~3,5 s | ✓ Reisezeit & Saison prüfen |
| ~6 s | ✓ 300 Ziele filtern |
| ~9 s | ✓ Geheimtipps abwägen |
| bis Response | ⏳ **Persönliche Empfehlungen entstehen …** (aktiver Zustand mit Shimmer) |

- Während des letzten Schritts rotieren Mikro-Texte (`footnote`, alle ~5 s): „Vergleiche Reiseaufwand …", „Prüfe Besucherdichte …", „Formuliere deine Begründungen …".
- Response früher da → verbleibende Häkchen im Schnelldurchlauf (Gesamtminimum 4 s, damit es nie „zu billig" wirkt).
- **`NO_CANDIDATES` (kommt in <2 s):** Kurzsequenz (~3 s), dann Übergang zu S17.
- **`UNAUTHORIZED`** (sehr selten, z. B. Speicher manuell geleert): Inline-Fehlertext „Deine Sitzung ist abgelaufen." + Reload-Button (baut automatisch eine neue anonyme Session auf). Antworten bleiben in `sessionStorage` erhalten.
- **Netzwerk-/Serverfehler:** Übergang zu S18.
- Kein Abbrechen-Button (Anfrage kostet ohnehin), aber Browser-Back bleibt funktional → zurück zu S13, Antworten erhalten.

---

## S15 — Empfehlungen (`/results`)

**Das Herzstück.** Vertikaler Feed, eine Karte pro Empfehlung.

- Header: Eyebrow `DEINE EMPFEHLUNGEN`, `title1` „Für dich gefunden", `subhead` „8 Orte, passend zu deinen Antworten" + Quiet-Button „Neue Suche".
- **`RecommendationCard`** (4:5-Bild, `r-lg`):
  - Bild mit Scrim; darauf unten: Eyebrow Land, `title2` Ortsname.
  - `MatchBadge` oben rechts („92 % Match"; fehlt der Wert, wird das Badge ausgeblendet, nie „–– %").
  - Unter dem Bild (auf `surface`): Begründungs-Teaser (erster Satz des `reasoning`, max. 2 Zeilen, Ellipsis) + `MetaChip`-Zeile: „7–12 Tage" (`minimum_days`–`ideal_days`) · „€€" (`estimated_budget_level`) · „Jun–Sep" (`best_months` komprimiert).
- Daten: `POST /recommendations`-Antwort + ein `GET /destinations?ids=…` für Details. Bis Details da sind: `Skeleton`-Karten in exakter Kartengeometrie.
- Entrance: Stagger 60 ms pro Karte. Reihenfolge = `rank`.
- Karten-Tap → S16, Bild expandiert Richtung Hero (Shared-Element-Gefühl).

---

## S16 — Destination Detail (`/destination/:id`)

Aufbau (oben → unten):

1. **Hero** (16:10 full-bleed): Zurück-Pfeil auf Scrim oben; unten auf dem Bild Eyebrow Land · `title1` Ortsname. Beim Scrollen: Hero parallax-frei, ab Bildende erscheint kompakter Sticky-Header (Name, `footnote`).
2. **„Warum es zu dir passt"** — direkt unter dem Hero, `accent-soft`-Karte mit vollständigem `reasoning` in `body`. **Die persönliche Begründung steht vor allen Fakten** — das ist der Unterschied zu Wikipedia.
3. **Highlights** — `highlights[]` als ruhige Liste (kleiner Akzentpunkt, `body`).
4. **Fakten-Grid** (2×2 `MetaChip`-artige Kacheln): Reisedauer min–ideal · Budget-Level · Beste Monate (12er-Streifen, aktive Monate in Akzent) · Aufwand („entspannt/moderat/expedition" aus `trip_effort_score`-Bändern).
5. **Charakter** — `ScoreBar`s der **4–5 höchsten** Erlebnis-Scores (nie alle 14; nur was den Ort auszeichnet).
6. **Beschreibung** — `description` als `body`-Text.
7. **CTA-Zeile:** Ghost-Buttons „Flüge ansehen" / „Unterkünfte" (externe Deep-Links: Google Flights / Booking mit Ortsname als Query — reine URL-Builder, kein Backend). Bild-`image_attribution` als `caption`-Fußnote.

Phase 2 ergänzt hier: Karte (jetzt möglich — `latitude`/`longitude` existieren seit Migration 005), Galerie, „Merken" (Favoriten).

---

## S17 — Kriterien zu eng (`NO_CANDIDATES`)

- Illustrationsfrei, ruhig. `title1` **„Zu speziell — noch."** `body`: „Deine Kombination aus Dauer, Budget und Komfort passt gerade auf keines der 300 Ziele. Eine kleine Anpassung genügt meist."
- Drei Anpassungs-Chips (je ein Tap → zurück in die betreffende Frage, alle übrigen Antworten bleiben erhalten): „Mehr Zeit geben" (→ S2) · „Budget öffnen" (→ S4) · „Mutiger sein" (→ S6).
- Kein Schuldgefühl, keine roten Farben — das ist ein Ergebnis, kein Fehler.

## S18 — Fehler

- `ErrorState`: „Verbindung verloren." + Primary „Nochmal versuchen" (wiederholt den Request mit identischen Antworten). Antworten gehen **nie** verloren.
