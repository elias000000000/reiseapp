// Choreografierte Loading-Schritte (screens.md S14). Die Zeitpunkte sind auf
// die ECHTE Backend-Latenz kalibriert (~20-35s, Claude-Call dominiert) — der
// letzte Schritt bleibt aktiv, bis die Antwort da ist. Kein Fake-"fertig".

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const STEPS = [
  { at: 1500, label: "Reiseprofil analysieren" },
  { at: 3500, label: "Reisezeit & Saison prüfen" },
  { at: 6000, label: "300 Ziele filtern" },
  { at: 9000, label: "Geheimtipps abwägen" },
] as const;

const FINAL_LABEL = "Persönliche Empfehlungen entstehen …";

const MICRO_COPY = [
  "Vergleiche Reiseaufwand …",
  "Prüfe Besucherdichte …",
  "Wäge Wow-Faktoren ab …",
  "Formuliere deine Begründungen …",
];

function Check({ done }: { done: boolean }) {
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300"
      style={{ background: done ? "var(--success)" : "var(--line)" }}
    >
      {done && (
        <motion.svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <motion.path
            d="M2 6.5 L4.8 9.2 L10 3"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </motion.svg>
      )}
    </span>
  );
}

interface LoadingChecklistProps {
  /** true sobald die Antwort da ist -> restliche Schritte im Schnelldurchlauf. */
  finished: boolean;
}

export function LoadingChecklist({ finished }: LoadingChecklistProps) {
  const [elapsed, setElapsed] = useState(0);
  const [microIdx, setMicroIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 250), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setMicroIdx((i) => (i + 1) % MICRO_COPY.length), 5000);
    return () => clearInterval(t);
  }, []);

  const doneCount = finished ? STEPS.length : STEPS.filter((s) => elapsed >= s.at).length;
  const finalActive = doneCount === STEPS.length && !finished;

  return (
    <div className="flex flex-col gap-4">
      {STEPS.map((step, i) => {
        const visible = elapsed >= step.at - 1200 || finished;
        const done = i < doneCount || finished;
        return (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, y: 8 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
            style={{ visibility: visible ? "visible" : "hidden" }}
          >
            <Check done={done} />
            <span className="t-body" style={{ color: done ? "var(--ink-2)" : "var(--ink)" }}>
              {step.label}
            </span>
          </motion.div>
        );
      })}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={elapsed >= 9000 || finished ? { opacity: 1, y: 0 } : {}}
        className="flex items-center gap-3"
      >
        <Check done={finished} />
        <div className="min-w-0">
          <span className="t-body" style={{ color: finished ? "var(--ink-2)" : "var(--ink)" }}>
            {FINAL_LABEL}
          </span>
          {finalActive && (
            <motion.div
              key={microIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="t-footnote mt-1 text-ink-3"
            >
              {MICRO_COPY[microIdx]}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
