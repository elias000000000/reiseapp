"use client";
import { useState } from "react";
import { useProfile } from "@/stores/profile-store";
import type { TransportMode } from "@/lib/travel-time";

const CITIES = [
  { name: "Zürich",      lat: 47.3769, lng:  8.5417, currency: "CHF" as const },
  { name: "Bern",        lat: 46.9481, lng:  7.4474, currency: "CHF" as const },
  { name: "Basel",       lat: 47.5596, lng:  7.5886, currency: "CHF" as const },
  { name: "Wien",        lat: 48.2082, lng: 16.3738, currency: "EUR" as const },
  { name: "München",     lat: 48.1351, lng: 11.5820, currency: "EUR" as const },
  { name: "Berlin",      lat: 52.5200, lng: 13.4050, currency: "EUR" as const },
  { name: "Hamburg",     lat: 53.5511, lng:  9.9937, currency: "EUR" as const },
  { name: "Frankfurt",   lat: 50.1109, lng:  8.6821, currency: "EUR" as const },
  { name: "Stuttgart",   lat: 48.7758, lng:  9.1829, currency: "EUR" as const },
  { name: "Düsseldorf",  lat: 51.2217, lng:  6.7762, currency: "EUR" as const },
];

const TRANSPORT: { mode: TransportMode; label: string; sub: string }[] = [
  { mode: "train",  label: "Zug",   sub: "Komfortabel & direkt" },
  { mode: "flight", label: "Flug",  sub: "Für grosse Distanzen" },
  { mode: "car",    label: "Auto",  sub: "Flexibel & frei" },
];

const STYLES: { s: "solo" | "couple" | "family" | "friends"; label: string }[] = [
  { s: "solo",    label: "Solo" },
  { s: "couple",  label: "Paar" },
  { s: "family",  label: "Familie" },
  { s: "friends", label: "Freunde" },
];

