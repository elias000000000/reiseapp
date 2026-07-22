// Loading Experience (S14): feuert den echten Request und choreografiert
// die Checkliste auf die tatsaechliche Latenz. Zweige: Erfolg -> /results,
// NO_CANDIDATES -> /too-narrow (S17), UNAUTHORIZED -> Seiten-Reload (baut
// automatisch eine neue anonyme Session auf, sehr seltener Fall),
// sonstiger Fehler -> Inline-ErrorState mit Retry (S18).

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "../components/Screen";
import { LoadingChecklist } from "../components/LoadingChecklist";
import { Button } from "../components/Button";
import { ApiRequestError, fetchRecommendations } from "../lib/api";
import { saveResult } from "../lib/storage";
import { useOnboarding } from "../state/OnboardingContext";

const MIN_DISPLAY_MS = 4000;
const DONE_BEAT_MS = 500;

export function LoadingScreen() {
  const navigate = useNavigate();
  const { firstMissingStep, buildPayload } = useOnboarding();
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsReload, setNeedsReload] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    setError(null);
    setNeedsReload(false);
    setFinished(false);
    const startedAt = Date.now();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await fetchRecommendations(buildPayload(), controller.signal);
      saveResult(result);
      setFinished(true);
      const wait = Math.max(0, MIN_DISPLAY_MS - (Date.now() - startedAt)) + DONE_BEAT_MS;
      window.setTimeout(() => navigate("/results", { replace: true }), wait);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (e instanceof ApiRequestError && e.code === "NO_CANDIDATES") {
        // Ehrliche Kurzsequenz, dann zum Anpassungs-Screen (S17)
        const wait = Math.max(0, 3000 - (Date.now() - startedAt));
        window.setTimeout(() => navigate("/too-narrow", { replace: true }), wait);
        return;
      }
      if (e instanceof ApiRequestError && e.code === "UNAUTHORIZED") {
        // Sehr seltener Fall (z. B. Session-Speicher manuell geleert). Kein
        // Login-Screen vorhanden - ein Reload laesst AuthContext automatisch
        // eine neue anonyme Session aufbauen. Antworten bleiben in
        // sessionStorage erhalten.
        setError("Deine Sitzung ist abgelaufen.");
        setNeedsReload(true);
        return;
      }
      setError(e instanceof ApiRequestError ? e.message : "Unerwarteter Fehler.");
    }
  }, [buildPayload, navigate]);

  useEffect(() => {
    // Unvollstaendige Antworten (z. B. direkter URL-Aufruf) -> zurueck ins Onboarding
    if (firstMissingStep !== null) {
      navigate(`/onboarding/${firstMissingStep}`, { replace: true });
      return;
    }
    void run();
    return () => abortRef.current?.abort();
    // attempt als Dependency: "Nochmal versuchen" loest einen neuen Lauf aus
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  return (
    <Screen className="pt-safe flex flex-col">
      <div className="mt-24">
        <h1 className="t-title1">Einen Moment.</h1>
        <p className="t-subhead mt-2 text-ink-2">Ich stelle deine Empfehlungen zusammen.</p>
      </div>

      <div className="mt-12">
        {error === null ? (
          <LoadingChecklist finished={finished} />
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="t-title2">Verbindung verloren.</h2>
              <p className="t-body mt-2 text-ink-2">
                {error} Deine Antworten sind gespeichert — einfach nochmal versuchen.
              </p>
            </div>
            <Button
              onClick={() => (needsReload ? window.location.reload() : setAttempt((a) => a + 1))}
            >
              Nochmal versuchen
            </Button>
          </div>
        )}
      </div>
    </Screen>
  );
}
