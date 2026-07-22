# Bewertungslogik der Reiseziel-Datenbank

**Status:** Phase 2 — finale Bewertungsdefinition.
**Zweck:** Diese Datei ist die verbindliche Referenz dafuer, wie jeder Score vergeben wird. Alle 300 Orte in Phase 3 werden strikt nach diesen Ankern bewertet, damit die Datenbank in sich konsistent ist und die Claude-API-Vorauswahl verlaesslich funktioniert.

---

## 1. Grundprinzipien

1. **Scores sind redaktionelle Einschaetzungen, keine geprueften Fakten.** Sie ordnen Orte relativ zueinander ein. Wo eine konkrete Angabe (z. B. `best_months`, `safety_score`, `flight_access_score`) unsicher ist, wird das im Feld `description` kurz gekennzeichnet, statt Sicherheit vorzutaeuschen.
2. **Weltmassstab, nicht Regionalmassstab.** Ein Score von 100 bedeutet „weltweit an der Spitze", nicht „das Beste in seiner Region". Ein schoener Stadtpark macht keinen `nature_score` von 90.
3. **Ehrliche Nullen und niedrige Werte sind erwuenscht.** Ein Ort muss nicht in jeder Kategorie punkten. Ein Wuestenziel hat `beach_score` nahe 0, eine Metropole `nature_score` niedrig. Genau diese Unterschiede machen die Vorauswahl nutzbar.
4. **Erlebnisqualitaet steht ueber Bekanntheit.** Bewertet wird, was der Ort dem Reisenden tatsaechlich bietet, nicht wie beruehmt er ist.

---

## 2. Allgemeine Skala

Alle `*_score`-Felder sind Ganzzahlen von **0 bis 100**. Es gelten fuenf Anker; Werte dazwischen werden interpoliert.

| Anker | Bedeutung (generisch) |
|------:|-----------------------|
| **100** | Weltklasse. Weltweit einzigartig, ein Grund fuer sich allein zu reisen. |
| **80**  | Sehr spektakulaer. Herausragend, viele besondere Erlebnisse. |
| **50**  | Schoen/solide, aber nicht aussergewoehnlich. |
| **20**  | Kaum relevant, nur am Rande vorhanden. |
| **0**   | Faktisch nicht vorhanden. |

**Richtwerte fuer die Vergabe:**
- **90–100** nur fuer echte Weltspitze. Sparsam vergeben.
- **75–89** sehr stark, klarer Reisegrund.
- **50–74** gut, aber ergaenzend.
- **25–49** vorhanden, aber schwach.
- **0–24** vernachlaessigbar bis nicht existent.

Sonderrollen: `wow_factor_score` ist der **Leit-Score** der App (Abschnitt 3.11). Zwei Felder sind **Richtungs-Scores** mit gesonderter Logik (Abschnitt 4): `budget_score` und `tourist_density_score`. Vier weitere sind **Logistik-/Rahmen-Scores** (Abschnitt 5): `flight_access_score`, `safety_score`, `trip_effort_score` (hoch = mehr Aufwand) und `season_flexibility_score`.

---

## 3. Erlebnis-Scores

Fuer diese Felder gilt durchgaengig: **hoch = mehr/besser von dieser Eigenschaft**. (Enthaelt auch den Leit-Score `wow_factor_score`, Abschnitt 3.11.)

### 3.1 `nature_score` — Naturerlebnis
- **100:** Weltklasse-Natur, weltweit einzigartige Landschaft (z. B. Patagonien, Island).
- **80:** Sehr spektakulaere Natur mit vielen besonderen Landschaftserlebnissen (z. B. Namibia, Lofoten).
- **50:** Schoene Natur, aber nicht aussergewoehnlich; angenehm, nicht der Hauptgrund zu reisen.
- **20:** Kaum relevantes Naturerlebnis, Natur nur als Kulisse.
- **0:** Reines Stadt-/Innenraum-Ziel ohne Naturbezug.

### 3.2 `photography_score` — Fotografie-Potenzial
Bewertet die Dichte und Wucht fotogener Motive (Landschaft, Architektur, Licht, Szenen).
- **100:** Ununterbrochen fotogen, ikonische Motive an jeder Ecke (z. B. Kappadokien, Namibia).
- **80:** Sehr fotogen, viele herausragende Motive.
- **50:** Solide Motive, aber nichts, wofuer man allein anreist.
- **20:** Wenig visuell Besonderes.
- **0:** Optisch reizarm.

