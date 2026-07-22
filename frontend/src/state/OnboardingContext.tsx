// Onboarding-Antworten: Context + sessionStorage-Hydration.
// Achsen haben Defaults (0 = neutral), Phase-1-Felder sind bis zur Antwort null.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadAnswers, saveAnswers } from "../lib/storage";
import type {
  BudgetLevel, CarPreference, ComfortZone, PartyType, TripRequestInput,
} from "../lib/types";

export interface Answers {
  // Startort: alle drei zusammen gesetzt/ungesetzt (origin_label als Leitwert)
  origin_lat: number | null;
  origin_lng: number | null;
  origin_label: string | null;
  duration_days: number | null;
  travel_months: number[] | null; // null = unbeantwortet, [] = "flexibel"
  budget_level: BudgetLevel | null;
  party_type: PartyType | null;
  comfort_zone: ComfortZone | null;
  car_preference: CarPreference | null;
  axis_nature_city: number;
  axis_activity_relax: number;
  axis_iconic_hidden: number;
  axis_luxury_authentic: number;
  axis_photogenic_importance: number | null;
  exploration_level: number;
}

export const DEFAULT_ANSWERS: Answers = {
  origin_lat: null,
  origin_lng: null,
  origin_label: null,
  duration_days: null,
  travel_months: null,
  budget_level: null,
  party_type: null,
  comfort_zone: null,
  car_preference: null,
  axis_nature_city: 0,
  axis_activity_relax: 0,
  axis_iconic_hidden: 0,
  axis_luxury_authentic: 0,
  axis_photogenic_importance: null,
  exploration_level: 50,
};

interface OnboardingContextValue {
  answers: Answers;
  setAnswer: <K extends keyof Answers>(key: K, value: Answers[K]) => void;
  reset: () => void;
  /** Erste unbeantwortete Phase-1-Frage (1-basiert) oder null wenn komplett. */
  firstMissingStep: number | null;
  /** Wirft, wenn Phase 1 unvollstaendig — vorher firstMissingStep pruefen. */
  buildPayload: () => TripRequestInput;
}

const Ctx = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<Answers>(
    () => ({ ...DEFAULT_ANSWERS, ...(loadAnswers<Partial<Answers>>() ?? {}) })
  );

  useEffect(() => {
    saveAnswers(answers);
  }, [answers]);

  const value = useMemo<OnboardingContextValue>(() => {
    // origin_label ist der Leitwert fuer den Startort-Schritt (S1); lat/lng
    // werden immer gemeinsam mit ihm gesetzt (siehe steps.tsx).
    const phase1Fields: (keyof Answers)[] = [
      "origin_label", "duration_days", "travel_months", "budget_level",
      "party_type", "comfort_zone", "car_preference",
    ];
    const missingIdx = phase1Fields.findIndex((f) => answers[f] === null);

    return {
      answers,
      setAnswer: (key, v) => setAnswers((prev) => ({ ...prev, [key]: v })),
      reset: () => setAnswers(DEFAULT_ANSWERS),
      firstMissingStep: missingIdx === -1 ? null : missingIdx + 1,
      buildPayload: () => {
        if (missingIdx !== -1) throw new Error("Phase 1 unvollstaendig");
        return {
          origin_lat: answers.origin_lat!,
          origin_lng: answers.origin_lng!,
          origin_label: answers.origin_label!,
          duration_days: answers.duration_days!,
          travel_months: answers.travel_months ?? [],
          budget_level: answers.budget_level!,
          party_type: answers.party_type!,
          comfort_zone: answers.comfort_zone!,
          car_preference: answers.car_preference!,
          axis_nature_city: answers.axis_nature_city,
          axis_activity_relax: answers.axis_activity_relax,
          axis_iconic_hidden: answers.axis_iconic_hidden,
          axis_luxury_authentic: answers.axis_luxury_authentic,
          axis_photogenic_importance: answers.axis_photogenic_importance,
          exploration_level: answers.exploration_level,
        };
      },
    };
  }, [answers]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOnboarding ausserhalb des OnboardingProvider");
  return ctx;
}
