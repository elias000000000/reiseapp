// Phase 2: Geschmacks-Gewichtung + Anti-Wiederholung.
//
// Nimmt den Phase-1-Kandidatenpool (~30-50 Orte) und macht drei Dinge:
//   1. Verlaufs-Ausschluss: bereits diesem user_key gezeigte Orte entfernen
//   2. Gewichtetes Score-Ranking anhand der 4 bipolaren Geschmacks-Achsen
//      + optionaler Fotogenitaets-Feintuning-Achse + wow_factor_score
//   3. Gewichtetes Zufalls-Sampling (Softmax, Temperatur aus exploration_level)
//      gefolgt von MMR-Diversitaetsauswahl fuer die finale Shortlist an Claude
//
// Ziel: dieselbe Anfrage liefert nicht immer dieselben 5 Orte (siehe
// Design-Diskussion: Verlaufs-Tracking + Sampling + MMR statt reinem Top-N).

import { supabase } from "../config/supabaseClient.js";
import type { DestinationRow, Phase2Answers } from "../types/qa.types.js";

const SAMPLE_SIZE = 20; // Zwischenschritt vor MMR
const SHORTLIST_SIZE = 15; // finale Groesse fuer den Claude-Prompt

// Gewichte je Achse: kritisch = 1.0, wichtig = 0.6, Feintuning = 0.3
const WOW_WEIGHT = 2.0;
const AXIS_WEIGHT_CRITICAL = 1.0;
const AXIS_WEIGHT_IMPORTANT = 0.6;
const PHOTO_WEIGHT = 0.3;

// MMR: Gewicht zwischen Relevanz (Score) und Diversitaet (Unaehnlichkeit)
const MMR_LAMBDA = 0.7;

// Fuer die MMR-Distanz herangezogene "geschmacksrelevante" Scores
const DISTANCE_SCORE_KEYS: (keyof DestinationRow)[] = [
  "nature_score", "city_score", "adventure_score", "luxury_score",
  "tourist_density_score", "wow_factor_score",
];

