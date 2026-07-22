export type PlaceKind = "hotel" | "sight" | "food" | "transit" | "nature" | "note";

export interface Place {
  id: string;
  tripId: string;
  dayId?: string;
  kind: PlaceKind;
  name: string;
  lat?: number;
  lng?: number;
  address?: string;
  url?: string;
  imageUrl?: string;
  description?: string;
  sortOrder: number;
  meta?: Record<string, unknown>;
}

export interface TripDay {
  id: string;
  tripId: string;
  date: string; // YYYY-MM-DD
  baseCity?: string;
  notes?: string;
}

export interface Trip {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
  summary?: string;
  createdAt: string;
}

export interface DestinationSuggestion {
  name: string;
  country: string;
  region?: string;
  type: "city" | "village" | "region" | "nature" | "coast" | "mountain";
  matchScore: number;
  reason: string;
  bestSeason?: string;
  estDailyBudgetEur?: number;
  hiddenGem?: boolean;
  lat?: number;
  lng?: number;
  imageUrl?: string;
}

export interface SuggestionCriteria {
  vibe: ("city" | "nature" | "coast" | "mountain" | "culture" | "food" | "nightlife" | "quiet" | "adventure")[];
  climate: "warm" | "mild" | "cool" | "any";
  budgetPerDay: number; // EUR
  travelStyle: "solo" | "couple" | "family" | "friends";
  monthRange?: string;
  hiddenGemBias: boolean;
}

export interface UserProfile {
  setupDone: boolean;
  homeCity: string;
  homeLat?: number;
  homeLng?: number;
  currency: "EUR" | "CHF" | "USD" | "GBP";
  travelStyle: "solo" | "couple" | "family" | "friends";
  preferredTransport: "flight" | "train" | "car";
  maxTravelHours: number;
  lastSearch?: {
    vibe: SuggestionCriteria["vibe"];
    climate: SuggestionCriteria["climate"];
    budgetPerDay: number;
    hiddenGemBias: boolean;
  };
}
