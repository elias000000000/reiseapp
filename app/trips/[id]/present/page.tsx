"use client";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { StoreHydrate } from "@/components/ui/hydrate";
import { Button } from "@/components/ui/button";
import { useTrips } from "@/stores/trips-store";
import { formatDateRange, daysBetween } from "@/lib/utils";
import { placeImageUrl } from "@/lib/images";
import type { Place, PlaceKind } from "@/lib/types";
import Link from "next/link";

export default function PresentPage() {
  return (
    <StoreHydrate>
      <Present />
    </StoreHydrate>
  );
}

/* ── Farben & Labels pro Typ ── */
const KIND_COLOR: Record<PlaceKind, string> = {
  hotel:   "#1D3D5E",
  sight:   "#92400E",
  food:    "#7C2D12",
  nature:  "#1A3D2E",
  transit: "#374151",
  note:    "#6B6560",
};
const KIND_LABEL: Record<PlaceKind, string> = {
  hotel: "Hotel", sight: "Sehenswürdigkeit", food: "Restaurant",
  nature: "Natur", transit: "Transfer", note: "Notiz",
};
const KIND_SHORT: Record<PlaceKind, string> = {
  hotel: "H", sight: "S", food: "R", nature: "N", transit: "T", note: "·",
};

/* ── Bild-URL für einen Place ── */
function img(p: Place, size: "thumb" | "full" = "thumb") {
  return placeImageUrl({
    imageSearch: p.meta?.imageSearch as string | undefined,
    name: p.name,
    existingUrl: p.imageUrl,
    size,
  });
}

/* ── Single hero image per day ── */
function DayHeroImage({ places }: { places: Place[] }) {
  const featured = places.find((p) => p.kind !== "note" && p.kind !== "transit");
  if (!featured) return null;
  return (
    <div className="relative rounded-2xl overflow-hidden mb-6" style={{ height: 280 }}>
      <img
        src={img(featured, "full")}
        alt={featured.name}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          const el = e.target as HTMLImageElement;
          el.src = `https://picsum.photos/seed/${encodeURIComponent(featured.name)}/1200/800`;
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute bottom-4 left-4">
        <span className="text-white text-sm font-medium">{featured.name}</span>
      </div>
    </div>
  );
}

