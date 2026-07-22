# Design System — Reiseapp

**Leitidee: „Ruhige Bühne, emotionale Bilder."**
Das UI ist zurückhaltend und präzise (Apple), die Emotion kommt ausschließlich aus der Reisefotografie (Airbnb), die Inhalte sind persönlich statt generisch (Spotify). Jede Komponente wird zuerst für das iPhone entworfen; Tablet/Desktop bekommen mehr Weißraum, nie ein anderes Layout-Paradigma.

Dieses Dokument ist die verbindliche Referenz für alle Styling-Entscheidungen. Kein Roh-Hex, keine Ad-hoc-Abstände im Komponenten-Code — ausschließlich diese Tokens.

---

## 1. Prinzipien

1. **Ein Screen, eine Aufgabe.** Kein Screen beantwortet zwei Fragen gleichzeitig.
2. **Bilder tragen die Emotion, das UI tritt zurück.** Max. eine Akzentfarbe pro Screen; Text auf Bild nur mit Scrim.
3. **Bottom-first.** Primäre Aktionen liegen im Daumenbereich, nie oben rechts.
4. **Bewegung erklärt Struktur.** Animation zeigt, woher etwas kommt und wohin es geht — nie Dekoration, nie blockierend.
5. **Dark Mode ist tokenisiert, kein Filter.** Jede Farbe existiert von Anfang an in beiden Modi.
6. **Echte Inhalte schlagen Lorem Ipsum.** Komponenten werden mit echten Claude-Begründungen (2–3 Sätze!) und echten Ortsnamen („Lençóis Maranhenses") entworfen.

---

## 2. Farben

Semantische CSS-Custom-Properties (`--color-*`), umgeschaltet über `data-theme` am Root.

| Token | Light | Dark | Verwendung |
|---|---|---|---|
| `canvas` | `#F8F7F5` | `#0D0E10` | App-Hintergrund (warmes Off-White / Fast-Schwarz) |
| `surface` | `#FFFFFF` | `#17181B` | Karten, Sheets |
| `ink` | `#131417` | `#F4F4F2` | Primärtext |
| `ink-2` | `#5D6166` | `#A7ABB0` | Sekundärtext, Meta |
| `ink-3` | `#9A9EA4` | `#6E7278` | Platzhalter, Disabled |
| `line` | `#E9E7E3` | `#26282C` | Hairlines, Trenner |
| `accent` | `#0C6170` | `#4FB3C4` | Tiefes Petrol „Ozean" — CTA, aktive Zustände, Match-Badge |
| `accent-ink` | `#FFFFFF` | `#0D0E10` | Text auf Akzent |
| `accent-soft` | `#E3F0F2` | `#12333A` | Aktive Chips, sanfte Hintergründe |
| `success` | `#1F7A43` | `#4CAF78` | Loading-Häkchen |
| `danger` | `#B4453A` | `#E07B70` | Fehlerzustände |

**Regeln:**
- Akzent nur für: primäre CTA, aktive Auswahl, Match-Badge, Fortschritt. Niemals großflächig.
- Scrim für Text auf Bildern: `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)` — in beiden Modi identisch.

---

## 3. Typografie

**System-Stack** — fühlt sich auf iOS exakt wie SF Pro an, null Ladezeit, native Dynamik:

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
```

Optional (Phase 2, als Editorial-Akzent): Display-Serif (z. B. Fraunces) ausschließlich für Ortsnamen auf Hero-Bildern. Phase 1 bleibt bei einer Familie — Kontrast entsteht über Größe und Gewicht.

**Skala** (an iOS HIG angelehnt, `px @ Mobile`):

| Token | Größe/Zeile | Gewicht | Verwendung |
|---|---|---|---|
| `display` | 34/41 | 700, ls −0.4 | Frage-Titel im Onboarding, Welcome |
| `title1` | 28/34 | 700 | „Für dich gefunden", Detail-Ortsname |
| `title2` | 22/28 | 600 | Kartentitel, Detail-Sektionen |
| `headline` | 17/22 | 600 | Buttons, betonte Zeilen |
| `body` | 17/24 | 400 | Fließtext (Claude-Begründungen) |
| `subhead` | 15/20 | 400–500 | Meta-Zeilen, Slider-Pole |
| `footnote` | 13/18 | 400 | Chips, Hinweise |
| `caption` | 12/16 | 500, ls +0.6, uppercase | Eyebrows (z. B. „PORTUGAL" über dem Ortsnamen) |

---

## 4. Spacing, Grid, Layout

- **4-px-Basis.** Stufen: `4 8 12 16 20 24 32 40 48 64`.
- **Screen-Rand:** 20 px. **Karten-Innenabstand:** 16–20 px. **Sektionsabstand:** 32–40 px.
- **Content-Maxbreite: 480 px, zentriert.** Das Mobile-Layout ist die Wahrheit — Desktop bekommt Weißraum, ab 768 px darf die Ergebnisliste 2-spaltig werden. Nichts wird „hochskaliert".
- **Safe Areas:** `viewport-fit=cover`; alle bottom-fixierten Elemente addieren `env(safe-area-inset-bottom)`.

---

## 5. Radius & Erhebung

| Token | Wert | Verwendung |
|---|---|---|
| `r-sm` | 10 | Chips, Inputs |
| `r-md` | 14 | Buttons |
| `r-lg` | 20 | Karten |
| `r-xl` | 28 | Bottom Sheets, Modal |
| `r-full` | 999 | Badges, Pills, Monats-Chips |

**Schatten — Hairline vor Schatten:** Karten trennen sich primär über Fläche (`surface` auf `canvas`) + Hairline. Schatten nur zwei Stufen:

```css
--sh-card:  0 1px 2px rgba(19,20,23,.04), 0 8px 24px rgba(19,20,23,.06);
--sh-float: 0 12px 32px rgba(19,20,23,.16);  /* Sheets, sticky CTA */
```

Dark Mode: Schatten quasi unsichtbar → Erhebung über Flächenhelligkeit (`surface` heller als `canvas`).

---

## 6. Ergonomie (iPhone, einhändig)

- Touch-Ziele **min. 44×44 px**, Abstand zwischen tappbaren Elementen ≥ 8 px.
- **Primär-CTA:** volle Breite, 52 px hoch, bottom-fixiert über Safe Area.
- Zurück: Header-Pfeil links (44er-Fläche) + Browser-Back funktioniert immer (History-basierte Navigation, kein State-only-Routing).
- Alles Wichtige in der unteren Bildschirmhälfte; obere Hälfte = Inhalt/Bild.

---

## 7. Bilder

Bilder sind das emotionale Rückgrat — behandelt als Inhalt, nicht als Dekoration.

- **Formate:** Hero 16:10 full-bleed (Welcome, Detail) · Card 4:5 hochkant (Ergebnisliste) · Achsen-Pol 1:1.
- **Laden:** LQIP-Blur-up (dominante Farbe/Mini-Thumb als Platzhalter) → `srcset` in 3 Breiten (480/960/1440) → `loading="lazy"` (außer erstem sichtbaren Hero).
- **Quelle austauschbar:** Eine einzige Komponente `<DestinationImage>` liest ausschließlich `destination.image_url` (+ `image_attribution` für den Lizenznachweis). Bildwechsel = DB-Update, null Code-Änderung.
- **Fallback:** Pro Leit-Kategorie ein kuratiertes Platzhalterbild (Berge/Strand/Stadt/Wüste …), nie ein grauer Kasten.
- Naturbelassene Fotografie — keine Duotone-Filter, keine starken Overlays außer dem Text-Scrim.

---

## 8. Motion

**Charakter: Apple, nicht Gaming.** Kurz, physisch plausibel, immer unterbrechbar.

| Token | Wert | Verwendung |
|---|---|---|
| `dur-micro` | 150 ms | Tap-Feedback, Chip-Toggle |
| `dur-standard` | 250 ms | Zustandswechsel, Fade |
| `dur-page` | 400 ms | Screen-Übergänge |
| Easing | `cubic-bezier(.32,.72,0,1)` | Standard (iOS-Feel) |
| Spring (Framer) | `{ stiffness: 300, damping: 32 }` | Karten, Sheets |

**Kern-Patterns:**
- **Frage-Advance:** Auswahl bestätigt sich (Scale 0.97→1 + Akzentrahmen), 220 ms Pause, dann Slide-out links / neue Frage Slide-in rechts.
- **Card-Entrance:** Stagger 60 ms, `y: 16→0` + Opacity.
- **Card → Detail:** Shared-Element-Gefühl — Kartenbild expandiert zum Hero (mindestens: Crossfade + Scale von der Kartenposition).
- **Loading-Checks:** SVG-Häkchen zeichnet sich (Stroke-Dashoffset), erledigte Zeile blendet auf `ink-2` ab.
- **Skeleton:** sanfter Shimmer, nur solange echte Daten fehlen.
- `prefers-reduced-motion`: alle Übergänge werden zu reinen Fades.

**Verboten:** Bounce-Übertreibung, Parallax > 8 px, Animationen, die Eingaben blockieren.

---

## 9. Komponenten-Umfang (Phase 1)

| Komponente | Zweck |
|---|---|
| `Screen` | Layout-Shell: Safe Areas, Maxbreite, Scroll-Verhalten |
| `AppHeader` | Zurück-Pfeil, optionaler Titel, transparent-über-Bild-Variante |
| `ProgressSegments` | 11 Segmente Onboarding-Fortschritt |
| `Button` | primary / ghost / quiet |
| `Chip` | Auswahl-Chip (single/multi), aktiv = `accent-soft` |
| `SelectCard` | Große Antwortkarte (Budget, Reiseform, Komfortzone) |
| `MonthGrid` | 12 Monats-Pills + „Ich bin flexibel" |
| `AxisSlider` | Bipolarer Slider mit Bild-Polen, Mittel-Raste bei 0 |
| `LoadingChecklist` | Choreografierte Schritt-Liste (s. screens.md) |
| `RecommendationCard` | 4:5-Bildkarte mit Eyebrow, Name, Match, Teaser, Meta |
| `MatchBadge` | „92 % Match" Pill auf Akzent |
| `MetaChip` | Dauer / Budget / Reisezeit als kleine Pills |
| `ScoreBar` | Minimale horizontale Score-Visualisierung (Detail) |
| `DestinationImage` / `HeroImage` | Bild-Pipeline (LQIP, srcset, Fallback, Attribution) |
| `SectionTitle` | Detail-Sektionen |
| `Skeleton` | Ladeplatzhalter für Cards/Detail |
| `EmptyState` / `ErrorState` | NO_CANDIDATES / Netzwerkfehler |
| `PageTransition` | Router-Übergänge (Framer `AnimatePresence`) |

Keine Komponente wird doppelt gebaut; Varianten über Props, nicht über Kopien.