### 3.3 `adventure_score` — Abenteuer & Aktivitaeten
Bewertet aktive, teils herausfordernde Erlebnisse (Trekking mehrtaegig, Klettern, Tauchen, Expedition, Selbstfahrer-Abenteuer).
- **100:** Top-Abenteuerziel weltweit, ernsthafte Outdoor-Herausforderungen (z. B. Kirgisistan, Patagonien).
- **80:** Sehr viel Abenteuerangebot mit echtem Anspruch.
- **50:** Einige Aktivitaeten moeglich, aber gut zugaenglich/gezaehmt.
- **20:** Kaum aktive Herausforderung.
- **0:** Reines Erholungs-/Stadtziel ohne Abenteuercharakter.

### 3.4 `hiking_score` — Wandern & Trekking
Speziell Wege, Wegenetz, Huetten, Vielfalt und Qualitaet der Wanderungen.
- **100:** Weltklasse-Wandergebiet, dichtes Wegenetz, unvergleichliche Routen (z. B. Dolomiten, La Reunion).
- **80:** Sehr gutes Wandern mit vielen lohnenden Touren.
- **50:** Nette Wanderungen vorhanden, aber begrenzt.
- **20:** Nur vereinzelte, unspektakulaere Wege.
- **0:** Praktisch keine Wandermoeglichkeit (z. B. flache Strandinsel).

### 3.5 `city_score` — Stadterlebnis
Urbanes Angebot: Dichte, Viertelvielfalt, Restaurants, Shopping, urbane Energie.
- **100:** Weltmetropole der Spitzenklasse (z. B. New York, Tokio).
- **80:** Grossartige Stadt mit reichem urbanem Leben.
- **50:** Angenehme Stadt mit solidem Angebot.
- **20:** Kleiner Ort, urban wenig zu holen.
- **0:** Kein staedtisches Angebot (Wildnis, Einzelinsel).

### 3.6 `culture_score` — Kultur & Geschichte
Historische Staetten, Kunst, lebendige lokale Traditionen, Kueche als Kulturtraeger.
- **100:** Weltklasse-Kulturdichte, herausragendes Erbe und/oder lebendige Kultur (z. B. Tokio, Marrakesch).
- **80:** Sehr reiche Kultur und Geschichte.
- **50:** Interessante Kultur, aber nicht praegend.
- **20:** Wenig kulturelle Substanz.
- **0:** Kein nennenswerter kultureller Bezug.

### 3.7 `beach_score` — Straende & Baden
Qualitaet, Schoenheit und Badecharakter der Straende/Kuesten.
- **100:** Weltklasse-Traumstraende, Hauptreisegrund (z. B. Malediven, Palawan).
- **80:** Sehr schoene Straende mit hoher Badequalitaet.
- **50:** Ordentliche Straende, aber kein Highlight.
- **20:** Nur felsige/kalte/schwer zugaengliche Kueste.
- **0:** Keine Straende (Binnenland, Wueste).

### 3.8 `wildlife_score` — Tierwelt
Wahrscheinlichkeit und Qualitaet von Tierbeobachtungen (Safari, Marine, Voegel).
- **100:** Weltklasse-Wildlife, verlaessliche Sichtungen ikonischer Arten (z. B. Namibia/Etosha).
- **80:** Sehr gute Tierbeobachtung mit besonderen Arten (z. B. Sri Lanka).
- **50:** Gelegentliche, ansprechende Sichtungen.
- **20:** Kaum bemerkenswerte Tierwelt.
- **0:** Praktisch keine relevante Fauna fuer Reisende.

### 3.9 `nightlife_score` — Nachtleben
Bars, Clubs, Live-Musik, abendliche Ausgehkultur.
- **100:** Weltklasse-Nachtleben rund um die Uhr (z. B. New York, Tokio).
- **80:** Sehr lebendiges Nachtleben mit grosser Bandbreite.
- **50:** Solides Abendangebot, ein paar gute Adressen.
- **20:** Sehr ruhig, nur vereinzelt.
- **0:** Kein Nachtleben.

### 3.10 `luxury_score` — Luxus- & Premium-Angebot
Verfuegbarkeit hochwertiger Unterkuenfte und Premium-Erlebnisse.
- **100:** Weltklasse-Luxusdestination, dichtes Premium-Angebot (z. B. Malediven).
- **80:** Sehr gutes Luxusangebot vorhanden.
- **50:** Gehobene Optionen vorhanden, aber begrenzt.
- **20:** Kaum Luxus, ueberwiegend einfache Optionen.
- **0:** Nur einfachste Infrastruktur.

