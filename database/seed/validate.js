// Konsistenz-Validierung fuer alle Batch-Dateien + die 18 Kalibrierungsorte.
// Nutzung: node _build/validate.js  (aus dem database/-Ordner)
const fs = require("fs");
const path = require("path");

const ORDER = ["id","name","country","region","continent","categories","description","highlights","nature_score","photography_score","adventure_score","hiking_score","city_score","culture_score","beach_score","wildlife_score","nightlife_score","luxury_score","budget_score","tourist_density_score","wow_factor_score","best_months","minimum_days","ideal_days","estimated_budget_level","flight_access_score","car_needed","solo_friendly","safety_score","trip_effort_score","season_flexibility_score"];
const SCORE_FIELDS = ORDER.filter(k => k.endsWith("_score"));
const CATS = ["Natur","Berge","Wandern","Insel","Strand","Stadt","Skyline","Kultur","Abenteuer","Roadtrip","Backpacking","Wildlife","Winter","Wueste"];
const CONTINENTS = ["Europa","Asien","Nordamerika","Suedamerika","Afrika","Ozeanien","Sonderregion"];
const BUDGET = { niedrig:[75,100], mittel:[55,74], gehoben:[35,54], hoch:[0,34] };

function loadAll() {
  // Kanonische Quelle ist die finale destinations.json. Die Batch-Dateien in
  // diesem Ordner sind nur Bau-Artefakte und wurden bereits eingemergt.
  const recs = [];
  const dj = path.join(__dirname, "destinations.json");
  if (fs.existsSync(dj)) {
    const d = JSON.parse(fs.readFileSync(dj, "utf8"));
    if (d.destinations) recs.push(...d.destinations.map(x => ({ ...x, _src: "destinations.json" })));
  }
  return recs;
}

function validate(recs) {
  const errors = [], warns = [];
  const ids = new Set();
  for (const x of recs) {
    const tag = `[${x._src}] ${x.id || "(ohne id)"}`;
    // Feldvollstaendigkeit
    for (const k of ORDER) if (!(k in x)) errors.push(`${tag}: fehlt Feld ${k}`);
    const extra = Object.keys(x).filter(k => k !== "_src" && !ORDER.includes(k));
    if (extra.length) errors.push(`${tag}: unbekannte Felder ${extra.join(",")}`);
    // ID eindeutig + slug
    if (x.id) {
      if (ids.has(x.id)) errors.push(`${tag}: doppelte id`);
      ids.add(x.id);
      if (!/^[a-z0-9_]+$/.test(x.id)) errors.push(`${tag}: id kein sauberer slug`);
    }
    // Score-Ranges
    for (const s of SCORE_FIELDS) if (typeof x[s] === "number" && (x[s] < 0 || x[s] > 100)) errors.push(`${tag}: ${s}=${x[s]} out of range`);
    // Kontinent
    if (!CONTINENTS.includes(x.continent)) errors.push(`${tag}: continent ungueltig (${x.continent})`);
    // Kategorien
    if (Array.isArray(x.categories)) {
      for (const c of x.categories) if (!CATS.includes(c)) errors.push(`${tag}: Kategorie ungueltig (${c})`);
      if (x.categories.length === 0) errors.push(`${tag}: keine Kategorie`);
    }
    // Tage
    if (x.ideal_days < x.minimum_days) errors.push(`${tag}: ideal_days<minimum_days`);
    // best_months
    if (Array.isArray(x.best_months)) for (const m of x.best_months) if (m < 1 || m > 12) errors.push(`${tag}: best_month ungueltig (${m})`);
    // Budget-Mapping
    const b = BUDGET[x.estimated_budget_level];
    if (!b) errors.push(`${tag}: estimated_budget_level ungueltig (${x.estimated_budget_level})`);
    else if (x.budget_score < b[0] || x.budget_score > b[1]) errors.push(`${tag}: budget_score ${x.budget_score} passt nicht zu ${x.estimated_budget_level} (${b[0]}-${b[1]})`);
    // Kategorie<->Score-Koheraenz (Warnungen)
    const need = { Strand:["beach_score",60], Wildlife:["wildlife_score",60], Wandern:["hiking_score",60], Stadt:["city_score",55], Skyline:["city_score",70] };
    for (const c of (x.categories||[])) if (need[c] && x[need[c][0]] < need[c][1]) warns.push(`${tag}: Kategorie ${c} aber ${need[c][0]}=${x[need[c][0]]} (<${need[c][1]})`);
    // description Unsicherheits-Hinweis nicht erzwungen
    if (typeof x.description === "string" && x.description.length < 60) warns.push(`${tag}: description sehr kurz`);
  }
  return { errors, warns, count: recs.length, ids };
}

const recs = loadAll();
const { errors, warns, count } = validate(recs);
// Kontinent-Verteilung
const byCont = {};
for (const x of recs) byCont[x.continent] = (byCont[x.continent]||0)+1;
// wow-Verteilung
const wow90 = recs.filter(x => x.wow_factor_score >= 90).length;
const wowBuckets = { "<50":0,"50-69":0,"70-84":0,"85-89":0,"90+":0 };
for (const x of recs) { const w=x.wow_factor_score; if(w<50)wowBuckets["<50"]++;else if(w<70)wowBuckets["50-69"]++;else if(w<85)wowBuckets["70-84"]++;else if(w<90)wowBuckets["85-89"]++;else wowBuckets["90+"]++; }

console.log("=== VALIDIERUNG ===");
console.log("Orte gesamt:", count);
console.log("Kontinent-Verteilung:", JSON.stringify(byCont));
console.log("wow-Verteilung:", JSON.stringify(wowBuckets), `| >=90: ${wow90} (${(wow90/count*100).toFixed(0)}%)`);
console.log("Warnungen:", warns.length);
warns.slice(0,40).forEach(w => console.log("  WARN", w));
console.log("Fehler:", errors.length);
errors.slice(0,80).forEach(e => console.log("  ERR ", e));
if (errors.length) process.exit(1);
console.log("OK - keine Fehler.");
