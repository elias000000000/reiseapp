// Ladeplatzhalter in exakter Zielgeometrie (kein Layout-Sprung).

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={{ borderRadius: "var(--radius-sm)", ...style }} />;
}

/** Platzhalter in der Geometrie einer RecommendationCard. */
export function SkeletonCard() {
  return (
    <div
      className="overflow-hidden"
      style={{ borderRadius: "var(--radius-lg)", background: "var(--surface)", boxShadow: "var(--sh-card)" }}
    >
      <div className="skeleton" style={{ aspectRatio: "4 / 5" }} />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
