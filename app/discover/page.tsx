"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StoreHydrate } from "@/components/ui/hydrate";
import { PlanTripDialog } from "@/components/trip/plan-trip-dialog";
import { useProfile } from "@/stores/profile-store";
import { estimateTravelTime, travelBookingUrl, type TransportMode } from "@/lib/travel-time";
import { bookingUrl, airbnbUrl } from "@/lib/deep-links";
import { placeImageUrl } from "@/lib/images";
import type { DestinationSuggestion, SuggestionCriteria } from "@/lib/types";

const VIBE_LABELS: Record<string, string> = {
  city: "Stadt", nature: "Natur", coast: "Küste", mountain: "Berge",
  culture: "Kultur", food: "Essen", nightlife: "Nightlife", quiet: "Ruhe", adventure: "Abenteuer",
};
const VIBES = Object.keys(VIBE_LABELS) as SuggestionCriteria["vibe"];

const TRANSPORT_OPTS: { mode: TransportMode; label: string }[] = [
  { mode: "train",  label: "Zug" },
  { mode: "flight", label: "Flug" },
  { mode: "car",    label: "Auto" },
];

// Stagger-Varianten für Ergebniskarten
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button" onClick={onClick}
      className="px-3 py-1.5 rounded-full border text-sm transition"
      style={{
        backgroundColor: active ? "#1A1714" : "transparent",
        color: active ? "#FFFFFF" : "#6B6560",
        borderColor: active ? "#1A1714" : "#DDD9D3",
      }}
    >
      {children}
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-line">
      <div className="aspect-[16/9] bg-stone-100 animate-pulse" />
      <div className="p-5 space-y-2.5">
        <div className="h-5 bg-stone-100 rounded-full w-2/3 animate-pulse" />
        <div className="h-3 bg-stone-50 rounded-full w-full animate-pulse" />
        <div className="h-3 bg-stone-50 rounded-full w-4/5 animate-pulse" />
        <div className="h-3 bg-stone-50 rounded-full w-1/2 animate-pulse" />
        <div className="flex gap-2 pt-2">
          <div className="h-9 bg-stone-100 rounded-full w-32 animate-pulse" />
          <div className="h-9 bg-stone-50 rounded-full w-16 animate-pulse" />
          <div className="h-9 bg-stone-50 rounded-full w-16 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  return <StoreHydrate><Discover /></StoreHydrate>;
}

