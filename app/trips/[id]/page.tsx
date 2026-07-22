"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useShallow } from "zustand/react/shallow";
import { StoreHydrate } from "@/components/ui/hydrate";
import { TripHeader } from "@/components/trip/trip-header";
import { PlaceList } from "@/components/trip/place-list";
import { Button } from "@/components/ui/button";
import { useTrips } from "@/stores/trips-store";
import { bookingUrl, airbnbUrl, googleFlightsUrl } from "@/lib/deep-links";

const TripMap = dynamic(
  () => import("@/components/map/trip-map").then((m) => m.TripMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-line/30 animate-pulse" /> },
);

export default function TripPage() {
  return (
    <StoreHydrate>
      <TripView />
    </StoreHydrate>
  );
}

function TripView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const trip    = useTrips((s) => s.trips.find((t) => t.id === id));
  const places  = useTrips(useShallow((s) => s.places.filter((p) => p.tripId === id)));
  const addPlace   = useTrips((s) => s.addPlace);
  const removePlace = useTrips((s) => s.removePlace);
  const deleteTrip  = useTrips((s) => s.deleteTrip);

  const [selected, setSelected] = useState<string | null>(null);

  if (!trip) {
    return (
      <div className="container-prose py-16 text-center">
        <p className="text-muted">Reise nicht gefunden.</p>
        <Button onClick={() => router.push("/")} className="mt-4">Zurück</Button>
      </div>
    );
  }

  const cityForLinks = places.find((p) => p.kind === "hotel")?.name ?? trip.title;

  return (
    <>
      <TripHeader trip={trip} active="overview" />

      <div className="container-prose py-6 flex flex-col lg:grid lg:grid-cols-[1fr_340px] gap-6">

        {/* Karte — volle Höhe */}
        <div className="rounded-card overflow-hidden border border-line/60 h-[62vh] min-h-[440px] bg-white">
          <TripMap places={places} selectedId={selected} onSelect={setSelected} />
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">

          {/* Schnell-Buchungs-Links */}
          <section className="rounded-card border border-line/60 bg-white p-4">
            <h3 className="text-xs uppercase tracking-wide font-medium text-muted mb-3">
              Direkt buchen
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { label: "Booking.com", href: bookingUrl(cityForLinks, trip.startDate, trip.endDate) },
                { label: "Airbnb",      href: airbnbUrl(cityForLinks, trip.startDate, trip.endDate) },
                { label: "Google Flights", href: googleFlightsUrl("Deutschland", cityForLinks, trip.startDate) },
              ].map(({ label, href }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    {label} <span className="text-muted text-xs">↗</span>
                  </Button>
                </a>
              ))}
            </div>
          </section>

          {/* Orte-Liste */}
          <section className="rounded-card border border-line/60 bg-white p-4 flex-1">
            <PlaceList
              places={places}
              selectedId={selected}
              onSelect={setSelected}
              onRemove={removePlace}
              onAdd={({ name, kind }) => addPlace({ tripId: trip.id, name, kind })}
            />
          </section>

          {/* Reise löschen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Reise wirklich löschen?")) {
                deleteTrip(trip.id);
                router.push("/");
              }
            }}
            className="text-red-700 hover:bg-red-50 w-full"
          >
            Reise löschen
          </Button>
        </aside>
      </div>
    </>
  );
}
