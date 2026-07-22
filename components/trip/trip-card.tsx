"use client";
import Link from "next/link";
import type { Trip } from "@/lib/types";
import { daysBetween, formatDateRange } from "@/lib/utils";
import { useTrips } from "@/stores/trips-store";
import { placeImageUrl } from "@/lib/images";

interface Props {
  trip: Trip;
  daysUntil?: number; // optional Countdown für bevorstehende Reisen
}

export function TripCard({ trip, daysUntil }: Props) {
  const deleteTrip = useTrips((s) => s.deleteTrip);
  const n = daysBetween(trip.startDate, trip.endDate);

  const imgSrc = trip.coverImage
    ? placeImageUrl({ existingUrl: trip.coverImage })
    : placeImageUrl({ name: trip.title });

  const countdownLabel =
    daysUntil !== undefined
      ? daysUntil === 0
        ? "Heute"
        : daysUntil === 1
        ? "Morgen"
        : `in ${daysUntil} Tagen`
      : null;

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-white border border-line hover:shadow-card transition-all duration-300">
      <Link href={`/trips/${trip.id}`} className="block">
        {/* Bild */}
        <div className="aspect-[4/3] relative overflow-hidden">
          <img
            src={imgSrc}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.src = `https://picsum.photos/seed/${encodeURIComponent(trip.title)}x/900/600`;
            }}
          />
          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Countdown-Badge */}
          {countdownLabel && (
            <div
              className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-white text-[11px] font-semibold"
              style={{ backgroundColor: "#92400E" }}
            >
              {countdownLabel}
            </div>
          )}

          {/* Dauer-Badge oben rechts */}
          {n > 0 && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-[11px] font-medium">
              {n} Tag{n === 1 ? "" : "e"}
            </div>
          )}

          {/* Titel unten */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display text-white text-xl font-semibold leading-tight drop-shadow">
              {trip.title}
            </h3>
            <div className="mt-1 text-white/65 text-xs">
              {formatDateRange(trip.startDate, trip.endDate)}
            </div>
          </div>
        </div>

        {/* Summary */}
        {trip.summary && (
          <div className="px-4 py-3 border-t border-line">
            <p className="text-xs text-muted line-clamp-2 leading-relaxed">
              {trip.summary}
            </p>
          </div>
        )}
      </Link>

      {/* Löschen */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (confirm(`„${trip.title}" wirklich löschen?`)) deleteTrip(trip.id);
        }}
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/45 backdrop-blur text-white hover:bg-stone-900 grid place-items-center shadow opacity-0 group-hover:opacity-100 transition text-xl font-light leading-none"
        title="Reise löschen"
        style={{ display: n > 0 ? undefined : undefined }} // immer sichtbar wenn keine Dauer
      >
        ×
      </button>
    </div>
  );
}