function Discover() {
  const { profile, setProfile } = useProfile();
  const last = profile.lastSearch;

  const [vibe, setVibe] = useState<SuggestionCriteria["vibe"]>(
    last?.vibe ?? ["nature", "food"],
  );
  const [climate, setClimate] = useState<SuggestionCriteria["climate"]>(
    last?.climate ?? "mild",
  );
  const [budget, setBudget] = useState(last?.budgetPerDay ?? 120);
  const [hiddenGem, setHiddenGem] = useState(last?.hiddenGemBias ?? true);

  const [transport, setTransport] = useState<TransportMode>(profile.preferredTransport);
  const [maxH, setMaxH] = useState(profile.maxTravelHours);
  const [homeCity, setHomeCity] = useState(profile.homeCity);
  const [homeLat] = useState(profile.homeLat ?? 47.3769);
  const [homeLng] = useState(profile.homeLng ?? 8.5417);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DestinationSuggestion[] | null>(null);
  const [mode, setMode] = useState<"mock" | "live" | null>(null);
  const [planning, setPlanning] = useState<DestinationSuggestion | null>(null);

  const toggleVibe = (v: string) =>
    setVibe((curr) =>
      curr.includes(v as never)
        ? (curr.filter((x) => x !== v) as SuggestionCriteria["vibe"])
        : ([...curr, v] as SuggestionCriteria["vibe"]),
    );

  const filtered = useMemo(() => {
    if (!results) return null;
    return results.filter((d) => {
      if (!d.lat || !d.lng) return true;
      const { hours } = estimateTravelTime(homeLat, homeLng, d.lat, d.lng, transport);
      return hours <= maxH;
    });
  }, [results, homeLat, homeLng, transport, maxH]);

  const submit = async () => {
    setLoading(true);
    setResults(null);
    setProfile({
      homeCity, preferredTransport: transport, maxTravelHours: maxH,
      lastSearch: { vibe, climate, budgetPerDay: budget, hiddenGemBias: hiddenGem },
    });
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vibe, climate, budgetPerDay: budget,
          travelStyle: profile.travelStyle,
          hiddenGemBias: hiddenGem,
        } satisfies SuggestionCriteria),
      });
      const data = await res.json();
      setMode(data.mode);
      const enriched = (data.destinations ?? []).map((d: DestinationSuggestion) => ({
        ...d,
        imageUrl: placeImageUrl({ name: d.name, size: "thumb" }),
      }));
      setResults(enriched);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-canvas min-h-screen">
      {/* Header */}
      <div className="border-b border-line bg-white">
        <div className="container-prose py-10 md:py-12">
          <p className="text-xs font-medium tracking-widest text-muted uppercase mb-2">
            Reiseziel finden
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink leading-tight">
            Wohin als nächstes?
          </h1>
          <p className="text-muted mt-3 max-w-md">
            Wähle deine Vorlieben — passende Ziele werden vorgeschlagen, mit
            vollständigem Reiseplan auf Knopfdruck.
          </p>
        </div>
      </div>

      <div className="container-prose py-10">

        {/* Anreise */}
        <div className="rounded-2xl bg-white border border-line p-5 mb-5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
            Anreise
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted font-medium block mb-1.5">Startort</label>
              <input
                type="text" value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                placeholder="z.B. Zürich"
                className="w-full border border-line rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-stone-400"
              />
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1.5">Verkehrsmittel</label>
              <div className="flex gap-2">
                {TRANSPORT_OPTS.map(({ mode: m, label }) => (
                  <button key={m} onClick={() => setTransport(m)}
                    className="flex-1 py-2 rounded-xl border text-xs font-medium transition"
                    style={{
                      backgroundColor: transport === m ? "#1A1714" : "transparent",
                      color: transport === m ? "#FFF" : "#6B6560",
                      borderColor: transport === m ? "#1A1714" : "#DDD9D3",
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1.5">
                Max. Reisezeit: <span className="font-semibold text-ink">{maxH} Std.</span>
              </label>
              <input type="range" min={2} max={24} step={1} value={maxH}
                onChange={(e) => setMaxH(Number(e.target.value))}
                className="w-full" style={{ accentColor: "#92400E" }} />
              <div className="flex justify-between text-xs text-muted mt-0.5">
                <span>2h</span><span>24h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl bg-white border border-line p-5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Vibe</p>
            <div className="flex flex-wrap gap-1.5">
              {VIBES.map((v) => (
                <Chip key={v} active={vibe.includes(v)} onClick={() => toggleVibe(v)}>
                  {VIBE_LABELS[v]}
                </Chip>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-line p-5 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2.5">Klima</p>
              <div className="flex gap-1.5">
                {(["warm", "mild", "cool", "any"] as const).map((c) => (
                  <Chip key={c} active={climate === c} onClick={() => setClimate(c)}>
                    {{ warm: "Warm", mild: "Mild", cool: "Kühl", any: "Egal" }[c]}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Budget ·{" "}
                <span className="normal-case font-normal text-ink">
                  {budget} {profile.currency}/Tag
                </span>
              </p>
              <input type="range" min={40} max={300} step={10} value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full" style={{ accentColor: "#92400E" }} />
            </div>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer text-muted">
              <input type="checkbox" checked={hiddenGem}
                onChange={(e) => setHiddenGem(e.target.checked)}
                className="w-4 h-4" style={{ accentColor: "#92400E" }} />
              Geheimtipps bevorzugen
            </label>
          </div>
        </div>

        {/* Suchen */}
        <div className="flex items-center gap-3 flex-wrap mb-10">
          <button
            onClick={submit} disabled={loading || vibe.length === 0}
            className="h-11 px-7 text-white rounded-full font-semibold text-sm transition disabled:opacity-40"
            style={{ backgroundColor: "#92400E" }}
          >
            {loading ? "Suche läuft…" : "Vorschläge finden"}
          </button>

          {/* "Letzte Suche" Chip — zeigt an wenn gespeicherte Kriterien vorhanden */}
          {last && !loading && !results && (
            <button
              onClick={() => {
                setVibe(last.vibe);
                setClimate(last.climate);
                setBudget(last.budgetPerDay);
                setHiddenGem(last.hiddenGemBias);
                // direkt suchen
                setTimeout(submit, 50);
              }}
              className="h-11 px-4 rounded-full border border-line text-sm text-muted hover:border-stone-400 hover:text-ink transition"
            >
              Letzte Suche wiederholen
            </button>
          )}

          {mode === "mock" && !loading && (
            <span className="text-xs text-muted">
              Demo · ohne API-Key
            </span>
          )}
          {mode === "live" && !loading && (
            <span className="text-xs font-medium" style={{ color: "#92400E" }}>Live</span>
          )}
        </div>

        {/* Skeleton während Loading */}
        {loading && (
          <div>
            <div className="h-3 bg-stone-100 rounded-full w-32 mb-5 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                >
                  <SkeletonCard />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Ergebnisse */}
        <AnimatePresence>
          {!loading && filtered !== null && filtered.length === 0 && results && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-16 text-muted"
            >
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-line mx-auto mb-4" />
              <p className="font-medium text-ink">Keine Ziele innerhalb von {maxH} Std.</p>
              <p className="text-sm mt-1">Erhöhe die maximale Reisezeit oder wähle ein anderes Verkehrsmittel.</p>
            </motion.div>
          )}

          {!loading && filtered && filtered.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xs text-muted mb-5 font-medium uppercase tracking-wider">
                {filtered.length} Ziel{filtered.length === 1 ? "" : "e"}
              </p>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
                variants={listVariants}
                initial="hidden"
                animate="show"
              >
                {filtered.map((d) => (
                  <motion.div key={d.name} variants={cardVariants}>
                    <DestinationCard
                      d={d}
                      homeCity={homeCity}
                      homeLat={homeLat}
                      homeLng={homeLng}
                      transport={transport}
                      currency={profile.currency}
                      onPlan={() => setPlanning(d)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {planning && (
        <PlanTripDialog destination={planning} onClose={() => setPlanning(null)} />
      )}
    </div>
  );
}

function DestinationCard({
  d, homeCity, homeLat, homeLng, transport, currency, onPlan,
}: {
  d: DestinationSuggestion;
  homeCity: string;
  homeLat: number;
  homeLng: number;
  transport: TransportMode;
  currency: string;
  onPlan: () => void;
}) {
  const travel =
    d.lat && d.lng
      ? estimateTravelTime(homeLat, homeLng, d.lat, d.lng, transport)
      : null;
  const transportLabel = { flight: "Flug", train: "Zug", car: "Auto" }[transport];

  return (
    <article className="rounded-2xl overflow-hidden bg-white border border-line hover:shadow-card transition-shadow duration-300 group">
      <div className="aspect-[16/9] bg-stone-100 overflow-hidden relative">
        <img
          src={d.imageUrl}
          alt={d.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.src = `https://picsum.photos/seed/${encodeURIComponent(d.name)}x/800/530`;
          }}
        />
        {d.hiddenGem && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-white text-[10px] font-semibold tracking-wide"
            style={{ backgroundColor: "#92400E" }}>
            Geheimtipp
          </div>
        )}
        {travel && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium">
            {travel.label} · {transportLabel}
          </div>
        )}
        <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold">
          {d.matchScore}%
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display text-xl font-semibold text-ink leading-tight">
          {d.name}
          <span className="text-muted font-sans font-normal text-sm"> · {d.country}</span>
        </h3>
        <p className="text-sm text-muted leading-relaxed mt-2">{d.reason}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted flex-wrap">
          {d.bestSeason && <span>{d.bestSeason}</span>}
          {d.estDailyBudgetEur && <span>· {d.estDailyBudgetEur} {currency}/Tag</span>}
          {travel && <span>· {travel.distanceKm} km</span>}
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <button onClick={onPlan}
            className="h-9 px-4 text-white rounded-full font-semibold text-sm transition"
            style={{ backgroundColor: "#92400E" }}>
            Reise planen
          </button>
          <a href={bookingUrl(d.name)} target="_blank" rel="noopener noreferrer"
            className="h-9 px-3 rounded-full border border-line text-xs text-muted hover:border-stone-400 hover:text-ink transition">
            Hotels
          </a>
          <a href={airbnbUrl(d.name)} target="_blank" rel="noopener noreferrer"
            className="h-9 px-3 rounded-full border border-line text-xs text-muted hover:border-stone-400 hover:text-ink transition">
            Airbnb
          </a>
          {d.lat && d.lng && (
            <a href={travelBookingUrl(homeCity, d.name, transport)} target="_blank" rel="noopener noreferrer"
              className="h-9 px-3 rounded-full border border-line text-xs text-muted hover:border-stone-400 hover:text-ink transition">
              {transportLabel}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
