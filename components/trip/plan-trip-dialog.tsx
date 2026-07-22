"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useTrips } from "@/stores/trips-store";
import { daysBetween } from "@/lib/utils";
import type { DestinationSuggestion } from "@/lib/types";

const ACTIVITIES_BY_TYPE: Record<string, string[]> = {
  city:     ["Kultur", "Kulinarik", "Museen", "Nightlife", "Architektur", "Shopping", "Fotografie", "Märkte", "Sport"],
  village:  ["Kultur", "Kulinarik", "Entspannung", "Fotografie", "Natur", "Wandern", "Radfahren", "Weinkultur"],
  coast:    ["Strand", "Schnorcheln", "Wassersport", "Kulinarik", "Entspannung", "Segeln", "Fotografie", "Radfahren"],
  mountain: ["Wandern", "Klettern", "Natur", "Fotografie", "Skifahren", "Hüttentour", "Entspannung", "Paragliding"],
  nature:   ["Wandern", "Natur", "Fotografie", "Entspannung", "Abenteuer", "Wildtiere", "Radfahren", "Kajak"],
  region:   ["Kultur", "Kulinarik", "Natur", "Fotografie", "Wandern", "Entspannung", "Radfahren", "Weinkultur"],
};
const DEFAULT_ACTIVITIES = ["Kultur", "Kulinarik", "Natur", "Fotografie", "Entspannung", "Sport"];

interface Props {
  destination: DestinationSuggestion;
  onClose: () => void;
}

export function PlanTripDialog({ destination, onClose }: Props) {
  const router = useRouter();
  const createTrip = useTrips((s) => s.createTrip);
  const addPlace = useTrips((s) => s.addPlace);
  const updateDay = useTrips((s) => s.updateDay);

  const INTERESTS = ACTIVITIES_BY_TYPE[destination.type] ?? DEFAULT_ACTIVITIES;

  // Escape schließt Dialog
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, loading]);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [interests, setInterests] = useState<string[]>(() => {
    const acts = ACTIVITIES_BY_TYPE[destination.type] ?? DEFAULT_ACTIVITIES;
    return acts.slice(0, 2);
  });
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");

  const n = daysBetween(start, end);
  const toggle = (i: string) =>
    setInterests((curr) =>
      curr.includes(i) ? curr.filter((x) => x !== i) : [...curr, i],
    );

  const plan = async () => {
    if (!start || !end || n <= 0 || interests.length === 0) return;
    setLoading(true);
    setError("");
    setLoadingMsg(`${n}-Tage-Plan für ${destination.name} wird erstellt…`);

    try {
      const res = await fetch("/api/ai/plan-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: {
            name: destination.name,
            country: destination.country,
            lat: destination.lat,
            lng: destination.lng,
          },
          startDate: start,
          endDate: end,
          interests,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      if (!data.days?.length) throw new Error("Claude hat keinen Plan zurückgegeben.");

      setLoadingMsg("Reise wird angelegt…");

      // Trip anlegen — Store generiert Tage automatisch
      const trip = createTrip({
        title: `${destination.name}, ${destination.country}`,
        startDate: start,
        endDate: end,
        coverImage: destination.imageUrl,
        summary: data.summary,
      });

      // Tage aus frischem Store-State holen (nach createTrip bereits aktuell)
      const freshDays = useTrips.getState().days.filter((d) => d.tripId === trip.id);

      for (const day of data.days ?? []) {
        const tripDay = freshDays.find((d) => d.date === day.date);
        if (tripDay && (day.theme || day.baseCity)) {
          updateDay(tripDay.id, {
            baseCity: day.baseCity,
            notes: day.theme,
          });
        }
        for (let i = 0; i < (day.places ?? []).length; i++) {
          const p = day.places[i];
          addPlace({
            tripId: trip.id,
            dayId: tripDay?.id,
            kind: p.kind ?? "sight",
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            description: p.description,
            meta: {
              imageSearch: p.imageSearch ?? `${p.name} ${destination.country}`,
            },
          });
        }
      }

      router.push(`/trips/${trip.id}/plan`);
    } catch (err) {
      console.error("[plan-trip-dialog]", err);
      setError(err instanceof Error ? err.message : "Etwas ist schiefgelaufen. Bitte nochmal versuchen.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ backgroundColor: "rgba(26,23,20,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-float overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero-Bild */}
        {destination.imageUrl && (
          <div className="h-40 relative">
            <img
              src={destination.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5">
              <h2 className="h-display text-2xl font-medium text-white leading-tight">
                {destination.name}
              </h2>
              <p className="text-sm text-white/70">{destination.country}</p>
            </div>
          </div>
        )}

        <div className="p-5 flex flex-col gap-4">
          {!destination.imageUrl && (
            <h2 className="h-display text-2xl font-medium">
              {destination.name},{" "}
              <span className="text-muted font-sans font-normal text-lg">
                {destination.country}
              </span>
            </h2>
          )}

          {/* Daten */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Anreise">
              <Input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field label="Abreise">
              <Input
                type="date"
                value={end}
                min={start}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
          </div>
          {n > 0 && (
            <p className="text-sm font-medium -mt-2" style={{ color: "#92400E" }}>
              {n} Tag{n === 1 ? "" : "e"} — vollständiger Plan wird erstellt.
            </p>
          )}

          {/* Interessen */}
          <Field label="Was interessiert dich?">
            <div className="flex flex-wrap gap-1.5 mt-1">
              {INTERESTS.map((i) => {
                const active = interests.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggle(i)}
                    className={`px-3 py-1.5 rounded-full border text-sm transition ${
                      active
                        ? "bg-ink text-canvas border-ink"
                        : "bg-white border-line hover:border-ink/40"
                    }`}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {loading ? (
            <div className="py-4">
              <p className="text-sm text-muted mb-3">{loadingMsg}</p>
              <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full animate-[loading_1.5s_ease-in-out_infinite]"
                  style={{ backgroundColor: "#92400E" }}
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={onClose}>
                Abbrechen
              </Button>
              <Button
                onClick={plan}
                disabled={!start || !end || n <= 0 || interests.length === 0}
              >
                Plan erstellen →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
