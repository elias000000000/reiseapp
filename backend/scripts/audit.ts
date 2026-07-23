// Einmaliges Release-Audit: Datenqualität + Plausibilität der harten Filter.
// Läuft direkt gegen die echte Supabase (Service-Role), umgeht HTTP/Auth/Claude.
// Aufruf:  npx tsx scripts/audit.ts
import "dotenv/config";
import { supabase } from "../src/config/supabaseClient.js";
import { filterDestinations, DESTINATION_COLUMNS } from "../src/services/destinationFilter.service.js";
import { DestinationRowSchema, type Phase1Answers } from "../src/types/qa.types.js";

const ZURICH = { lat: 47.3769, lng: 8.5417 };
const EARTH = 6371;
function km(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(lat2 - lat1), dLng = r(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH * Math.asin(Math.sqrt(a));
}

function base(overrides: Partial<Phase1Answers> = {}): Phase1Answers {
  return {
    origin_lat: ZURICH.lat, origin_lng: ZURICH.lng, origin_label: "Zürich",
    duration_days: 2, travel_months: [], budget_level: "mittel",
    party_type: "paar", comfort_zone: "ausgewogen", car_preference: "wenn_noetig",
    ...overrides,
  };
}

async function main() {
  // --- 1. Alle Ziele laden --------------------------------------------------
  const { data, error } = await supabase.from("destinations").select(DESTINATION_COLUMNS);
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((r) => DestinationRowSchema.parse(r));
  console.log(`\n=== DATENQUALITÄT (${rows.length} Ziele) ===`);

  // Koordinaten-Abdeckung
  const noCoords = rows.filter((d) => d.latitude === null || d.longitude === null);
  console.log(`Ohne Koordinaten: ${noCoords.length}/${rows.length}`);
  for (const d of noCoords) {
    console.log(`  ⚠ ${d.name}, ${d.country} [${d.continent}] — umgeht Distanzfilter!`);
  }

  // Weit entfernte Ziele ohne Koordinaten = akutes Risiko für "2 Tage → Fernreise"
  const farNoCoordContinents = new Set(["Asien", "Afrika", "Nordamerika", "Südamerika", "Ozeanien", "Asia", "Africa", "North America", "South America", "Oceania"]);
  const dangerous = noCoords.filter((d) => farNoCoordContinents.has(d.continent));
  if (dangerous.length) {
    console.log(`\n🔴 ${dangerous.length} FERN-Ziele OHNE Koordinaten (würden bei 2-Tage-Reise durchrutschen):`);
    dangerous.forEach((d) => console.log(`  - ${d.name}, ${d.country} [${d.continent}]`));
  }

  // Datenfelder-Sanity
  const numericKeys = ["nature_score","photography_score","adventure_score","hiking_score","city_score","culture_score","beach_score","wildlife_score","nightlife_score","luxury_score","budget_score","tourist_density_score","wow_factor_score","safety_score","trip_effort_score","season_flexibility_score","flight_access_score"] as const;
  const outOfRange = rows.filter((d) => numericKeys.some((k) => (d as any)[k] < 0 || (d as any)[k] > 100));
  console.log(`\nScores außerhalb 0-100: ${outOfRange.length}`);
  outOfRange.forEach((d) => console.log(`  - ${d.name}: ${numericKeys.filter((k)=>(d as any)[k]<0||(d as any)[k]>100).map((k)=>`${k}=${(d as any)[k]}`).join(", ")}`));

  const noMonths = rows.filter((d) => d.best_months.length === 0);
  console.log(`Ohne best_months: ${noMonths.length}${noMonths.length ? " → " + noMonths.map(d=>d.name).join(", ") : ""}`);
  const badMonths = rows.filter((d) => d.best_months.some((m) => m < 1 || m > 12));
  console.log(`Ungültige best_months (nicht 1-12): ${badMonths.length}${badMonths.length ? " → " + badMonths.map(d=>d.name).join(", ") : ""}`);
  const badDays = rows.filter((d) => d.minimum_days < 1 || d.ideal_days < d.minimum_days);
  console.log(`Unplausible Tage (min<1 oder ideal<min): ${badDays.length}${badDays.length ? " → " + badDays.map(d=>`${d.name}(min=${d.minimum_days},ideal=${d.ideal_days})`).join(", ") : ""}`);
  const noImage = rows.filter((d) => !d.image_url);
  console.log(`Ohne Bild: ${noImage.length}/${rows.length}`);

  // Budget-Verteilung
  const byBudget: Record<string, number> = {};
  rows.forEach((d) => (byBudget[d.estimated_budget_level] = (byBudget[d.estimated_budget_level] ?? 0) + 1));
  console.log(`Budget-Verteilung:`, byBudget);

  // Koordinaten-Sanity: Distanz von Zürich, extremste 5
  const withCoords = rows.filter((d) => d.latitude !== null && d.longitude !== null)
    .map((d) => ({ d, km: Math.round(km(ZURICH.lat, ZURICH.lng, d.latitude!, d.longitude!)) }))
    .sort((a, b) => b.km - a.km);
  console.log(`\nEntfernteste 5 (mit Koordinaten):`);
  withCoords.slice(0, 5).forEach((x) => console.log(`  ${x.km} km — ${x.d.name}, ${x.d.country}`));

  // --- 2. Plausibilität der harten Filter (Zürich) --------------------------
  const scenarios: { label: string; ans: Phase1Answers; maxKmExpected: number }[] = [
    { label: "2 Tage, mittel, ausgewogen", ans: base({ duration_days: 2 }), maxKmExpected: 1500 },
    { label: "3 Tage, mittel, ausgewogen", ans: base({ duration_days: 3 }), maxKmExpected: 1500 },
    { label: "5 Tage, gehoben, abenteuer", ans: base({ duration_days: 5, budget_level: "gehoben", comfort_zone: "abenteuer" }), maxKmExpected: 6000 },
    { label: "14 Tage, hoch, abenteuer", ans: base({ duration_days: 14, budget_level: "hoch", comfort_zone: "abenteuer" }), maxKmExpected: Infinity },
    { label: "2 Tage, niedrig, sicher", ans: base({ duration_days: 2, budget_level: "niedrig", comfort_zone: "sicher" }), maxKmExpected: 1500 },
  ];

  console.log(`\n=== HARTE-FILTER-PLAUSIBILITÄT (Startort Zürich) ===`);
  for (const s of scenarios) {
    const result = await filterDestinations(s.ans);
    const violations = result.filter((d) => {
      if (d.latitude === null || d.longitude === null) return false; // separat erfasst
      return km(ZURICH.lat, ZURICH.lng, d.latitude, d.longitude) > s.maxKmExpected + 200; // 200km Toleranz an Bandgrenze
    });
    const coordless = result.filter((d) => d.latitude === null || d.longitude === null);
    console.log(`\n[${s.label}] → ${result.length} Kandidaten`);
    if (violations.length) {
      console.log(`  🔴 ${violations.length} ZU WEIT (> ${s.maxKmExpected}km):`);
      violations.slice(0, 8).forEach((d) => console.log(`     ${Math.round(km(ZURICH.lat,ZURICH.lng,d.latitude!,d.longitude!))}km — ${d.name}, ${d.country}`));
    }
    if (coordless.length) {
      console.log(`  ⚠ ${coordless.length} ohne Koordinaten (ungeprüft): ${coordless.map((d)=>`${d.name}[${d.continent}]`).join(", ")}`);
    }
    if (!violations.length && !coordless.length) console.log(`  ✅ alle Kandidaten plausibel im Distanzband`);
  }
  console.log("\n=== AUDIT FERTIG ===\n");
}

main().catch((e) => { console.error("AUDIT-FEHLER:", e); process.exit(1); });
