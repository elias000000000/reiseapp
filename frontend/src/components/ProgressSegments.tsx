// Onboarding-Fortschritt: 12 schmale Segmente.

interface ProgressSegmentsProps {
  total: number;
  current: number; // 1-basiert
}

export function ProgressSegments({ total, current }: ProgressSegmentsProps) {
  return (
    <div className="flex gap-1" role="progressbar" aria-valuenow={current} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-colors duration-300"
          style={{ background: i < current ? "var(--accent)" : "var(--line)" }}
        />
      ))}
    </div>
  );
}
