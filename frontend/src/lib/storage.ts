// Persistenz-Schicht (docs/design/screens.md, Navigationsmodell):
// - Nutzer-Identitaet: Supabase-Auth-Session (state/AuthContext.tsx), nicht hier
// - Onboarding-Antworten: sessionStorage (Reload-sicher, aber pro Sitzung)
// - letztes Ergebnis: localStorage (App-Start springt direkt zu /results)

import type { RecommendationResult } from "./types";

const ANSWERS_KEY = "reiseapp_answers";
const RESULT_KEY = "reiseapp_last_result";

export function saveAnswers(answers: unknown): void {
  sessionStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
}

export function loadAnswers<T>(): T | null {
  const raw = sessionStorage.getItem(ANSWERS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export interface StoredResult {
  result: RecommendationResult;
  savedAt: string; // ISO
}

export function saveResult(result: RecommendationResult): void {
  const stored: StoredResult = { result, savedAt: new Date().toISOString() };
  localStorage.setItem(RESULT_KEY, JSON.stringify(stored));
}

export function loadResult(): StoredResult | null {
  const raw = localStorage.getItem(RESULT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredResult;
  } catch {
    return null;
  }
}
