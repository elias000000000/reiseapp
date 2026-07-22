"use client";
import { useEffect, useState } from "react";
import { useTrips } from "@/stores/trips-store";
import { useProfile } from "@/stores/profile-store";

export function StoreHydrate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    useTrips.persist.rehydrate();
    useProfile.persist.rehydrate();
    setReady(true);
  }, []);
  if (!ready) {
    return (
      <div>
        <div className="animate-pulse" style={{ minHeight: "88vh", background: "#E8E3DA" }} />
      </div>
    );
  }
  return <>{children}</>;
}