### 3.11 `wow_factor_score` — Gesamt-Wow (LEIT-SCORE)
> **Wichtigster Score der App.** Das Ziel ist nicht „finde einen guenstigen Ort", sondern „finde Orte, die mich umhauen". Dieser Score ist das primaere Ranking-Signal fuer die Vorauswahl; die uebrigen Scores praezisieren, *warum* und *fuer wen*.

`wow_factor_score` ist **keine** Mittelung der anderen Scores, sondern eine eigenstaendige Gesamteinschaetzung der Ueberwaeltigungskraft: Wie stark bleibt der Ort im Gedaechtnis, wie einzigartig ist der Gesamteindruck? Ein Ort kann in Einzelkategorien mittelmaessig sein und trotzdem hohen Wow haben (Gesamtwirkung > Summe der Teile) — und umgekehrt.

- **100:** Absoluter Weltspitzen-Wow, ein Ort, fuer den man allein reist und der niemanden kalt laesst (z. B. Patagonien 99, Island 97).
- **90:** Ueberwaeltigend, haut die allermeisten um (z. B. Kirgisistan 95, Namibia 94, Kappadokien 92, New York 90).
- **80:** Sehr beeindruckend, klarer „Wow"-Moment (z. B. Madeira 85, Malediven 85, Georgien 84).
- **50:** Schoen und lohnend, aber kein Umhauen.
- **20:** Nett, aber vergesslich.
- **0:** Weckt keinerlei Begeisterung.

**Vergabe-Disziplin:** In der vollen 300er-Datenbank darf `wow_factor_score` **nicht** inflationaer sein. Der Kalibrierungssatz besteht bewusst aus Ausnahmeorten (alle 80+); im Gesamtbestand muss es einen echten Verlauf nach unten geben, sonst verliert der Leit-Score seine Trennschaerfe. Richtwert: nur eine Minderheit der 300 Orte sollte >= 90 liegen.

---

## 4. Richtungs-Scores (gesonderte Logik)

Diese beiden Felder sind bewusst so definiert, dass sie fuer die spaetere Vorauswahl direkt nutzbar sind. **Richtung hier genau beachten.**

### 4.1 `budget_score` — Preis-Leistung / Erschwinglichkeit
**Hoch = guenstig / gutes Preis-Leistungs-Verhaeltnis. Niedrig = teuer.**
Bewertet das typische Vor-Ort-Preisniveau fuer Reisende (Unterkunft, Essen, Aktivitaeten), nicht die Anreise.
- **100:** Sehr guenstig, hervorragendes Preis-Leistungs-Verhaeltnis (z. B. Kirgisistan, Georgien).
- **80:** Guenstig, viel fuers Geld.
- **50:** Mittleres Preisniveau.
- **20:** Teuer, hohe Tagesausgaben noetig.
- **0:** Extrem teuer (z. B. Island, Malediven im oberen Bereich).

> Bezug zu `estimated_budget_level`: `budget_score` ist die numerische, filterbare Groesse; `estimated_budget_level` (niedrig/mittel/gehoben/hoch) ist das menschenlesbare Label. Beide muessen zusammenpassen (siehe Abschnitt 6).

### 4.2 `tourist_density_score` — Besucherdichte
**Hoch = stark besucht / touristisch. Niedrig = wenig besucht / ruhig.**
- **100:** Extrem ueberlaufen in der Hauptsaison, Massentourismus praegt das Erlebnis.
- **80:** Stark besucht, spuerbar touristisch.
- **50:** Moderat besucht, saisonabhaengig.
- **20:** Wenig besucht, meist ruhig.
- **0:** Nahezu unberuehrt, kaum Reisende (z. B. Kirgisistan, abgelegene Regionen).

> **Bewusste Konvention:** Dies ist der einzige Erlebnis-nahe Score, bei dem „hoch" tendenziell negativ konnotiert ist. Die Vorauswahl-Logik (Phase 3 / API) muss das Feld entsprechend interpretieren — ein Nutzer mit Wunsch „Hidden Gem / wenig Touristen" bevorzugt **niedrige** Werte. Die Richtung ist in Phase 1 geprueft und bestaetigt worden.

---

## 5. Logistik-Scores

### 5.1 `flight_access_score` — Erreichbarkeit per Flug
**Hoch = einfach erreichbar. Niedrig = umstaendliche Anreise.**
Bezieht Direktverbindungen, Umsteigehaeufigkeit und Transferaufwand ab Flughafen ein (aus mitteleuropaeischer Perspektive).
- **100:** Sehr gut angebunden, viele Direktfluege, kurzer Transfer (z. B. grosse Hubs wie New York).
- **80:** Gut erreichbar, meist direkt oder ein Umstieg.
- **50:** Machbar, aber Umsteigen und laengere Transfers noetig.
- **20:** Aufwaendig: mehrere Umstiege und/oder lange Landtransfers (z. B. La Reunion, Patagonien).
- **0:** Extrem schwer erreichbar.

