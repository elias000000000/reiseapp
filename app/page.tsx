"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { StoreHydrate } from "@/components/ui/hydrate";
import { TripCard } from "@/components/trip/trip-card";
import { NewTripDialog } from "@/components/trip/new-trip-dialog";
import { ProfileSetup } from "@/components/onboarding/profile-setup";
import { useTrips } from "@/stores/trips-store";
import { useProfile } from "@/stores/profile-store";
import { daysUntil } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <StoreHydrate>
      <Dashboard />
    </StoreHydrate>
  );
}

function Dashboard() {
  const trips = useTrips((s) => s.trips);
  const { profile, setProfile } = useProfile();
  const [newOpen, setNewOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [search, setSearch] = useState("");

  if (!profile.setupDone) {
    return <ProfileSetup onDone={() => setProfile({ setupDone: true })} />;
  }

  // Trips klassifizieren
  const { upcoming, active, past } = useMemo(() => {
    const sorted = [...trips].sort((a, b) => {
      const da = a.startDate ? new Date(a.startDate).getTime() : 0;
      const db = b.startDate ? new Date(b.startDate).getTime() : 0;
      return da - db;
    });
    const result = {
      upcoming: [] as typeof trips,
      active:   [] as typeof trips,
      past:     [] as typeof trips,
    };
    for (const t of sorted) {
      if (!t.startDate) { result.upcoming.push(t); continue; }
      const d = daysUntil(t.startDate);
      const dEnd = t.endDate ? daysUntil(t.endDate) : d;
      if (d > 0)        result.upcoming.push(t);
      else if (dEnd >= 0) result.active.push(t);
      else              result.past.push(t);
    }
    return result;
  }, [trips]);

  const searchedTrips = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return trips.filter((t) => t.title.toLowerCase().includes(q));
  }, [trips, search]);

  const transportLabel =
    profile.preferredTransport === "train" ? "Zug"
    : profile.preferredTransport === "flight" ? "Flug"
    : "Auto";

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight: "88vh" }}>
        <img
          src="https://picsum.photos/seed/eurotravel2024/2400/1350"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(15,25,35,0.82) 0%, rgba(15,25,35,0.4) 55%, rgba(15,25,35,0.65) 100%)",
          }}
        />

        <div className="relative z-10 flex flex-col justify-end" style={{ minHeight: "88vh" }}>
          <div className="container-prose pb-16 md:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <p className="text-white/40 text-xs font-medium tracking-[0.22em] uppercase mb-5">
                Persönlicher Reiseplaner
              </p>
              <h1
                className="font-display text-white font-bold leading-[0.93]"
                style={{ fontSize: "clamp(3rem, 10vw, 7rem)" }}
              >
                Deine nächste
                <br />
                <span style={{ color: "#B45309" }}>Reise wartet.</span>
              </h1>

              {/* Active trip highlight */}
              {active.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#B45309", boxShadow: "0 0 6px #B45309" }}
                  />
                  <span className="text-white text-sm font-medium">
                    {active[0].title} — läuft gerade
                  </span>
                </motion.div>
              )}

              <p className="mt-6 text-white/55 text-lg max-w-md leading-relaxed">
                {trips.length === 0
                  ? "Noch nichts geplant. Lass dir passende Reiseziele vorschlagen."
                  : upcoming.length > 0
                  ? `Nächste Reise: ${upcoming[0].title}${upcoming[0].startDate ? ` in ${daysUntil(upcoming[0].startDate)} Tagen` : ""}.`
                  : `${trips.length} Reise${trips.length === 1 ? "" : "n"} in deiner Sammlung.`}
              </p>

              <div className="mt-8 flex items-center gap-3 flex-wrap">
                <Link href="/discover">
                  <button
                    className="h-12 px-7 text-white rounded-full font-semibold text-base transition shadow-lg"
                    style={{ backgroundColor: "#92400E" }}
                  >
                    Ziel entdecken
                  </button>
                </Link>
                <button
                  onClick={() => setNewOpen(true)}
                  className="h-12 px-7 rounded-full font-semibold text-base transition border border-white/25 text-white hover:bg-white/10"
                >
                  Reise erstellen
                </button>
                <button
                  onClick={() => setShowSetup(true)}
                  className="h-12 px-5 rounded-full text-sm transition text-white/30 hover:text-white/60"
                >
                  Profil
                </button>
              </div>
            </motion.div>

            {trips.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 flex items-center gap-5 text-white/30 text-xs tracking-wide"
              >
                <span>{trips.length} Reisen</span>
                <span>·</span>
                <span>{profile.homeCity}</span>
                <span>·</span>
                <span>{transportLabel}</span>
              </motion.div>
            )}
          </div>
        </div>

        {trips.length > 0 && (
          <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/20">
            <span className="text-[9px] tracking-[0.25em] uppercase">Reisen</span>
            <div className="w-px h-8 bg-gradient-to-b from-white/25 to-transparent" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-canvas">
        {trips.length === 0 ? (
          <EmptyState onCreate={() => setNewOpen(true)} />
        ) : (
          <div className="container-prose py-14">

            {/* Suche + Header */}
            <div className="flex items-center gap-4 mb-10 flex-wrap">
              <h2 className="font-display text-3xl font-semibold text-ink flex-1">
                Meine Reisen
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Suchen…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 pl-9 pr-3 rounded-full border border-line bg-white text-sm text-ink placeholder:text-muted focus:outline-none focus:border-stone-400 w-44 transition-all focus:w-56"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <button
                  onClick={() => setNewOpen(true)}
                  className="h-9 px-4 rounded-full border border-stone-300 text-sm text-stone-600 hover:border-stone-700 hover:text-stone-900 transition whitespace-nowrap"
                >
                  + Neu
                </button>
              </div>
            </div>

            {/* Suchergebnisse */}
            <AnimatePresence>
              {searchedTrips !== null ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {searchedTrips.length === 0 ? (
                    <p className="text-muted text-sm py-8 text-center">
                      Keine Reise gefunden für „{search}".
                    </p>
                  ) : (
                    <TripGrid trips={searchedTrips} />
                  )}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
                  {/* Gerade unterwegs */}
                  {active.length > 0 && (
                    <Section label="Gerade unterwegs" accent>
                      <TripGrid trips={active} />
                    </Section>
                  )}

                  {/* Bevorstehend */}
                  {upcoming.length > 0 && (
                    <Section label="Bevorstehend">
                      <TripGrid trips={upcoming} showCountdown />
                    </Section>
                  )}

                  {/* Vergangene */}
                  {past.length > 0 && (
                    <Section
                      label={upcoming.length + active.length > 0 ? "Vergangene" : undefined}
                      dim={upcoming.length + active.length > 0}
                    >
                      <TripGrid trips={past} />
                    </Section>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {newOpen && <NewTripDialog onClose={() => setNewOpen(false)} />}
      {showSetup && <ProfileSetup onDone={() => setShowSetup(false)} />}
    </div>
  );
}

function Section({
  label, children, accent, dim,
}: {
  label?: string;
  children: React.ReactNode;
  accent?: boolean;
  dim?: boolean;
}) {
  return (
    <div className={`mb-12 ${dim ? "opacity-60" : ""}`}>
      {label && (
        <div className="flex items-center gap-3 mb-5">
          {accent && (
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#92400E" }}
            />
          )}
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            {label}
          </p>
        </div>
      )}
      {children}
    </div>
  );
}

function TripGrid({
  trips, showCountdown,
}: {
  trips: ReturnType<typeof useTrips.getState>["trips"];
  showCountdown?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {trips.map((t, i) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.35 }}
        >
          <TripCard
            trip={t}
            daysUntil={
              showCountdown && t.startDate ? daysUntil(t.startDate) : undefined
            }
          />
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="container-prose py-24 text-center">
      <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-line bg-white">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9B8A7A" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>
      <h2 className="font-display text-3xl font-semibold text-ink">
        Wohin zuerst?
      </h2>
      <p className="text-muted mt-3 max-w-sm mx-auto leading-relaxed">
        Lass dir passende Reiseziele vorschlagen oder starte direkt mit einem
        eigenen Plan.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <Link href="/discover">
          <button
            className="h-11 px-6 text-white rounded-full font-semibold text-sm transition"
            style={{ backgroundColor: "#92400E" }}
          >
            Ziel entdecken
          </button>
        </Link>
        <button
          onClick={onCreate}
          className="h-11 px-6 rounded-full font-semibold text-sm border border-stone-300 text-stone-700 hover:border-stone-700 transition"
        >
          Manuell erstellen
        </button>
      </div>
    </div>
  );
}
