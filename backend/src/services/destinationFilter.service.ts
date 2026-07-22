// Phase 1: harte Filter per SQL. Guenstig und schnell, kein API-Call.
// Reduziert die 300 Orte auf einen Kandidatenpool von ~30-50, bevor
// scoring.service.ts die Geschmacks-Gewichtung (Phase 2) anwendet.
//
// Schwellenwerte fuer comfort_zone stammen aus scoring_rules.md /
// dem gemeinsam entworfenen Fragenkatalog (Frage 5, Phase 1).
//
// Der Distanz-/Machbarkeits-Filter (Origin -> Destination) laeuft bewusst
// NICHT in SQL, sondern in JS auf dem bereits durch die anderen Kriterien
// verkleinerten Kandidatenpool - gleiches Muster wie das Phase-2-Scoring.

import { supabase } from "../config/supabaseClient.js";
import type { DestinationRow, Phase1Answers } from "../types/qa.types.js";
import { DestinationRowSchema } from "../types/qa.types.js";

const COMFORT_ZONE_THRESHOLDS: Record<Phase1Answers["comfort_zone"], { minSafety: number; maxEffort: number }> = {
  sicher: { minSafety: 85, maxEffort: 45 },
  ausgewogen: { minSafety: 70, maxEffort: 75 },
  abenteuer: { minSafety: 55, maxEffort: 100 },
};

// Distanzband -> zusaetzliche Mindesttage, kombiniert mit destination.minimum_days
// (das Maximum der beiden gilt). Heuristik, kein echter Flugsuche-Abgleich -
// bildet grob ab, dass ein Langstreckenflug allein schon 1-2 Tage "kostet"
// und sich fuer eine kurze Reise nicht lohnt.
const DISTANCE_BANDS: { maxKm: number; minDays: number }[] = [
  { maxKm: 1500, minDays: 2 },
  { maxKm: 6000, minDays: 5 },
  { maxKm: Infinity, minDays: 8 },
];

const EARTH_RADIUS_KM = 6371;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function distanceRequiredDays(km: number): number {
  return DISTANCE_BANDS.find((b) => km <= b.maxKm)!.minDays;
}

// Exportiert, damit routes/destinations.route.ts dieselben Spalten nutzt
// statt sie zu duplizieren.
export const DESTINATION_COLUMNS = [
  "id", "name", "country", "region", "continent", "categories",
  "description", "highlights",
  "nature_score", "photography_score", "adventure_score", "hiking_score",
  "city_score", "culture_score", "beach_score", "wildlife_score",
  "nightlife_score", "luxury_score", "budget_score", "tourist_density_score",
  "wow_factor_score",
  "best_months", "minimum_days", "ideal_days", "estimated_budget_level",
  "flight_access_score", "car_needed", "solo_friendly", "safety_score",
  "trip_effort_score", "season_flexibility_score",
  "image_url", "image_attribution", "latitude", "longitude",
].join(", ");

/**
 * Filtert die destinations-Tabelle nach den 6 harten Phase-1-Kriterien.
 * Wirft bei einem Supabase-Fehler; ruft die Route/den Service-Aufrufer auf,
 * das entsprechend zu behandeln.
 */
export async function filterDestinations(answers: Phase1Answers): Promise<DestinationRow[]> {
  const { minSafety, maxEffort } = COMFORT_ZONE_THRESHOLDS[answers.comfort_zone];

  let query = supabase
    .from("destinations")
    .select(DESTINATION_COLUMNS)
    .lte("minimum_days", answers.duration_days)
    .eq("estimated_budget_level", answers.budget_level)
    .gte("safety_score", minSafety)
    .lte("trip_effort_score", maxEffort);

  // Leeres travel_months-Array = "ich bin flexibel" -> kein Saison-Filter
  if (answers.travel_months.length > 0) {
    query = query.overlaps("best_months", answers.travel_months);
  }

  // Nur "auf keinen Fall" filtert hart; die anderen Antworten schliessen
  // nichts aus, da viele Reisende sich spontan doch fuers Fahren entscheiden.
  if (answers.car_preference === "auf_keinen_fall") {
    query = query.eq("car_needed", false);
  }

  // Nur solo schraenkt ein; andere Reiseformen filtern nicht auf solo_friendly.
  if (answers.party_type === "solo") {
    query = query.eq("solo_friendly", true);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Phase-1-Filter fehlgeschlagen: ${error.message}`);
  }

  const rows = (data ?? []).map((row) => DestinationRowSchema.parse(row));

  // Distanz-/Machbarkeits-Filter: nur anwendbar, wenn der Ort Koordinaten hat
  // (Migration 005, per fetch_coordinates.js befuellt). Ohne Koordinaten kein
  // Ausschluss - graceful degradation wie bei fehlenden Bildern.
  return rows.filter((d) => {
    if (d.latitude === null || d.longitude === null) return true;
    const km = haversineKm(answers.origin_lat, answers.origin_lng, d.latitude, d.longitude);
    return answers.duration_days >= Math.max(d.minimum_days, distanceRequiredDays(km));
  });
}
