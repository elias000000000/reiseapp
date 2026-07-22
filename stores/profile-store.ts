"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserProfile } from "@/lib/types";

interface ProfileState {
  profile: UserProfile;
  setProfile: (p: Partial<UserProfile>) => void;
}

const DEFAULT: UserProfile = {
  setupDone: false,
  homeCity: "Zürich",
  homeLat: 47.3769,
  homeLng: 8.5417,
  currency: "CHF",
  travelStyle: "couple",
  preferredTransport: "train",
  maxTravelHours: 8,
};

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      profile: DEFAULT,
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
    }),
    {
      name: "reiseapp:profile",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
