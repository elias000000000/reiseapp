/**
 * fetch_coordinates.js — Koordinaten-Pipeline (OpenStreetMap Nominatim).
 *
 * node database/seed/fetch_coordinates.js
 *
 * Holt fuer jede Destination OHNE latitude/longitude Koordinaten ueber
 * Nominatim und schreibt sie in Supabase. Resumierbar/idempotent: bereits
 * befuellte Orte werden uebersprungen. Kein API-Key noetig, aber striktes
 * Rate-Limit (1 Anfrage/Sekunde) laut Nominatim-Nutzungsrichtlinie.
 *
 * Voraussetzungen (backend/.env): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Migration 005 muss ausgefuehrt sein (latitude/longitude-Spalten).
 */

const fs = require("fs");
const path = require("path");

function loadEnv() {
  const root = path.join(__dirname, "..", "..");
  for (const dir of [process.cwd(), root, path.join(root, "backend")]) {
    for (const name of [".env", ".env.local"]) {
      const p = path.join(dir, name);
      if (!fs.existsSync(p)) continue;
      for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}
loadEnv();

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Reiseapp/0.1 (privates Projekt, einmaliges Destination-Geocoding)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cleanName(name) {
  return name.replace(/\(.*?\)/g, "").replace(/[&\-–]/g, " ").replace(/\s+/g, " ").trim();
}

async function geocode(query) {
  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Nominatim-Fehler ${res.status}`);
  const results = await res.json();
  return results[0] ?? null;
}

async function main() {
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: rows, error } = await supabase
    .from("destinations")
    .select("id, name, country")
    .is("latitude", null)
    .order("id");
  if (error) throw new Error(`Supabase-Abfrage fehlgeschlagen: ${error.message}`);

  console.log(`${rows.length} Orte ohne Koordinaten.`);
  let done = 0, misses = 0;

  for (const row of rows) {
    const base = cleanName(row.name);
    // Fallback-Kaskade: Name+Land -> nur Name -> nur Land
    const queries = [`${base}, ${cleanName(row.country)}`, base, cleanName(row.country)];

    let hit = null;
    for (const q of queries) {
      hit = await geocode(q);
      await sleep(1100); // 1 Anfrage/Sekunde einhalten
      if (hit) break;
    }

    if (!hit) {
      misses++;
      console.log(`  KEIN TREFFER: ${row.id}`);
      continue;
    }

    const { error: upError } = await supabase
      .from("destinations")
      .update({ latitude: Number(hit.lat), longitude: Number(hit.lon) })
      .eq("id", row.id);
    if (upError) throw new Error(`Update ${row.id} fehlgeschlagen: ${upError.message}`);

    done++;
    if (done % 25 === 0) console.log(`  ${done}/${rows.length} ...`);
  }
  console.log(`Fertig. Befuellt: ${done}, ohne Treffer: ${misses}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
