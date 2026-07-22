"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useShallow } from "zustand/react/shallow";
import { StoreHydrate } from "@/components/ui/hydrate";
import { TripHeader } from "@/components/trip/trip-header";
import { DayTimeline } from "@/components/trip/day-timeline";
import { useTrips } from "@/stores/trips-store";
import { Button } from "@/components/ui/button";

const TripMap = dynamic(
  () => import("@/components/map/trip-map").then((m) => m.TripMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-line/30 animate-pulse" /> },
);

export default function PlanPage() {
  return (
    <StoreHydrate>
      <Plan />
    </StoreHydrate>
  );
}

function Plan() {
  const { id } = useParams<{ id: string }>();
  const trip      = useTrips((s) => s.trips.find((t) => t.id === id));
  const allDays   = useTrips(useShallow((s) => s.days.filter((d) => d.tripId === id)));
  const allPlaces = useTrips(useShallow((s) => s.places.filter((p) => p.tripId === id)));
  const ensureDays  = useTrips((s) => s.ensureDays);
  const updatePlace = useTrips((s) => s.updatePlace);
  const reorder     = useTrips((s) => s.reorderPlaces);

  useEffect(() => {
    if (trip) ensureDays(trip.id);
  }, [trip, ensureDays]);

  const days = useMemo(
    () => [...allDays].sort((a, b) => a.date.localeCompare(b.date)),
    [allDays],
  );

  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [selectedId, setSelectedId]   = useState<string | null>(null);

  useEffect(() => {
    if (!activeDayId && days[0]) setActiveDayId(days[0].id);
  }, [days, activeDayId]);

  if (!trip) return null;

  const activeDay  = days.find((d) => d.id === activeDayId);
  const dayPlaces  = allPlaces.filter((p) => p.dayId === activeDayId);
  const unassigned = allPlaces.filter((p) => !p.dayId);

  const assign = (placeId: string, dayId: string | null) =>
    updatePlace(placeId, { dayId: dayId ?? undefined });

  return (
    <>
      <TripHeader trip={trip} active="plan" />

      <div className="container-prose py-6">
        {/* Tag-Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-2 px-2 no-scrollbar">
          {days.map((d, i) => {
            const count = allPlaces.filter((p) => p.dayId === d.id).length;
            const isActive = d.id === activeDayId;
            return (
              <button key={d.id} onClick={() => { setActiveDayId(d.id); setSelectedId(null); }}
                className={`shrink-0 px-3.5 py-2 rounded-full border text-sm transition ${
                  isActive
                    ? "bg-ink text-canvas border-ink"
                    : "bg-white text-ink border-line hover:border-ink/40"
                }`}>
                <span className="font-medium">Tag {i + 1}</span>
                <span className={`ml-2 ${isActive ? "text-canvas/70" : "text-muted"}`}>
                  {new Date(d.date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                </span>
                {count > 0 && (
                  <span className={`ml-1.5 text-xs ${isActive ? "text-canvas/60" : "text-muted"}`}>
                    · {count}
                  </span>
                )}
              </button>
            );
          })}
          {days.length === 0 && (
            <p className="text-sm text-muted">Füge Start- und Enddatum in den Einstellungen hinzu.</p>
          )}
        </div>

        {/* Tages-Thema */}
        {activeDay?.notes && (
          <div className="mt-1 mb-4 px-1 text-sm text-muted italic">
            {activeDay.notes}
            {activeDay.baseCity && ` — ${activeDay.baseCity}`}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mt-2">
          {/* Karte */}
          <div className="rounded-card overflow-hidden border border-line/60 h-[62vh] min-h-[440px] bg-white">
            <TripMap
              places={dayPlaces.length ? dayPlaces : allPlaces}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          <aside className="flex flex-col gap-4">
            {/* Tagesplan */}
            <section className="rounded-card border border-line/60 bg-white p-4">
              <h3 className="text-xs uppercase tracking-wide font-medium text-muted mb-3">
                Tagesplan
              </h3>
              <DayTimeline
                places={dayPlaces}
                onReorder={(ids) => activeDayId && reorder(activeDayId, ids)}
                onUnassign={(pid) => assign(pid, null)}
              />
            </section>

            {/* Nicht zugeordnete Orte */}
            {unassigned.length > 0 && (
              <section className="rounded-card border border-line/60 bg-white p-4">
                <h3 className="text-xs uppercase tracking-wide font-medium text-muted mb-3">
                  Nicht zugeordnet ({unassigned.length})
                </h3>
                <ul className="flex flex-col gap-1.5">
                  {unassigned.map((p) => (
                    <li key={p.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-card hover:bg-accent-soft/50 text-sm">
                      <span className="truncate font-medium">{p.name}</span>
                      <Button size="sm" variant="outline"
                        onClick={() => activeDayId && assign(p.id, activeDayId)}>
                        → Heute
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
