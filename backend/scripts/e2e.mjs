// E2E-Test der /recommendations-Pipeline gegen das laufende lokale Backend.
// Token via Umgebungsvariable TOKEN. Aufruf:  TOKEN=<jwt> node scripts/e2e.mjs
const TOKEN = process.env.TOKEN;
const API = process.env.API_URL || "http://localhost:3001";
if (!TOKEN) { console.error("TOKEN env fehlt"); process.exit(1); }

const ZURICH = { origin_lat: 47.3769, origin_lng: 8.5417, origin_label: "Zürich" };

function profile(over = {}) {
  return {
    ...ZURICH,
    duration_days: 5, travel_months: [], budget_level: "mittel",
    party_type: "paar", comfort_zone: "ausgewogen", car_preference: "wenn_noetig",
    axis_nature_city: 0, axis_activity_relax: 0, axis_iconic_hidden: 0, axis_luxury_authentic: 0,
    axis_photogenic_importance: null, exploration_level: 50,
    ...over,
  };
}

const cases = [
  { label: "2T · mittel · paar · ausgewogen · Natur", body: profile({ duration_days: 2, axis_nature_city: -80 }) },
  { label: "5T · gehoben · solo · abenteuer · Natur+Aktiv", body: profile({ duration_days: 5, budget_level: "gehoben", party_type: "solo", comfort_zone: "abenteuer", axis_nature_city: -70, axis_activity_relax: -80 }) },
  { label: "10T · hoch · freunde · abenteuer · Stadt+Nightlife", body: profile({ duration_days: 10, budget_level: "hoch", party_type: "freunde", comfort_zone: "abenteuer", axis_nature_city: 90 }) },
  { label: "7T · niedrig · familie · sicher", body: profile({ duration_days: 7, budget_level: "niedrig", party_type: "familie", comfort_zone: "sicher" }) },
  { label: "14T · hoch · paar · abenteuer · Hidden Gems", body: profile({ duration_days: 14, budget_level: "hoch", comfort_zone: "abenteuer", axis_iconic_hidden: 90 }) },
  { label: "EDGE 1T (sehr kurz)", body: profile({ duration_days: 1 }) },
  { label: "EDGE Januar-Reise 6T", body: profile({ duration_days: 6, travel_months: [1] }) },
];

const started = Date.now();
for (const c of cases) {
  const t0 = Date.now();
  try {
    const res = await fetch(`${API}/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify(c.body),
    });
    const ms = Date.now() - t0;
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.log(`\n[${c.label}] → HTTP ${res.status} (${ms}ms) code=${data?.code ?? "?"} ${data?.error ?? ""}`);
      continue;
    }
    const recs = data.recommendations ?? [];
    console.log(`\n[${c.label}] → ${recs.length} Empfehlungen (${ms}ms)`);
    for (const r of recs) {
      const reason = (r.reasoning ?? "").replace(/\s+/g, " ").slice(0, 90);
      console.log(`   #${r.rank} ${r.name}  [match ${r.match_score ?? "–"}]  ${reason}…`);
    }
    // Sanity: ranks lückenlos ab 1, match_score im Band 75-98, reasoning nicht leer
    const issues = [];
    recs.forEach((r, i) => {
      if (r.rank !== i + 1) issues.push(`rank ${r.rank}≠${i + 1}`);
      if (r.match_score != null && (r.match_score < 75 || r.match_score > 98)) issues.push(`match ${r.match_score} außerhalb 75-98`);
      if (!r.reasoning || r.reasoning.length < 10) issues.push(`#${r.rank} reasoning zu kurz`);
      if (!r.name || r.name === r.destination_id) issues.push(`#${r.rank} name fehlt`);
    });
    if (issues.length) console.log(`   ⚠ ${issues.join("; ")}`);
  } catch (e) {
    console.log(`\n[${c.label}] → FEHLER: ${e.message}`);
  }
}
console.log(`\n=== E2E FERTIG in ${((Date.now() - started) / 1000).toFixed(1)}s ===`);
