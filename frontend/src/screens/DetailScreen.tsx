// Destination Detail (S15): personalisierte Begruendung VOR allen Fakten.

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/Button";
import { DestinationImage } from "../components/DestinationImage";
import { MatchBadge, ScoreBar, SectionTitle } from "../components/Badges";
import { Skeleton } from "../components/Skeleton";
import { getDestination } from "../lib/destinationsCache";
import { loadResult } from "../lib/storage";
import { budgetSymbol, durationLabel, effortLabel, monthShort } from "../lib/format";
import { bookingUrl, googleFlightsUrl } from "../lib/deepLinks";
import type { Destination } from "../lib/types";

const SCORE_LABELS: [keyof Destination, string][] = [
  ["nature_score", "Natur"],
  ["photography_score", "Fotografie"],
  ["adventure_score", "Abenteuer"],
  ["hiking_score", "Wandern"],
  ["city_score", "Stadt"],
  ["culture_score", "Kultur"],
  ["beach_score", "Strand"],
  ["wildlife_score", "Tierwelt"],
  ["nightlife_score", "Nachtleben"],
  ["luxury_score", "Komfort"],
];

function FactTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-1 p-4"
      style={{ borderRadius: "var(--radius-lg)", background: "var(--surface)", boxShadow: "var(--sh-card)" }}
    >
      <span className="t-caption text-ink-3">{label}</span>
      <span className="t-headline">{value}</span>
    </div>
  );
}

export function DetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [failed, setFailed] = useState(false);

  const stored = loadResult();
  const recommendation = stored?.result.recommendations.find((r) => r.destination_id === id);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    getDestination(id, controller.signal)
      .then((d) => (d ? setDestination(d) : setFailed(true)))
      .catch((e) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) setFailed(true);
      });
    return () => controller.abort();
  }, [id]);

  if (failed) {
    return (
      <div className="mx-auto max-w-[480px] px-5 pt-24">
        <p className="t-body text-ink-2">Dieser Ort konnte nicht geladen werden.</p>
        <div className="mt-6">
          <Button onClick={() => navigate(-1)}>Zurück</Button>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="mx-auto max-w-[480px]">
        <Skeleton style={{ aspectRatio: "16 / 10", borderRadius: 0 }} />
        <div className="flex flex-col gap-3 px-5 pt-6">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  const topScores = SCORE_LABELS
    .map(([key, label]) => ({ label, value: destination[key] as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-[480px] pb-16">
      {/* Hero */}
      <div className="relative">
        <DestinationImage
          imageUrl={destination.image_url}
          categories={destination.categories}
          alt={destination.name}
          aspect="16 / 10"
          eager
          className="!rounded-none"
        >
          <div className="scrim absolute inset-0" />
          <div className="pt-safe absolute inset-x-0 top-0 z-10 px-3">
            <AppHeader onBack={() => navigate(-1)} variant="overlay" />
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
            <div className="t-caption opacity-80">{destination.country}</div>
            <h1 className="t-title1 mt-1">{destination.name}</h1>
          </div>
        </DestinationImage>
      </div>

      <div className="flex flex-col gap-10 px-5 pt-6">
        {/* Personalisierte Begruendung zuerst */}
        {recommendation && (
          <section
            className="flex flex-col gap-3 p-5"
            style={{ borderRadius: "var(--radius-lg)", background: "var(--accent-soft)" }}
          >
            <div className="flex items-center justify-between">
              <span className="t-caption" style={{ color: "var(--accent)" }}>
                Warum es zu dir passt
              </span>
              <MatchBadge score={recommendation.match_score} />
            </div>
            <p className="t-body">{recommendation.reasoning}</p>
          </section>
        )}

        {/* Highlights */}
        <section>
          <SectionTitle>Highlights</SectionTitle>
          <ul className="flex flex-col gap-3">
            {destination.highlights.map((h) => (
              <li key={h} className="flex items-start gap-3">
                <span
                  className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
                <span className="t-body">{h}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Fakten */}
        <section>
          <SectionTitle>Auf einen Blick</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <FactTile label="Reisedauer" value={durationLabel(destination.minimum_days, destination.ideal_days)} />
            <FactTile label="Budget" value={budgetSymbol(destination.estimated_budget_level)} />
            <FactTile label="Aufwand" value={effortLabel(destination.trip_effort_score)} />
            <FactTile
              label="Beste Zeit"
              value={
                <span className="flex flex-wrap gap-1">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <span
                      key={m}
                      className="t-footnote"
                      style={{
                        color: destination.best_months.includes(m) ? "var(--accent)" : "var(--ink-3)",
                        fontWeight: destination.best_months.includes(m) ? 600 : 400,
                      }}
                    >
                      {monthShort(m)[0]}
                    </span>
                  ))}
                </span>
              }
            />
          </div>
        </section>

        {/* Charakter */}
        <section>
          <SectionTitle>Charakter</SectionTitle>
          <div className="flex flex-col gap-3">
            {topScores.map((s) => (
              <ScoreBar key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        </section>

        {/* Beschreibung */}
        {destination.description && (
          <section>
            <SectionTitle>Über {destination.name}</SectionTitle>
            <p className="t-body text-ink-2">{destination.description}</p>
          </section>
        )}

        {/* Externe Links */}
        <section className="flex flex-col gap-3">
          <Button
            variant="ghost"
            onClick={() => window.open(googleFlightsUrl(destination.name, destination.country), "_blank")}
          >
            Flüge ansehen
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.open(bookingUrl(destination.name, destination.country), "_blank")}
          >
            Unterkünfte ansehen
          </Button>
          {destination.image_attribution && (
            <p className="t-caption mt-2 text-ink-3">{destination.image_attribution}</p>
          )}
        </section>
      </div>
    </div>
  );
}
