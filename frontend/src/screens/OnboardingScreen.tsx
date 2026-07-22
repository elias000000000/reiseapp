// Onboarding-Shell (S1-S12): rendert den jeweiligen Schritt aus steps.tsx.
// Single-Choice: Auto-Advance nach Bestaetigung (220ms) — kein Weiter-Button.
// Multi-Select/Slider: expliziter Weiter-Button in der Daumenzone.

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Screen } from "../components/Screen";
import { AppHeader } from "../components/AppHeader";
import { ProgressSegments } from "../components/ProgressSegments";
import { SelectCard } from "../components/SelectCard";
import { MonthGrid } from "../components/MonthGrid";
import { AxisSlider } from "../components/AxisSlider";
import { TextInput } from "../components/TextInput";
import { Button } from "../components/Button";
import { useOnboarding } from "../state/OnboardingContext";
import { STEPS, TOTAL_STEPS, type Step } from "./onboarding/steps";
import { geocode, ApiRequestError } from "../lib/api";
import type { BudgetLevel, CarPreference, ComfortZone, PartyType } from "../lib/types";

const ADVANCE_DELAY = 300;

export function OnboardingScreen() {
  const { step: stepParam } = useParams();
  const navigate = useNavigate();
  const { answers, setAnswer, firstMissingStep, buildPayload } = useOnboarding();
  const advanceTimer = useRef<number | null>(null);
  // Slider-Anzeige-Wert fuer den Photogenitaets-Schritt (null = noch nichts bewegt)
  const [photoDraft, setPhotoDraft] = useState<number | null>(null);
  // "Andere Stadt"-Unterzustand im Startort-Schritt
  const [customCityMode, setCustomCityMode] = useState(false);
  const [customCityQuery, setCustomCityQuery] = useState("");
  const [customCityLoading, setCustomCityLoading] = useState(false);
  const [customCityError, setCustomCityError] = useState<string | null>(null);

  const stepIndex = Number(stepParam) - 1;
  const step: Step | undefined = STEPS[stepIndex];

  useEffect(() => {
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  if (!step || Number.isNaN(stepIndex)) {
    navigate("/onboarding/1", { replace: true });
    return null;
  }

  const goNext = () => {
    if (stepIndex + 1 < TOTAL_STEPS) navigate(`/onboarding/${stepIndex + 2}`);
    else submit();
  };

  const goBack = () => {
    if (stepIndex === 0) navigate("/");
    else navigate(`/onboarding/${stepIndex}`);
  };

  function submit() {
    if (firstMissingStep !== null) {
      navigate(`/onboarding/${firstMissingStep}`);
      return;
    }
    void buildPayload; // Payload wird im LoadingScreen gebaut
    navigate("/loading");
  }

  function applySelect(field: Extract<Step, { kind: "select" }>["field"], value: string | number) {
    // Feld-spezifisch setzen, damit die Typen sauber bleiben
    switch (field) {
      case "duration_days":
        setAnswer("duration_days", value as number);
        break;
      case "budget_level":
        setAnswer("budget_level", value as BudgetLevel);
        break;
      case "party_type":
        setAnswer("party_type", value as PartyType);
        break;
      case "comfort_zone":
        setAnswer("comfort_zone", value as ComfortZone);
        break;
      case "car_preference":
        setAnswer("car_preference", value as CarPreference);
        break;
    }
    advanceTimer.current = window.setTimeout(goNext, ADVANCE_DELAY);
  }

  function selectCity(label: string, lat: number, lng: number) {
    setAnswer("origin_label", label);
    setAnswer("origin_lat", lat);
    setAnswer("origin_lng", lng);
    advanceTimer.current = window.setTimeout(goNext, ADVANCE_DELAY);
  }

  async function submitCustomCity() {
    if (customCityQuery.trim() === "") return;
    setCustomCityLoading(true);
    setCustomCityError(null);
    try {
      const result = await geocode(customCityQuery.trim());
      setCustomCityLoading(false);
      selectCity(result.label, result.lat, result.lng);
    } catch (e) {
      setCustomCityLoading(false);
      setCustomCityError(
        e instanceof ApiRequestError ? e.message : "Ort konnte nicht gefunden werden."
      );
    }
  }

  function renderBody() {
    switch (step!.kind) {
      case "origin": {
        const s = step as Extract<Step, { kind: "origin" }>;
        if (!customCityMode) {
          return (
            <div className="flex flex-col gap-3">
              {s.cities.map((c) => (
                <SelectCard
                  key={c.label}
                  label={c.label}
                  selected={answers.origin_label === c.label}
                  onSelect={() => selectCity(c.label, c.lat, c.lng)}
                />
              ))}
              <SelectCard
                label="Andere Stadt"
                selected={false}
                onSelect={() => setCustomCityMode(true)}
              />
            </div>
          );
        }
        return (
          <>
            <div className="flex flex-col gap-3">
              <TextInput
                placeholder="Stadt eingeben"
                autoFocus
                value={customCityQuery}
                onChange={(e) => setCustomCityQuery(e.target.value)}
                error={customCityError ?? undefined}
              />
            </div>
            <div className="pb-safe fixed inset-x-0 bottom-0 mx-auto flex max-w-[480px] flex-col gap-2 px-5 pt-3">
              <Button onClick={submitCustomCity} disabled={customCityLoading || customCityQuery.trim() === ""}>
                {customCityLoading ? "Suche …" : "Weiter"}
              </Button>
              <Button variant="quiet" onClick={() => setCustomCityMode(false)}>
                Zurück zur Auswahl
              </Button>
            </div>
          </>
        );
      }
      case "select": {
        const s = step as Extract<Step, { kind: "select" }>;
        const current = answers[s.field];
        return (
          <div className="flex flex-col gap-3">
            {s.options.map((opt) => (
              <SelectCard
                key={String(opt.value)}
                label={opt.label}
                sublabel={opt.sublabel}
                icon={opt.icon}
                selected={current === opt.value}
                onSelect={() => applySelect(s.field, opt.value)}
              />
            ))}
          </div>
        );
      }
      case "months":
        return (
          <>
            <MonthGrid value={answers.travel_months} onChange={(v) => setAnswer("travel_months", v)} />
            <div className="pb-safe fixed inset-x-0 bottom-0 mx-auto max-w-[480px] px-5 pt-3">
              <Button onClick={goNext} disabled={answers.travel_months === null}>
                Weiter
              </Button>
            </div>
          </>
        );
      case "axis": {
        const s = step as Extract<Step, { kind: "axis" }>;
        return (
          <>
            <AxisSlider
              value={answers[s.field]}
              onChange={(v) => setAnswer(s.field, v)}
              poleA={s.poleA}
              poleB={s.poleB}
            />
            <div className="pb-safe fixed inset-x-0 bottom-0 mx-auto max-w-[480px] px-5 pt-3">
              <Button onClick={goNext}>Weiter</Button>
            </div>
          </>
        );
      }
      case "slider": {
        const s = step as Extract<Step, { kind: "slider" }>;
        const stored = answers[s.field];
        const display = s.field === "axis_photogenic_importance" ? (photoDraft ?? stored ?? 50) : (stored ?? 50);

        function commitAndNext() {
          if (s.field === "axis_photogenic_importance") {
            setAnswer("axis_photogenic_importance", photoDraft ?? (stored as number | null) ?? 50);
          }
          goNext();
        }

        return (
          <>
            <div className="flex flex-col gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={display as number}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (s.field === "axis_photogenic_importance") setPhotoDraft(v);
                  else setAnswer("exploration_level", v);
                }}
                className="axis-range w-full"
                aria-label={s.title}
              />
              <div className="flex justify-between">
                <span className="t-footnote text-ink-3">{s.poles[0]}</span>
                <span className="t-footnote text-ink-3">{s.poles[1]}</span>
              </div>
            </div>
            <div className="pb-safe fixed inset-x-0 bottom-0 mx-auto flex max-w-[480px] flex-col gap-2 px-5 pt-3">
              <Button onClick={commitAndNext}>{s.submitLabel ?? "Weiter"}</Button>
              {s.skippable && (
                <Button
                  variant="quiet"
                  onClick={() => {
                    setAnswer("axis_photogenic_importance", null);
                    goNext();
                  }}
                >
                  Überspringen
                </Button>
              )}
            </div>
          </>
        );
      }
    }
  }

  return (
    <Screen className="pt-safe flex flex-col pb-36">
      <AppHeader onBack={goBack} />
      <div className="mt-1">
        <ProgressSegments total={TOTAL_STEPS} current={stepIndex + 1} />
      </div>
      <h1 className="t-display mt-8">{step.title}</h1>
      {"subtitle" in step && step.subtitle && (
        <p className="t-subhead mt-2 text-ink-2">{step.subtitle}</p>
      )}
      <div className="mt-8">{renderBody()}</div>
    </Screen>
  );
}
