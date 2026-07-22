// Konfiguration der 13 Onboarding-Schritte (screens.md S1-S13, Startort neu S1).
// Reihenfolge und Mapping sind verbindlich mit docs/api-contract.md abgestimmt.

import { Car, CarFront, Heart, Home, Mountain, Shield, Sparkles, User, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Answers } from "../../state/OnboardingContext";

interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: LucideIcon;
}

export interface OriginCity {
  label: string;
  lat: number;
  lng: number;
}

export type Step =
  | {
      kind: "origin";
      title: string;
      subtitle?: string;
      cities: OriginCity[];
    }
  | {
      kind: "select";
      field: "duration_days" | "budget_level" | "party_type" | "comfort_zone" | "car_preference";
      title: string;
      subtitle?: string;
      options: SelectOption[];
    }
  | { kind: "months"; title: string; subtitle?: string }
  | {
      kind: "axis";
      field: "axis_nature_city" | "axis_activity_relax" | "axis_iconic_hidden" | "axis_luxury_authentic";
      title: string;
      poleA: { label: string; image: string };
      poleB: { label: string; image: string };
    }
  | {
      kind: "slider";
      field: "axis_photogenic_importance" | "exploration_level";
      title: string;
      subtitle?: string;
      poles: [string, string];
      skippable?: boolean;
      submitLabel?: string;
    };

export const STEPS: Step[] = [
  {
    kind: "origin",
    title: "Wo startest du?",
    subtitle: "Deine Zeit reicht nicht überallhin — das berücksichtige ich gleich mit.",
    cities: [
      { label: "Zürich", lat: 47.3769, lng: 8.5417 },
      { label: "Basel", lat: 47.5596, lng: 7.5886 },
      { label: "Genf", lat: 46.2044, lng: 6.1432 },
    ],
  },
  {
    kind: "select",
    field: "duration_days",
    title: "Wie viel Zeit hast du?",
    options: [
      { value: 4, label: "3–4 Tage", sublabel: "Kurz & intensiv" },
      { value: 7, label: "5–7 Tage", sublabel: "Eine gute Woche" },
      { value: 14, label: "8–14 Tage", sublabel: "Richtig eintauchen" },
      { value: 21, label: "Länger", sublabel: "Zeit spielt keine Rolle" },
    ],
  },
  {
    kind: "months",
    title: "Wann soll es losgehen?",
    subtitle: "Wähle einen oder mehrere Monate.",
  },
  {
    kind: "select",
    field: "budget_level",
    title: "Wie viel darf ein Tag kosten?",
    options: [
      { value: "niedrig", label: "€ · Günstig unterwegs" },
      { value: "mittel", label: "€€ · Solide Mitte" },
      { value: "gehoben", label: "€€€ · Gerne komfortabel" },
      { value: "hoch", label: "€€€€ · Nach oben offen" },
    ],
  },
  {
    kind: "select",
    field: "party_type",
    title: "Wer reist mit?",
    options: [
      { value: "solo", label: "Allein", icon: User },
      { value: "paar", label: "Zu zweit", icon: Heart },
      { value: "familie", label: "Familie", icon: Home },
      { value: "freunde", label: "Freunde", icon: Users },
    ],
  },
  {
    kind: "select",
    field: "comfort_zone",
    title: "Wie abenteuerlustig darf's werden?",
    options: [
      { value: "sicher", label: "Sicher & entspannt", sublabel: "Ich will ankommen und genießen", icon: Shield },
      { value: "ausgewogen", label: "Offen für mehr", sublabel: "Wenn es sich wirklich lohnt", icon: Sparkles },
      { value: "abenteuer", label: "Je unberührter, desto besser", sublabel: "Ich suche das Abenteuer", icon: Mountain },
    ],
  },
  {
    kind: "select",
    field: "car_preference",
    title: "Würdest du vor Ort selbst fahren?",
    options: [
      { value: "ja", label: "Ja, gerne", icon: Car },
      { value: "wenn_noetig", label: "Wenn nötig", icon: CarFront },
      { value: "auf_keinen_fall", label: "Lieber nicht", icon: X },
    ],
  },
  {
    kind: "axis",
    field: "axis_nature_city",
    title: "Was zieht dich mehr an?",
    poleA: { label: "Natur & Landschaft", image: "/images/pole-nature.jpg" },
    poleB: { label: "Stadt & Kultur", image: "/images/pole-city.jpg" },
  },
  {
    kind: "axis",
    field: "axis_activity_relax",
    title: "Wie soll sich die Reise anfühlen?",
    poleA: { label: "Aktiv & fordernd", image: "/images/pole-active.jpg" },
    poleB: { label: "Ruhig & genießend", image: "/images/pole-relax.jpg" },
  },
  {
    kind: "axis",
    field: "axis_iconic_hidden",
    title: "Welche Orte reizen dich?",
    poleA: { label: "Ikonische Highlights", image: "/images/pole-iconic.jpg" },
    poleB: { label: "Abseits des Trubels", image: "/images/pole-hidden.jpg" },
  },
  {
    kind: "axis",
    field: "axis_luxury_authentic",
    title: "Wie willst du wohnen & reisen?",
    poleA: { label: "Stilvoller Komfort", image: "/images/pole-luxury.jpg" },
    poleB: { label: "Einfach & authentisch", image: "/images/pole-authentic.jpg" },
  },
  {
    kind: "slider",
    field: "axis_photogenic_importance",
    title: "Wie wichtig sind dir Postkarten-Momente?",
    subtitle: "Orte, an denen jede Ecke ein Foto wert ist.",
    poles: ["Nebensache", "Sehr wichtig"],
    skippable: true,
  },
  {
    kind: "slider",
    field: "exploration_level",
    title: "Wie mutig darf dein Reiseberater sein?",
    subtitle: "Sichere Treffer — oder auch mal eine Überraschung?",
    poles: ["Sichere Treffer", "Überrasch mich"],
    submitLabel: "Empfehlungen finden",
  },
];

export const TOTAL_STEPS = STEPS.length;

/** Aktueller Antwortwert eines Steps (fuer Vorbelegung beim Zurueckgehen). */
export function stepValue(step: Step, answers: Answers): unknown {
  if (step.kind === "months") return answers.travel_months;
  if (step.kind === "origin") return answers.origin_label;
  return answers[step.field];
}