function avg(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Bipolare Achsen: Pol A bei Slider -100, Pol B bei Slider +100, 0 = neutral.
 * clusterA/clusterB liefern je einen 0-100-Wert; die Beitragsformel
 * `weight * normSlider * (clusterB - clusterA)` belohnt Orte, die zum
 * bevorzugten Pol passen, und ist bei normSlider=0 automatisch neutral.
 */
const BIPOLAR_AXES: {
  key: keyof Phase2Answers;
  weight: number;
  clusterA: (d: DestinationRow) => number;
  clusterB: (d: DestinationRow) => number;
}[] = [
  {
    key: "axis_nature_city",
    weight: AXIS_WEIGHT_CRITICAL,
    clusterA: (d) => avg([d.nature_score, d.hiking_score, d.wildlife_score, d.beach_score]),
    clusterB: (d) => avg([d.city_score, d.culture_score, d.nightlife_score]),
  },
  {
    key: "axis_activity_relax",
    weight: AXIS_WEIGHT_CRITICAL,
    clusterA: (d) => avg([d.adventure_score, d.hiking_score]),
    clusterB: (d) => d.luxury_score, // Komfort-Proxy fuer "Entspannen"
  },
  {
    key: "axis_iconic_hidden",
    weight: AXIS_WEIGHT_CRITICAL,
    clusterA: (d) => d.tourist_density_score, // hoch = ikonisch/ueberlaufen
    clusterB: (d) => 100 - d.tourist_density_score, // invertiert = Hidden Gem
  },
  {
    key: "axis_luxury_authentic",
    weight: AXIS_WEIGHT_IMPORTANT,
    clusterA: (d) => d.luxury_score,
    clusterB: (d) => 100 - d.luxury_score,
  },
];

function computeTotalScore(d: DestinationRow, answers: Phase2Answers): number {
  let score = WOW_WEIGHT * (d.wow_factor_score / 100);

  for (const axis of BIPOLAR_AXES) {
    const slider = answers[axis.key] as number; // -100..100
    const normSlider = slider / 100; // -1..1
    if (normSlider === 0) continue; // neutral -> kein Beitrag
    const clusterDiff = (axis.clusterB(d) - axis.clusterA(d)) / 100; // -1..1
    score += axis.weight * normSlider * clusterDiff;
  }

  if (answers.axis_photogenic_importance != null) {
    score += PHOTO_WEIGHT * (answers.axis_photogenic_importance / 100) * (d.photography_score / 100);
  }

  return score;
}

/**
 * Laedt alle destination_ids, die diesem Nutzer (verifizierte user_id) in
 * fruaheren Anfragen bereits vorgeschlagen wurden - Grundlage fuer den
 * Verlaufs-Ausschluss.
 */
async function getPreviouslyShownDestinationIds(userId: string): Promise<Set<string>> {
  const { data: pastRequests, error: reqError } = await supabase
    .from("trip_requests")
    .select("id")
    .eq("user_id", userId);

  if (reqError) {
    throw new Error(`Verlaufs-Abfrage (trip_requests) fehlgeschlagen: ${reqError.message}`);
  }
  const requestIds = (pastRequests ?? []).map((r) => r.id as string);
  if (requestIds.length === 0) return new Set();

  const { data: pastRecs, error: recError } = await supabase
    .from("recommendations")
    .select("destination_id")
    .in("trip_request_id", requestIds);

  if (recError) {
    throw new Error(`Verlaufs-Abfrage (recommendations) fehlgeschlagen: ${recError.message}`);
  }
  return new Set((pastRecs ?? []).map((r) => r.destination_id as string));
}

/**
 * Mappt exploration_level (0-100) auf eine Softmax-Temperatur.
 * Niedrig = fast deterministisch (nur die Top-Scores kommen durch),
 * hoch = deutlich zufaelliger (auch schwaechere Treffer haben eine Chance).
 */
function explorationLevelToTemperature(explorationLevel: number): number {
  const MIN_T = 0.05;
  const MAX_T = 2.0;
  return MIN_T + (MAX_T - MIN_T) * (explorationLevel / 100);
}

/**
 * Gewichtetes Sampling ohne Zuruecklegen (Efraimidis-Spirakis): jedes Element
 * bekommt einen Schluessel u^(1/w) mit u~Uniform(0,1) und Gewicht w=exp(score/T);
 * die n Elemente mit den groessten Schluesseln werden gezogen. Exakt und O(n log n),
 * im Gegensatz zu iterativem Ziehen-und-Entfernen kein O(n^2)-Aufwand.
 */
function weightedSampleWithoutReplacement<T>(
  items: T[],
  scoreOf: (item: T) => number,
  temperature: number,
  count: number
): T[] {
  if (items.length <= count) return [...items];

  const maxScore = Math.max(...items.map(scoreOf));
  const keyed = items.map((item) => {
    const weight = Math.exp((scoreOf(item) - maxScore) / temperature); // stabil, max-subtrahiert
    const u = Math.random();
    const key = weight > 0 ? Math.pow(u, 1 / weight) : 0;
    return { item, key };
  });
  keyed.sort((a, b) => b.key - a.key);
  return keyed.slice(0, count).map((k) => k.item);
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function euclideanSimilarity(a: DestinationRow, b: DestinationRow): number {
  const sumSq = DISTANCE_SCORE_KEYS.reduce((acc, key) => {
    const diff = ((a[key] as number) - (b[key] as number)) / 100; // normiert 0..1
    return acc + diff * diff;
  }, 0);
  const distance = Math.sqrt(sumSq / DISTANCE_SCORE_KEYS.length); // 0..~1
  return 1 - Math.min(distance, 1); // 1 = identisch, 0 = maximal unaehnlich
}

/** Gewichtete Kombination aus Kontinent-Gleichheit, Kategorie-Overlap und Score-Naehe. */
function similarity(a: DestinationRow, b: DestinationRow): number {
  const continentMatch = a.continent === b.continent ? 1 : 0;
  const categoryOverlap = jaccardSimilarity(a.categories, b.categories);
  const scoreCloseness = euclideanSimilarity(a, b);
  return 0.4 * continentMatch + 0.4 * categoryOverlap + 0.2 * scoreCloseness;
}

function minMaxNormalize(values: number[]): (v: number) => number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  return (v: number) => (range === 0 ? 0.5 : (v - min) / range);
}

/**
 * MMR (Maximal Marginal Relevance): waehlt iterativ Kandidaten, die hohe
 * Relevanz MIT geringer Aehnlichkeit zu bereits gewaehlten Orten kombinieren.
 * Verhindert eine Shortlist aus mehreren fast identischen Orten.
 */
function selectDiverseShortlist(
  candidates: { destination: DestinationRow; score: number }[],
  size: number
): DestinationRow[] {
  if (candidates.length <= size) return candidates.map((c) => c.destination);

  const normalize = minMaxNormalize(candidates.map((c) => c.score));
  const remaining = [...candidates];
  const selected: DestinationRow[] = [];

  while (selected.length < size && remaining.length > 0) {
    let bestIdx = 0;
    let bestMmr = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const relevance = normalize(remaining[i].score);
      const maxSim =
        selected.length === 0
          ? 0
          : Math.max(...selected.map((s) => similarity(remaining[i].destination, s)));
      const mmr = MMR_LAMBDA * relevance - (1 - MMR_LAMBDA) * maxSim;
      if (mmr > bestMmr) {
        bestMmr = mmr;
        bestIdx = i;
      }
    }

    selected.push(remaining[bestIdx].destination);
    remaining.splice(bestIdx, 1);
  }

  return selected;
}

