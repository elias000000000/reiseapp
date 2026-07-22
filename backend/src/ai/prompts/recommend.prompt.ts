// Baut die Claude-Nachricht fuer die finale Empfehlung aus der
// diversifizierten Shortlist (~15 Orte) + den 11 Original-Antworten.
// Claude erhaelt hier NUR die vorgefilterte Shortlist, nie die volle
// 300er-Datenbank - haelt die Kosten niedrig (siehe CLAUDE.md Datenfluss).

import type { DestinationRow, TripRequestInput } from "../../types/qa.types.js";

const PARTY_TYPE_LABELS: Record<TripRequestInput["party_type"], string> = {
  solo: "alleine",
  paar: "als Paar",
  familie: "mit der Familie",
  freunde: "mit Freunden",
};

const COMFORT_ZONE_LABELS: Record<TripRequestInput["comfort_zone"], string> = {
  sicher: "moechte sich immer sicher & entspannt fuehlen",
  ausgewogen: "ist offen fuer mehr, wenn es sich lohnt",
  abenteuer: "sucht bewusst das Abenteuer, auch abseits ausgetretener Pfade",
};

function describeAxis(value: number, poleA: string, poleB: string): string {
  if (value === 0) return "keine klare Praeferenz";
  const intensity = Math.abs(value) >= 60 ? "stark" : "leicht";
  return `${intensity} Richtung "${value < 0 ? poleA : poleB}" (${value})`;
}

function formatDestination(d: DestinationRow): string {
  return [
    `- id: ${d.id}`,
    `  name: ${d.name} (${d.country}, ${d.region ?? d.continent})`,
    `  kategorien: ${d.categories.join(", ")}`,
    `  beschreibung: ${d.description ?? "-"}`,
    `  scores: wow=${d.wow_factor_score} natur=${d.nature_score} stadt=${d.city_score} ` +
      `abenteuer=${d.adventure_score} luxus=${d.luxury_score} besucherdichte=${d.tourist_density_score} ` +
      `foto=${d.photography_score} sicherheit=${d.safety_score} aufwand=${d.trip_effort_score}`,
    `  reise-info: min_tage=${d.minimum_days} ideal_tage=${d.ideal_days} budget=${d.estimated_budget_level} ` +
      `beste_monate=[${d.best_months.join(",")}] auto_noetig=${d.car_needed} solo_geeignet=${d.solo_friendly}`,
  ].join("\n");
}

export function buildRecommendPrompt(
  shortlist: DestinationRow[],
  answers: TripRequestInput,
  range: { minItems: number; maxItems: number }
): string {
  const monthsText = answers.travel_months.length > 0 ? answers.travel_months.join(", ") : "flexibel/egal";
  const rangeText =
    range.minItems === range.maxItems
      ? `genau ${range.minItems}`
      : `${range.minItems} bis ${range.maxItems}`;

  return `Du bist ein erfahrener, persoenlicher Reiseberater. Ein Nutzer hat einen kurzen Fragenkatalog beantwortet. Waehle daraus die passendsten Reiseziele aus einer bereits vorgefilterten Shortlist aus - du siehst NICHT die komplette Datenbank, sondern nur die ${shortlist.length} Orte unten, die algorithmisch als beste Kandidaten vorselektiert wurden.

## Profil des Nutzers

- Reisedauer: ${answers.duration_days} Tage
- Reisezeitraum: ${monthsText}
- Budget: ${answers.budget_level}
- Reiseform: ${PARTY_TYPE_LABELS[answers.party_type]}
- Komfortzone: ${COMFORT_ZONE_LABELS[answers.comfort_zone]}
- Mietwagen: ${answers.car_preference}
- Natur vs. Stadt: ${describeAxis(answers.axis_nature_city, "Natur & Landschaft", "Stadt & Kultur")}
- Aktiv vs. Entspannen: ${describeAxis(answers.axis_activity_relax, "Aktiv & Abenteuer", "Ruhe & Geniessen")}
- Ikonisch vs. Hidden Gem: ${describeAxis(answers.axis_iconic_hidden, "Ikonische Highlights", "Abseits des Trubels")}
- Komfort vs. Authentisch: ${describeAxis(answers.axis_luxury_authentic, "Stilvoller Komfort", "Einfach & Authentisch")}
${answers.axis_photogenic_importance != null ? `- Wichtigkeit Fotogenitaet: ${answers.axis_photogenic_importance}/100` : "- Fotogenitaet: keine Angabe"}

## Shortlist (bereits vorgefiltert und diversifiziert)

${shortlist.map(formatDestination).join("\n\n")}

## Deine Aufgabe

1. Waehle ${rangeText} Orte aus der Shortlist aus (nicht mehr, nicht weniger als vorgegeben).
2. Achte auf echte Bandbreite: keine Fast-Duplikate (z. B. nicht 4 fast identische Strandinseln), auch wenn mehrere aehnlich gut zum Profil passen.
3. Schreibe pro Ort eine kurze, persoenliche Begruendung (2-3 Saetze, Deutsch), die konkret auf die Antworten des Nutzers eingeht - nicht generisch, sondern warum GENAU dieser Ort zu GENAU diesem Profil passt.
4. Uebermittle deine Auswahl ausschliesslich ueber das Tool "submit_recommendations".`;
}
