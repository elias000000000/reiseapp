// Wire-Typen — Spiegel von docs/api-contract.md (Quelle der Wahrheit).
// Bei Aenderungen am Contract IMMER hier nachziehen.

export type BudgetLevel = "niedrig" | "mittel" | "gehoben" | "hoch";
export type PartyType = "solo" | "paar" | "familie" | "freunde";
export type ComfortZone = "sicher" | "ausgewogen" | "abenteuer";
export type CarPreference = "ja" | "wenn_noetig" | "auf_keinen_fall";

export interface TripRequestInput {
  origin_lat: number;
  origin_lng: number;
  origin_label: string;
  duration_days: number;
  travel_months: number[]; // leer = flexibel, nie null
  budget_level: BudgetLevel;
  party_type: PartyType;
  comfort_zone: ComfortZone;
  car_preference: CarPreference;
  axis_nature_city: number; // -100..100, 0 = neutral
  axis_activity_relax: number;
  axis_iconic_hidden: number;
  axis_luxury_authentic: number;
  axis_photogenic_importance: number | null; // 0..100 oder uebersprungen
  exploration_level: number; // 0..100
  // Kein Identitaetsfeld hier - die Nutzer-ID kommt aus dem verifizierten
  // Bearer-Token (siehe lib/api.ts), nie aus dem Body.
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
}

export interface RecommendationItem {
  rank: number;
  destination_id: string;
  name: string;
  reasoning: string;
  match_score?: number; // 75-98, optional -> Badge ausblenden wenn absent
}

export interface RecommendationResult {
  trip_request_id: string;
  recommendations: RecommendationItem[];
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  region: string | null;
  continent: string;
  categories: string[];
  description: string | null;
  highlights: string[];
  nature_score: number;
  photography_score: number;
  adventure_score: number;
  hiking_score: number;
  city_score: number;
  culture_score: number;
  beach_score: number;
  wildlife_score: number;
  nightlife_score: number;
  luxury_score: number;
  budget_score: number;
  tourist_density_score: number;
  wow_factor_score: number;
  best_months: number[];
  minimum_days: number;
  ideal_days: number;
  estimated_budget_level: BudgetLevel;
  flight_access_score: number;
  car_needed: boolean;
  solo_friendly: boolean;
  safety_score: number;
  trip_effort_score: number;
  season_flexibility_score: number;
  image_url: string | null;
  image_attribution: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NO_CANDIDATES"
  | "MISSING_IDS"
  | "NOT_FOUND"
  | "MISSING_QUERY"
  | "INTERNAL_ERROR";
