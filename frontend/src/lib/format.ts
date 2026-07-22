// Anzeige-Formatierung: Monate, Budget-Symbole, Aufwands-Baender.

import type { BudgetLevel } from "./types";

const MONTHS_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export function monthShort(m: number): string {
  return MONTHS_SHORT[m - 1] ?? "";
}

/**
 * Komprimiert best_months zu einem lesbaren Label: [6,7,8,9] -> "Jun–Sep",
 * Jahreswechsel [11,12,1,2] -> "Nov–Feb", Einzelfenster kombiniert:
 * [2,3,6,7,8] -> "Feb–Mär · Jun–Aug". Ganzjahr -> "Ganzjährig".
 */
export function monthsLabel(months: number[]): string {
  if (months.length === 0) return "Flexibel";
  if (months.length >= 12) return "Ganzjährig";

  const sorted = [...new Set(months)].sort((a, b) => a - b);
  // Zusammenhaengende Bereiche finden (zyklisch: Dez->Jan zaehlt als Nachbar)
  const ranges: number[][] = [];
  let current: number[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) current.push(sorted[i]);
    else {
      ranges.push(current);
      current = [sorted[i]];
    }
  }
  ranges.push(current);

  // Jahreswechsel: endet ein Bereich bei 12 und beginnt einer bei 1 -> mergen
  if (ranges.length > 1 && ranges[0][0] === 1 && ranges[ranges.length - 1].at(-1) === 12) {
    const wrapped = ranges.pop()!;
    ranges[0] = [...wrapped, ...ranges[0]];
  }

  return ranges
    .map((r) =>
      r.length === 1 ? monthShort(r[0]) : `${monthShort(r[0])}–${monthShort(r.at(-1)!)}`
    )
    .join(" · ");
}

export function budgetSymbol(level: BudgetLevel): string {
  return { niedrig: "€", mittel: "€€", gehoben: "€€€", hoch: "€€€€" }[level];
}

export function effortLabel(tripEffortScore: number): string {
  if (tripEffortScore <= 45) return "Entspannt";
  if (tripEffortScore <= 75) return "Moderat";
  return "Expedition";
}

export function durationLabel(minimumDays: number, idealDays: number): string {
  return minimumDays === idealDays ? `${idealDays} Tage` : `${minimumDays}–${idealDays} Tage`;
}
