"use client";
import Link from "next/link";
import type { Trip } from "@/lib/types";
import { daysBetween, formatDateRange } from "@/lib/utils";

export function TripHeader({ trip, active }: { trip: Trip; active: "overview" | "plan" | "present" }) {
  const n = daysBetween(trip.startDate, trip.endDate);
  const tabs = [
    { key: "overview", label: "Übersicht", href: `/trips/${trip.id}` },
    { key: "plan", label: "Tagesplan", href: `/trips/${trip.id}/plan` },
    { key: "present", label: "Präsentation", href: `/trips/${trip.id}/present` },
  ] as const;

  return (
    <div className="border-b border-line/60 bg-canvas/85 backdrop-blur sticky top-14 z-20 no-print">
      <div className="container-prose pt-5 pb-2">
        <Link href="/" className="text-xs text-muted hover:text-ink">
          ← Alle Reisen
        </Link>
        <h1 className="h-display text-2xl md:text-4xl font-medium mt-1 leading-tight">
          {trip.title}
        </h1>
        <p className="text-sm text-muted mt-1">
          {formatDateRange(trip.startDate, trip.endDate)}
          {n > 0 && <> · {n} Tag{n === 1 ? "" : "e"}</>}
        </p>

        <nav className="mt-4 flex items-center gap-1 -mb-px">
          {tabs.map((t) => {
            const isActive = active === t.key;
            return (
              <Link
                key={t.key}
                href={t.href}
                className={`px-3 py-2 text-sm border-b-2 -mb-px transition ${
                  isActive
                    ? "border-ink text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
