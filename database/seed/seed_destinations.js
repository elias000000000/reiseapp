/**
 * seed_destinations.js — Importiert database/seed/destinations.json nach Supabase.
 *
 * Voraussetzungen:
 *   1. Migration ausfuehren: database/migrations/001_create_destinations.sql
 *      im Supabase SQL-Editor laufen lassen.
 *   2. Abhaengigkeit: @supabase/supabase-js (bereits im Projekt installiert).
 *   3. In .env (Projekt-Root) setzen:
 *        SUPABASE_URL=https://<projekt>.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # NICHT der anon-Key!
 *      (Der Service-Role-Key umgeht RLS und darf nur lokal/serverseitig genutzt werden.)
 *
 * Ausfuehren (aus dem Projekt-Root):
 *   node database/seed/seed_destinations.js
 *
 * Idempotent: upsert auf "id", beliebig oft wiederholbar.
 */

const fs = require("fs");
const path = require("path");

// --- .env / .env.local minimal laden (ohne dotenv-Abhaengigkeit) -----------
function loadEnv() {
  const root = path.join(__dirname, "..", ".."); // Projekt-Root relativ zu database/seed/
  const roots = [
    process.cwd(),
    root,
    path.join(root, "backend"), // Backend nutzt dieselben SUPABASE_*-Variablen
  ];
  const names = [".env", ".env.local"];
  for (const dir of roots) {
    for (const name of names) {
      const p = path.join(dir, name);
      if (!fs.existsSync(p)) continue;
      for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
        }
      }
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Fehlende Umgebungsvariablen. Bitte SUPABASE_URL und " +
      "SUPABASE_SERVICE_ROLE_KEY in .env setzen."
  );
  process.exit(1);
}

let createClient;
try {
  ({ createClient } = require("@supabase/supabase-js"));
} catch {
  console.error("Bitte zuerst installieren:  npm i @supabase/supabase-js");
  process.exit(1);
}

async function main() {
  const file = path.join(__dirname, "destinations.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const rows = data.destinations;
  if (!Array.isArray(rows) || rows.length === 0) {
    console.error("Keine Orte in destinations.json gefunden.");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const CHUNK = 100;
  let done = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from("destinations")
      .upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error(`Fehler bei Batch ${i / CHUNK + 1}:`, error.message);
      process.exit(1);
    }
    done += chunk.length;
    console.log(`  importiert: ${done}/${rows.length}`);
  }

  const { count } = await supabase
    .from("destinations")
    .select("*", { count: "exact", head: true });
  console.log(`Fertig. Orte in der Tabelle: ${count}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
