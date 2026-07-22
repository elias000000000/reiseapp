// Kleine Anzeige-Bausteine: MatchBadge, MetaChip, ScoreBar, SectionTitle.

interface MatchBadgeProps {
  score: number | undefined;
}

export function MatchBadge({ score }: MatchBadgeProps) {
  if (score === undefined) return null; // nie "-- %" anzeigen (api-contract.md)
  return (
    <span
      className="t-footnote rounded-full px-3 py-1.5 font-semibold"
      style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
    >
      {score} % Match
    </span>
  );
}

export function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="t-footnote rounded-full px-3 py-1 text-ink-2"
      style={{ background: "var(--canvas)", border: "1px solid var(--line)" }}
    >
      {children}
    </span>
  );
}

interface ScoreBarProps {
  label: string;
  value: number; // 0-100
}

export function ScoreBar({ label, value }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="t-subhead w-28 shrink-0 text-ink-2">{label}</span>
      <div className="h-1.5 flex-1 rounded-full" style={{ background: "var(--line)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${value}%`, background: "var(--accent)" }}
        />
      </div>
      <span className="t-footnote w-7 text-right text-ink-3">{value}</span>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="t-title2 mb-4">{children}</h2>;
}
