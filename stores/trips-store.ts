"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Place, Trip, TripDay } from "@/lib/types";
import { eachDate, uid } from "@/lib/utils";

interface State {
  trips: Trip[];
  days: TripDay[];
  places: Place[];

  createTrip: (input: Omit<Trip, "id" | "createdAt">) => Trip;
  updateTrip: (id: string, patch: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;

  ensureDays: (tripId: string) => void;
  updateDay: (id: string, patch: Partial<TripDay>) => void;

  addPlace: (input: Omit<Place, "id" | "sortOrder">) => Place;
  updatePlace: (id: string, patch: Partial<Place>) => void;
  removePlace: (id: string) => void;
  reorderPlaces: (dayId: string, orderedIds: string[]) => void;
}

export const useTrips = create<State>()(
  persist(
    (set, get) => ({
      trips: [],
      days: [],
      places: [],

      createTrip(input) {
        const trip: Trip = {
          id: uid(),
          createdAt: new Date().toISOString(),
          ...input,
        };
        set((s) => ({ trips: [trip, ...s.trips] }));
        if (trip.startDate && trip.endDate) {
          // Pre-generate day rows so the UI has something to render.
          const days: TripDay[] = eachDate(trip.startDate, trip.endDate).map((d) => ({
            id: uid(),
            tripId: trip.id,
            date: d,
          }));
          set((s) => ({ days: [...s.days, ...days] }));
        }
        return trip;
      },

      updateTrip(id, patch) {
        set((s) => ({
          trips: s.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }));
      },

      deleteTrip(id) {
        set((s) => ({
          trips: s.trips.filter((t) => t.id !== id),
          days: s.days.filter((d) => d.tripId !== id),
          places: s.places.filter((p) => p.tripId !== id),
        }));
      },

      ensureDays(tripId) {
        const trip = get().trips.find((t) => t.id === tripId);
        if (!trip?.startDate || !trip.endDate) return;
        const existing = new Set(
          get().days.filter((d) => d.tripId === tripId).map((d) => d.date),
        );
        const missing = eachDate(trip.startDate, trip.endDate)
          .filter((d) => !existing.has(d))
          .map<TripDay>((d) => ({ id: uid(), tripId, date: d }));
        if (missing.length) set((s) => ({ days: [...s.days, ...missing] }));
      },

      updateDay(id, patch) {
        set((s) => ({
          days: s.days.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        }));
      },

      addPlace(input) {
        const peers = get().places.filter(
          (p) => p.tripId === input.tripId && p.dayId === input.dayId,
        );
        const place: Place = {
          id: uid(),
          sortOrder: peers.length,
          ...input,
        };
        set((s) => ({ places: [...s.places, place] }));
        return place;
      },

      updatePlace(id, patch) {
        set((s) => ({
          places: s.places.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }));
      },

      removePlace(id) {
        set((s) => ({ places: s.places.filter((p) => p.id !== id) }));
      },

      reorderPlaces(dayId, orderedIds) {
        set((s) => ({
          places: s.places.map((p) => {
            if (p.dayId !== dayId) return p;
            const idx = orderedIds.indexOf(p.id);
            return idx === -1 ? p : { ...p, sortOrder: idx };
          }),
        }));
      },
    }),
    {
      name: "reiseapp:v1",
      storage: createJSONStorage(() => localStorage),
      // Avoid SSR hydration mismatch — hydrate after mount only.
      skipHydration: true,
    },
  ),
);