export interface ShortlistResult {
  shortlist: DestinationRow[];
  // Anzeige-Signal fuers Frontend-MatchBadge: total_score min-max-normalisiert
  // ueber den Kandidatenpool und auf das Band 75-98 abgebildet. Bewusst kein
  // "wissenschaftlicher" Wert - ein Nutzer soll nie "12 % Match" sehen, weil
  // alle Kandidaten die harten Filter ja bereits bestanden haben.
  matchScores: Map<string, number>;
}

const MATCH_BAND_MIN = 75;
const MATCH_BAND_MAX = 98;

/**
 * Orchestriert Phase 2: Verlaufs-Ausschluss -> Scoring -> gewichtetes
 * Sampling -> MMR-Diversitaet. Gibt die finale Shortlist (~15 Orte) fuer
 * den Claude-Prompt zurueck, plus normalisierte Match-Scores fuer die Anzeige.
 */
export async function scoreAndSelectShortlist(
  candidates: DestinationRow[],
  answers: Phase2Answers,
  userId: string
): Promise<ShortlistResult> {
  const alreadyShown = await getPreviouslyShownDestinationIds(userId);
  const fresh = candidates.filter((d) => !alreadyShown.has(d.id));

  // Falls der Verlaufs-Ausschluss den Pool zu stark ausduennt (z. B. Nutzer
  // hat in dieser engen Nische schon fast alles gesehen), lieber auf den
  // vollen Kandidatenpool zurueckfallen als eine winzige/leere Shortlist zu liefern.
  const pool = fresh.length >= SHORTLIST_SIZE ? fresh : candidates;

  const scored = pool.map((destination) => ({
    destination,
    score: computeTotalScore(destination, answers),
  }));

  // Match-Scores ueber den gesamten Pool normalisieren (nicht nur ueber die
  // Shortlist), damit die Werte zwischen zwei Anfragen vergleichbar bleiben.
  const values = scored.map((c) => c.score);
  const min = Math.min(...values);
  const range = Math.max(...values) - min;
  const matchScores = new Map<string, number>(
    scored.map((c) => [
      c.destination.id,
      range === 0
        ? Math.round((MATCH_BAND_MIN + MATCH_BAND_MAX) / 2)
        : Math.round(MATCH_BAND_MIN + ((c.score - min) / range) * (MATCH_BAND_MAX - MATCH_BAND_MIN)),
    ])
  );

  const temperature = explorationLevelToTemperature(answers.exploration_level);
  const sampled = weightedSampleWithoutReplacement(scored, (c) => c.score, temperature, SAMPLE_SIZE);

  return { shortlist: selectDiverseShortlist(sampled, SHORTLIST_SIZE), matchScores };
}