export function ProfileSetup({ onDone }: { onDone: () => void }) {
  const { profile, setProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [cityInput, setCityInput] = useState(profile.homeCity || "");

  const selectCity = (c: (typeof CITIES)[0]) => {
    setProfile({ homeCity: c.name, homeLat: c.lat, homeLng: c.lng, currency: c.currency });
    setCityInput(c.name);
  };

  const finish = () => {
    setProfile({ setupDone: true });
    onDone();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,25,35,0.97)" }}
    >
      {/* Hero background */}
      <img
        src="https://picsum.photos/seed/travelsetup/1920/1080"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-15"
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Step indicator */}
        <div className="flex gap-1.5 justify-center mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-0.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 32 : 12,
                backgroundColor:
                  i <= step ? "#B45309" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          {/* Step 1 — Heimatstadt */}
          {step === 0 && (
            <div className="p-8">
              <p className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-1">
                Schritt 1 von 3
              </p>
              <h1 className="text-2xl font-bold text-stone-900 mt-2 leading-tight">
                Wo wohnst du?
              </h1>
              <p className="text-stone-500 mt-2 text-sm leading-relaxed">
                Dein Startpunkt für Reisezeiten und Empfehlungen.
              </p>

              <div className="flex flex-wrap gap-2 mt-6 mb-4">
                {CITIES.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => selectCity(c)}
                    className="px-3 py-1.5 rounded-full border text-sm transition"
                    style={{
                      backgroundColor:
                        cityInput === c.name ? "#1A1714" : "transparent",
                      color: cityInput === c.name ? "#FFFFFF" : "#44403C",
                      borderColor:
                        cityInput === c.name ? "#1A1714" : "#D6D3D1",
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Andere Stadt eingeben…"
                value={cityInput}
                onChange={(e) => {
                  setCityInput(e.target.value);
                  setProfile({ homeCity: e.target.value });
                }}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none transition"
                style={{ borderColor: cityInput && !CITIES.find(c => c.name === cityInput) ? "#92400E" : undefined }}
              />

              <button
                disabled={!cityInput.trim()}
                onClick={() => setStep(1)}
                className="mt-6 w-full h-11 text-white rounded-full font-semibold text-sm disabled:opacity-40 transition"
                style={{ backgroundColor: "#1A1714" }}
              >
                Weiter
              </button>
            </div>
          )}

          {/* Step 2 — Transport */}
          {step === 1 && (
            <div className="p-8">
              <p className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-1">
                Schritt 2 von 3
              </p>
              <h2 className="text-2xl font-bold text-stone-900 mt-2 leading-tight">
                Wie reist du?
              </h2>
              <p className="text-stone-500 mt-2 text-sm">
                Dein bevorzugtes Verkehrsmittel.
              </p>

              <div className="flex flex-col gap-2.5 mt-6">
                {TRANSPORT.map(({ mode, label, sub }) => {
                  const active = profile.preferredTransport === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setProfile({ preferredTransport: mode })}
                      className="p-4 rounded-xl border-2 text-left transition"
                      style={{
                        borderColor: active ? "#1A1714" : "#E7E5E4",
                        backgroundColor: active ? "#FAFAF9" : "transparent",
                      }}
                    >
                      <div
                        className="text-sm font-semibold"
                        style={{ color: active ? "#1A1714" : "#44403C" }}
                      >
                        {label}
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">{sub}</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-stone-800">
                    Maximale Reisezeit
                  </p>
                  <span className="text-sm font-semibold" style={{ color: "#92400E" }}>
                    {profile.maxTravelHours} Std.
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={24}
                  step={1}
                  value={profile.maxTravelHours}
                  onChange={(e) =>
                    setProfile({ maxTravelHours: Number(e.target.value) })
                  }
                  className="w-full"
                  style={{ accentColor: "#92400E" }}
                />
                <div className="flex justify-between text-xs text-stone-400 mt-1">
                  <span>2 Std.</span>
                  <span>24 Std.</span>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 h-11 border border-stone-200 rounded-full text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
                >
                  Zurück
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 h-11 text-white rounded-full text-sm font-semibold transition"
                  style={{ backgroundColor: "#1A1714" }}
                >
                  Weiter
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Currency + Style */}
          {step === 2 && (
            <div className="p-8">
              <p className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-1">
                Schritt 3 von 3
              </p>
              <h2 className="text-2xl font-bold text-stone-900 mt-2 leading-tight">
                Letzte Details
              </h2>
              <p className="text-stone-500 mt-2 text-sm">
                Währung und Reisestil für passende Empfehlungen.
              </p>

              <div className="mt-6">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2.5">
                  Referenzwährung
                </p>
                <div className="flex gap-2">
                  {(["CHF", "EUR", "USD", "GBP"] as const).map((c) => {
                    const active = profile.currency === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setProfile({ currency: c })}
                        className="flex-1 py-2.5 rounded-full text-sm font-medium transition"
                        style={{
                          backgroundColor: active ? "#1A1714" : "transparent",
                          color: active ? "#FFFFFF" : "#44403C",
                          border: `1px solid ${active ? "#1A1714" : "#D6D3D1"}`,
                        }}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2.5">
                  Reisestil
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map(({ s, label }) => {
                    const active = profile.travelStyle === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setProfile({ travelStyle: s })}
                        className="py-3 rounded-xl text-sm font-medium transition"
                        style={{
                          border: `2px solid ${active ? "#1A1714" : "#E7E5E4"}`,
                          backgroundColor: active ? "#FAFAF9" : "transparent",
                          color: active ? "#1A1714" : "#78716C",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 h-11 border border-stone-200 rounded-full text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
                >
                  Zurück
                </button>
                <button
                  onClick={finish}
                  className="flex-1 h-11 text-white rounded-full text-sm font-semibold transition"
                  style={{ backgroundColor: "#92400E" }}
                >
                  Alles bereit
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Alle Daten bleiben lokal auf deinem Gerät.
        </p>
      </div>
    </div>
  );
}
