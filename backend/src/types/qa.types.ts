// Zod-Schemas fuer den 11-Fragen-Katalog (Phase 1: harte Filter, Phase 2:
// Geschmacks-Achsen). Einzige Quelle der Wahrheit fuer Validierung -
// wird von Route und Services importiert, nicht dupliziert.

import { z } from "zod";

// --- Phase 1: harte Filter -------------------------------------------------

export const PartyTypeSchema = z.enum(["solo", "paar", "familie", "freunde"]);
export type PartyType = z.infer<typeof PartyTypeSchema>;

export const ComfortZoneSchema = z.enum(["sicher", "ausgewogen", "abenteuer"]);
export type ComfortZone = z.infer<typeof ComfortZoneSchema>;

export const CarPreferenceSchema = z.enum(["ja", "wenn_noetig", "auf_keinen_fall"]);
export type CarPreference = z.infer<typeof CarPreferenceSchema>;

export const BudgetLevelSchema = z.enum(["niedrig", "mittel", "gehoben", "hoch"]);
export type BudgetLevel = z.infer<typeof BudgetLevelSchema>;

// z.coerce.number() statt z.number(): HTML-Range-/Number-Inputs liefern oft
// Strings (z. B. "7" statt 7) - coerce toleriert das, statt hart mit 400
// abzulehnen. Siehe docs/api-contract.md.
export const Phase1Schema = z.object({
  // Startort: feste Staedte haben hinterlegte Koordinaten, "Andere Stadt"
  // wird ueber GET /geocode aufgeloest, bevor der Request abgeschickt wird.
  origin_lat: z.coerce.number().min(-90).max(90),
  origin_lng: z.coerce.number().min(-180).max(180),
  origin_label: z.string().min(1),
  duration_days: z.coerce.number().int().positive(),
  // Leeres Array = "ich bin flexibel", sonst Monatszahlen 1-12
  travel_months: z.array(z.coerce.number().int().min(1).max(12)).default([]),
  budget_level: BudgetLevelSchema,
  party_type: PartyTypeSchema,
  comfort_zone: ComfortZoneSchema,
  car_preference: CarPreferenceSchema,
});
export type Phase1Answers = z.infer<typeof Phase1Schema>;

// --- Phase 2: Geschmacks-Achsen (bipolar, -100..100, 0 = neutral) ----------

const axisSlider = z.coerce.number().int().min(-100).max(100).default(0);

export const Phase2Schema = z.object({
  axis_nature_city: axisSlider,
  axis_activity_relax: axisSlider,
  axis_iconic_hidden: axisSlider,
  axis_luxury_authentic: axisSlider,
  // Feintuning, ueberspringbar - null/undefined = keine Gewichtung
  axis_photogenic_importance: z.coerce.number().int().min(0).max(100).nullable().default(null),
  // Steuert den Sampling-Grad: 0 = sicherste Treffer, 100 = experimentierfreudig
  exploration_level: z.coerce.number().int().min(0).max(100).default(50),
});
export type Phase2Answers = z.infer<typeof Phase2Schema>;

// --- Gesamte Anfrage --------------------------------------------------------

// Die Nutzer-Identitaet kommt NIE aus dem Body (frueher user_key, spoofbar),
// sondern ausschliesslich aus dem per Bearer-Token verifizierten req.userId
// (middleware/auth.ts). TripRequestInput enthaelt bewusst kein Identitaetsfeld.
export const TripRequestInputSchema = Phase1Schema.merge(Phase2Schema);
export type TripRequestInput = z.infer<typeof TripRequestInputSchema>;

// --- Ergebnis ----------------------------------------------------------------

export const RecommendationItemSchema = z.object({
  destination_id: z.string(),
  reasoning: z.string(),
});
export type RecommendationItem = z.infer<typeof RecommendationItemSchema>;

// Was Claude als JSON liefern soll. Nur strukturell geprueft (>=1, <=10) -
// die eigentliche Ziel-Untergrenze (5, oder weniger bei kleiner Shortlist)
// wird dynamisch ueber den Tool-Aufruf in recommend.service.ts gesteuert.
export const ClaudeRecommendationResponseSchema = z.object({
  recommendations: z.array(RecommendationItemSchema).min(1).max(10),
});
export type ClaudeRecommendationResponse = z.infer<typeof ClaudeRecommendationResponseSchema>;

// Was die Route zurueckgibt (angereichert mit Name + Rank)
export const RecommendationResultSchema = z.object({
  trip_request_id: z.string(),
  recommendations: z.array(
    z.object({
      rank: z.number().int().positive(),
      destination_id: z.string(),
      name: z.string(),
      reasoning: z.string(),
      // Anzeige-Signal fuers MatchBadge (75-98), normalisiert aus dem
      // internen total_score - kein wissenschaftlicher Wert. Optional:
      // fehlt er, blendet das Frontend das Badge aus.
      match_score: z.number().int().optional(),
    })
  ),
});
export type RecommendationResult = z.infer<typeof RecommendationResultSchema>;

// --- Destination (Teilmenge der Supabase-Zeile, die die Services brauchen) --

export const DestinationRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  region: z.string().nullable(),
  continent: z.string(),
  categories: z.array(z.string()),
  description: z.string().nullable(),
  highlights: z.array(z.string()),
  nature_score: z.number(),
  photography_score: z.number(),
  adventure_score: z.number(),
  hiking_score: z.number(),
  city_score: z.number(),
  culture_score: z.number(),
  beach_score: z.number(),
  wildlife_score: z.number(),
  nightlife_score: z.number(),
  luxury_score: z.number(),
  budget_score: z.number(),
  tourist_density_score: z.number(),
  wow_factor_score: z.number(),
  best_months: z.array(z.number()),
  minimum_days: z.number(),
  ideal_days: z.number(),
  estimated_budget_level: BudgetLevelSchema,
  flight_access_score: z.number(),
  car_needed: z.boolean(),
  solo_friendly: z.boolean(),
  safety_score: z.number(),
  trip_effort_score: z.number(),
  season_flexibility_score: z.number(),
  // Bild-Pipeline (Migration 003): nullable, Frontend hat Kategorie-Fallback
  image_url: z.string().nullable().default(null),
  image_attribution: z.string().nullable().default(null),
  // Geodaten (Migration 005): nullable, Distanzfilter greift nur bei Treffer
  latitude: z.number().nullable().default(null),
  longitude: z.number().nullable().default(null),
});
export type DestinationRow = z.infer<typeof DestinationRowSchema>;