### 5.2 `safety_score` — Sicherheit fuer Reisende
**Hoch = sicher. Niedrig = erhoehte Risiken.**
Allgemeine Reisesicherheit (Kriminalitaet, Stabilitaet, medizinische Versorgung). Grobe Gesamteinschaetzung; regionale/aktuelle Schwankungen gehoeren in die `description`.
- **100:** Sehr sicher, unbeschwertes Reisen (z. B. Japan, Island).
- **80:** Sicher mit ueblicher Umsicht.
- **50:** Erhoehte Aufmerksamkeit noetig.
- **20:** Deutliche Risiken, nur mit Vorbereitung/Begleitung.
- **0:** Von Reisen wird generell abgeraten.

### 5.3 `trip_effort_score` — Gesamtaufwand der Reise
**Hoch = aufwendig / kompliziert. Niedrig = spontan machbar.** (Richtung wie `tourist_density_score`: hoch ist eher „Huerde".)
Anders als `flight_access_score` (nur Fluganbindung) misst dieser Score den **Gesamtaufwand**: Anreise + Logistik vor Ort + noetige Mindestdauer + Planungskomplexitaet. Ein Ort kann perfekt sein und trotzdem unrealistisch fuer eine kurze, spontane Reise.
- **100:** Extremer Aufwand: abgelegen, komplexe Logistik, nur mit viel Zeit und Vorbereitung sinnvoll (z. B. Kirgisistan ~85, Patagonien ~82).
- **80:** Hoher Aufwand: Selbstfahrer/lange Distanzen, mehrere Wochen empfehlenswert (z. B. Namibia ~80).
- **50:** Mittlerer Aufwand: etwas Planung und Fahrten noetig (z. B. Island ~55, Georgien ~55).
- **20:** Geringer Aufwand: fast planungsfrei, gut fuer einen Kurztrip (z. B. New York ~20, Madeira ~25).
- **0:** Voellig spontan machbar, keine Vorbereitung noetig.

> **Nutzung in der Vorauswahl:** In Verbindung mit `minimum_days` filterbar — ein Nutzer mit nur 3 freien Tagen sollte keine Orte mit hohem `trip_effort_score`/hohem `minimum_days` vorgeschlagen bekommen (Kirgisistan fuer 3 Tage = nein, fuer 14 Tage = ja).

### 5.4 `season_flexibility_score` — Saison-Flexibilitaet
**Hoch = funktioniert fast ganzjaehrig. Niedrig = nur enges Zeitfenster.**
Ergaenzt `best_months`: `best_months` sagt *wann* es am besten ist, `season_flexibility_score` sagt, *wie eng* dieses Fenster ist. Zwei Orte koennen dieselben Bestmonate haben, aber sehr unterschiedlich streng darauf angewiesen sein.
- **100:** Praktisch immer eine gute Reisezeit, kaum schlechte Monate.
- **90:** Sehr flexibel, fast ganzjaehrig lohnend (z. B. Madeira 90).
- **70:** Breites Fenster mit einigen schwachen Monaten (z. B. Malediven 70, New York 70).
- **50:** Deutlich saisonal, nur rund die Haelfte des Jahres sinnvoll (z. B. Patagonien 50, Island 45).
- **30:** Enges Fenster, nur wenige Monate wirklich machbar (z. B. Kirgisistan 30, Albanische Alpen 30).
- **0:** Nur ein sehr kurzer Zeitraum im Jahr.

---

## 6. Nicht-Score-Felder (Konventionen)

Diese Felder sind keine 0–100-Scores, muessen aber genauso konsistent gepflegt werden.

| Feld | Typ | Konvention |
|------|-----|-----------|
| `id` | string (slug) | Eindeutig, Kleinbuchstaben, `ort_landkuerzel`, z. B. `madeira_pt`. Dient als Fremdschluessel. |
| `name`, `country`, `region` | string (DE) | Deutsche Schreibweise. `region` = Grossregion/Verwaltungsraum. |
| `continent` | enum (DE) | `Europa` / `Asien` / `Nordamerika` / `Suedamerika` / `Afrika` / `Ozeanien` / `Sonderregion`. `Sonderregion` buendelt polare, transkontinentale und extrem abgelegene Ziele (Arktis, Antarktis, Istanbul, Tibet, Socotra …), die sich keinem Kontinent sauber zuordnen lassen. |
| `categories` | string[] (DE) | Mehrfach moeglich. Erlaubte Werte: `Natur, Berge, Wandern, Insel, Strand, Stadt, Skyline, Kultur, Abenteuer, Roadtrip, Backpacking, Wildlife, Winter, Wueste`. Nach Relevanz sortiert, typ. 2–5 Eintraege. Muessen zu den Top-Scores passen (z. B. `beach_score` 90 → Kategorie `Strand`). |
| `description` | string (DE) | 2–4 Saetze. Erlebnis-Kern + ehrliche Einordnung. **Unsicherheiten hier kennzeichnen.** |
| `highlights` | string[] (DE) | 3–5 kurze, konkrete Stichpunkte. Keine Marketing-Floskeln. |
| `best_months` | number[] | Monatszahlen 1–12. Beste Reisemonate. Mehrere Fenster moeglich (z. B. Sommer + Nordlicht-Winter). |
| `minimum_days` | integer | Sinnvolle Mindestdauer vor Ort, ohne An-/Abreise. |
| `ideal_days` | integer | Empfohlene Dauer fuer ein rundes Erlebnis. Immer `>= minimum_days`. |
| `estimated_budget_level` | enum (DE) | `niedrig` / `mittel` / `gehoben` / `hoch`. Muss zu `budget_score` passen: hoch↔niedriger score, niedrig↔hoher score (siehe Mapping unten). |
| `car_needed` | boolean | `true` = eigenes Auto/Mietwagen praktisch noetig, um das Ziel sinnvoll zu erleben. |
| `solo_friendly` | boolean | `true` = gut fuer Alleinreisende (Sicherheit, Infrastruktur, Anschluss). |

**Mapping `estimated_budget_level` ↔ `budget_score` (Konsistenzregel):**

| `estimated_budget_level` | erwarteter `budget_score` |
|--------------------------|---------------------------|
| `niedrig` (sehr guenstig) | ca. 75–100 |
| `mittel` | ca. 55–74 |
| `gehoben` | ca. 35–54 |
| `hoch` (teuer) | ca. 0–34 |

---

## 7. Konsistenzregeln & Anti-Muster

Beim Bewerten jedes Orts pruefen:

1. **Kategorien spiegeln die Top-Scores.** Jede vergebene `categories`-Angabe sollte einen entsprechend hohen Score haben und umgekehrt (z. B. `Wildlife` nur bei `wildlife_score` >= ~60).
2. **Keine „Alles-gut"-Orte.** Ein Ort mit fuenf oder mehr Scores >= 85 ist verdaechtig. Weltklasse ist selten; echte Orte haben Schwaechen. Kontrastprofile sind gewollt.
3. **Budget-Konsistenz.** `budget_score` und `estimated_budget_level` duerfen sich nicht widersprechen (Mapping in Abschnitt 6).
4. **`ideal_days >= minimum_days`**, und beide realistisch zur Groesse/Erreichbarkeit des Ziels.
5. **`beach_score` und Binnenlage.** Ein Binnenland-Ziel ohne Kueste hat `beach_score` nahe 0 — kein „See zaehlt als Strand" ausser er praegt das Baden wirklich.
6. **Unsicherheiten offenlegen.** Wo `best_months`, `safety_score` oder `flight_access_score` nicht belastbar sind, in der `description` kennzeichnen — nicht als Fakt praesentieren.
7. **90+ ist eine Ausnahme.** Vor jedem Score >= 90 kurz fragen: „Gehoert das wirklich zur Weltspitze dieser Kategorie?" Wenn nicht sicher, 80er-Bereich.

---

## 8. Vollstaendige Feldliste pro Ort

Referenz fuer Phase 3 — jeder Datensatz enthaelt exakt diese **31 Felder**:

```
id, name, country, region, continent,
categories[],
description, highlights[],
nature_score, photography_score, adventure_score, hiking_score,
city_score, culture_score, beach_score, wildlife_score,
nightlife_score, luxury_score, budget_score, tourist_density_score,
wow_factor_score,
best_months[], minimum_days, ideal_days, estimated_budget_level,
flight_access_score, car_needed, solo_friendly, safety_score,
trip_effort_score, season_flexibility_score
```

**Score-Felder gesamt (14):** nature, photography, adventure, hiking, city, culture, beach, wildlife, nightlife, luxury, budget, tourist_density, wow_factor, plus die Rahmen-Scores flight_access, safety, trip_effort, season_flexibility (letztere vier in Abschnitt 5).