function Present() {
  const { id } = useParams<{ id: string }>();
  const trip   = useTrips((s) => s.trips.find((t) => t.id === id));
  const days   = useTrips(useShallow((s) => s.days.filter((d) => d.tripId === id)));
  const places = useTrips(useShallow((s) => s.places.filter((p) => p.tripId === id)));

  const sortedDays = useMemo(
    () => [...days].sort((a, b) => a.date.localeCompare(b.date)),
    [days],
  );

  const n = daysBetween(trip?.startDate, trip?.endDate);
  const totalPlaces = places.filter((p) => p.kind !== "note").length;

  if (!trip) return null;

  const coverImg = trip.coverImage
    ? placeImageUrl({ existingUrl: trip.coverImage, size: "full" })
    : placeImageUrl({ name: trip.title, size: "full" });

  return (
    <>
      {/* ── Toolbar (nur am Bildschirm) ── */}
      <div className="no-print sticky top-14 z-20 bg-canvas/90 backdrop-blur border-b border-line">
        <div className="container-prose h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-muted">
            <Link href={`/trips/${id}`} className="hover:text-ink">← Zurück</Link>
            <span>·</span>
            <span>{trip.title}</span>
          </div>
          <Button onClick={() => window.print()} variant="pop" size="sm">
            Als PDF drucken
          </Button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          DRUCK-DOKUMENT
          ════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-0 print:max-w-full">

        {/* ── COVER-SEITE ── */}
        <div
          className="relative w-full overflow-hidden print-avoid"
          style={{ height: "85vh", minHeight: 560, pageBreakAfter: "always" }}
        >
          <img
            src={coverImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.src = `https://picsum.photos/seed/${encodeURIComponent(trip.title)}/2400/1600`;
            }}
          />
          {/* Dunkler Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Titel-Block */}
          <div className="absolute bottom-0 left-0 right-0 p-10 md:p-14">
            <div className="text-white/60 text-sm font-medium tracking-widest uppercase mb-3">
              Reiseplan
            </div>
            <h1
              className="font-display text-white leading-[1.0] font-bold"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
            >
              {trip.title}
            </h1>
            <div className="mt-4 flex items-center gap-4 text-white/70 text-base">
              <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
              {n > 0 && <><span>·</span><span>{n} Tage</span></>}
              {totalPlaces > 0 && <><span>·</span><span>{totalPlaces} Orte</span></>}
            </div>
            {trip.summary && (
              <p className="mt-5 max-w-xl text-white/80 text-base leading-relaxed">
                {trip.summary}
              </p>
            )}
          </div>
        </div>

        {/* ── TAGE ── */}
        <div className="px-8 md:px-14 py-10 print:px-10">
          {sortedDays.map((d, i) => {
            const dp = places
              .filter((p) => p.dayId === d.id)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            if (dp.length === 0) return null;

            const dateLabel = new Date(d.date).toLocaleDateString("de-DE", {
              weekday: "long", day: "numeric", month: "long",
            });

            return (
              <section
                key={d.id}
                className="mb-16 print-avoid"
                style={{ breakInside: "avoid-page" }}
              >
                {/* Tag-Header */}
                <div className="flex items-baseline gap-4 mb-2">
                  <div
                    className="text-5xl font-display font-bold text-ink/10 select-none leading-none"
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="text-2xs text-muted uppercase tracking-widest font-semibold">
                      Tag {i + 1}
                    </div>
                    <h2 className="font-display text-2xl font-semibold leading-tight">
                      {d.notes ?? dateLabel}
                    </h2>
                    <div className="text-sm text-muted">
                      {d.notes ? dateLabel : ""}
                      {d.baseCity ? (d.notes ? ` · ${d.baseCity}` : d.baseCity) : ""}
                    </div>
                  </div>
                </div>

                {/* Trennlinie */}
                <div className="h-px bg-gradient-to-r from-accent/30 via-line to-transparent mb-6" />

                {/* Tag-Bild */}
                <DayHeroImage places={dp} />

                {/* Orts-Liste */}
                <ol className="space-y-4">
                  {dp.map((p, j) => (
                    <li
                      key={p.id}
                      className="flex gap-4 print-avoid"
                      style={{ breakInside: "avoid" }}
                    >
                      {/* Nummer-Badge */}
                      <div className="shrink-0 mt-0.5">
                        <div
                          className="w-7 h-7 rounded-full grid place-items-center text-white text-xs font-bold"
                          style={{ backgroundColor: KIND_COLOR[p.kind] }}
                        >
                          {j + 1}
                        </div>
                      </div>

                      {/* Inhalt */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wide"
                            style={{ color: KIND_COLOR[p.kind] }}
                          >
                            {KIND_LABEL[p.kind]}
                          </span>
                          <span className="font-semibold text-base text-ink">{p.name}</span>
                        </div>
                        {p.description && (
                          <p className="text-sm text-muted mt-0.5 leading-relaxed">
                            {p.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}

          {/* Nicht zugeordnete Orte */}
          {(() => {
            const u = places.filter((p) => !p.dayId && p.kind !== "note");
            if (u.length === 0) return null;
            return (
              <section className="mb-12 print-avoid">
                <h2 className="font-display text-xl font-semibold mb-4">
                  Weitere Orte & Optionen
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {u.map((p) => (
                    <div key={p.id} className="flex items-start gap-3 p-3 rounded-card bg-stone-50">
                      <div
                        className="w-5 h-5 rounded-full grid place-items-center text-white text-[9px] font-bold shrink-0 mt-0.5"
                        style={{ backgroundColor: KIND_COLOR[p.kind] }}
                      >
                        {KIND_SHORT[p.kind]}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{p.name}</div>
                        {p.description && (
                          <div className="text-xs text-muted mt-0.5">{p.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* Footer */}
          <footer className="text-xs text-muted/50 border-t border-line pt-6 mt-4 flex justify-between">
            <span>{trip.title}</span>
            <span>Erstellt {new Date().toLocaleDateString("de-DE")}</span>
          </footer>
        </div>
      </div>
    </>
  );
}
