import type { DestinationSuggestion, SuggestionCriteria } from "./types";

/**
 * Handgemachte, realistische Vorschläge — funktioniert ohne API-Key.
 * Sobald ANTHROPIC_API_KEY gesetzt ist, übernimmt lib/claude.ts.
 */
const POOL: DestinationSuggestion[] = [
  {
    name: "Hvar",
    country: "Kroatien",
    region: "Dalmatien",
    type: "coast",
    matchScore: 0,
    reason: "Lavendelfelder, abgelegene Buchten, sehr gutes Essen — und in der Vor-/Nachsaison fast leer.",
    bestSeason: "Mai – Juni, September",
    estDailyBudgetEur: 110,
    hiddenGem: false,
    lat: 43.1729, lng: 16.4413,
    imageUrl: "https://picsum.photos/seed/hvardalmatia/1200/800",
  },
  {
    name: "Annecy",
    country: "Frankreich",
    region: "Auvergne-Rhône-Alpes",
    type: "city",
    matchScore: 0,
    reason: "Kristallklarer Bergsee, Altstadt mit Kanälen, in 90 Min von Genf — perfekt für Stadt + Natur ohne Auto.",
    bestSeason: "Juni – September",
    estDailyBudgetEur: 130,
    hiddenGem: false,
    lat: 45.8992, lng: 6.1294,
    imageUrl: "https://picsum.photos/seed/annecylake/1200/800",
  },
  {
    name: "Matera",
    country: "Italien",
    region: "Basilikata",
    type: "city",
    matchScore: 0,
    reason: "9000 Jahre alte Höhlenstadt aus Kalkstein. Wenige Touristen außerhalb der Sommerferien, surreale Atmosphäre nachts.",
    bestSeason: "April – Mai, Oktober",
    estDailyBudgetEur: 95,
    hiddenGem: true,
    lat: 40.6664, lng: 16.6043,
    imageUrl: "https://picsum.photos/seed/materasassi/1200/800",
  },
  {
    name: "Lofoten",
    country: "Norwegen",
    region: "Nordnorwegen",
    type: "nature",
    matchScore: 0,
    reason: "Granitberge stürzen ins Meer. Im Sommer Mitternachtssonne, im Winter Polarlichter. Teuer, aber landschaftlich konkurrenzlos.",
    bestSeason: "Juni – August, Februar",
    estDailyBudgetEur: 180,
    hiddenGem: false,
    lat: 68.1500, lng: 13.6000,
    imageUrl: "https://picsum.photos/seed/lofotennorway/1200/800",
  },
  {
    name: "Gent",
    country: "Belgien",
    region: "Flandern",
    type: "city",
    matchScore: 0,
    reason: "Brügges schönere, lebendigere Schwester — mittelalterliche Altstadt, exzellente vegetarische Küche, Studentenenergie.",
    bestSeason: "April – Oktober",
    estDailyBudgetEur: 115,
    hiddenGem: true,
    lat: 51.0543, lng: 3.7174,
    imageUrl: "https://picsum.photos/seed/gentbelgium/1200/800",
  },
  {
    name: "Madeira",
    country: "Portugal",
    region: "Atlantik",
    type: "nature",
    matchScore: 0,
    reason: "Subtropisches Klima das ganze Jahr, Wanderungen entlang historischer Wasserkanäle (Levadas), kaum überlaufen.",
    bestSeason: "ganzjährig",
    estDailyBudgetEur: 100,
    hiddenGem: false,
    lat: 32.7607, lng: -16.9595,
    imageUrl: "https://picsum.photos/seed/madeiralevada/1200/800",
  },
  {
    name: "Český Krumlov",
    country: "Tschechien",
    region: "Südböhmen",
    type: "village",
    matchScore: 0,
    reason: "Mittelalterliche Altstadt um eine Moldau-Schleife, ein riesiges Renaissance-Schloss. Tagesausflug von Wien oder Prag.",
    bestSeason: "Mai – Juni, September",
    estDailyBudgetEur: 75,
    hiddenGem: true,
    lat: 48.8127, lng: 14.3175,
    imageUrl: "https://picsum.photos/seed/krumlovcastle/1200/800",
  },
  {
    name: "Sintra",
    country: "Portugal",
    region: "Großraum Lissabon",
    type: "city",
    matchScore: 0,
    reason: "Verwunschene Paläste in nebligen Wäldern, 30 Min von Lissabon. Früh anreisen, bei Sonnenuntergang weg von den Bussen.",
    bestSeason: "März – Juni, September – November",
    estDailyBudgetEur: 105,
    hiddenGem: false,
    lat: 38.8029, lng: -9.3817,
    imageUrl: "https://picsum.photos/seed/sintrapalace/1200/800",
  },
  {
    name: "Tiroler Zillertal",
    country: "Österreich",
    region: "Tirol",
    type: "mountain",
    matchScore: 0,
    reason: "Hochalpentäler, gute Bahnverbindung, Hütten mit ehrlichem Essen. Perfekt für Wanderer ohne Auto.",
    bestSeason: "Juni – September",
    estDailyBudgetEur: 120,
    hiddenGem: false,
    lat: 47.2167, lng: 11.8833,
    imageUrl: "https://picsum.photos/seed/zillertaltirol/1200/800",
  },
  {
    name: "Comporta",
    country: "Portugal",
    region: "Alentejo",
    type: "coast",
    matchScore: 0,
    reason: "60 km feiner Sandstrand südlich von Lissabon, Reisfelder, Strandkneipen, ohne Massentourismus.",
    bestSeason: "Mai – September",
    estDailyBudgetEur: 130,
    hiddenGem: true,
    lat: 38.3833, lng: -8.7833,
    imageUrl: "https://picsum.photos/seed/comportabeach/1200/800",
  },
];

function score(d: DestinationSuggestion, c: SuggestionCriteria): number {
  let s = 50;

  // Vibe-Match
  const vibeMap: Record<string, string[]> = {
    coast: ["coast"],
    nature: ["nature", "mountain", "coast"],
    mountain: ["mountain"],
    city: ["city", "village"],
    culture: ["city", "village"],
    food: ["city", "village", "coast"],
    nightlife: ["city"],
    quiet: ["village", "nature", "mountain"],
    adventure: ["mountain", "nature"],
  };
  for (const v of c.vibe) {
    if (vibeMap[v]?.includes(d.type)) s += 10;
  }

  // Budget-Match
  if (d.estDailyBudgetEur) {
    const diff = Math.abs(d.estDailyBudgetEur - c.budgetPerDay);
    s += Math.max(-25, 15 - diff / 5);
  }

  // Hidden-Gem-Bias
  if (c.hiddenGemBias && d.hiddenGem) s += 12;

  // Klima — sehr grob anhand Breitengrad
  if (d.lat) {
    if (c.climate === "warm" && d.lat < 45) s += 8;
    if (c.climate === "cool" && d.lat > 55) s += 8;
    if (c.climate === "mild" && d.lat >= 45 && d.lat <= 55) s += 5;
  }

  // Reise-Stil — leichter Bias
  if (c.travelStyle === "family" && d.type === "city") s += 3;
  if (c.travelStyle === "couple" && (d.type === "village" || d.type === "coast")) s += 4;
  if (c.travelStyle === "solo" && d.type === "city") s += 3;

  return Math.max(0, Math.min(100, Math.round(s)));
}

export function mockSuggestDestinations(c: SuggestionCriteria): DestinationSuggestion[] {
  const scored = POOL.map((d) => ({ ...d, matchScore: score(d, c) }));
  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored.slice(0, 6);
}
