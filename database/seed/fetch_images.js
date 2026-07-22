/**
 * fetch_images.js — Bilder-Pipeline (Pexels).
 *
 * Modus 1 (Default):  node database/seed/fetch_images.js
 *   Holt fuer jede Destination OHNE image_url ein passendes Foto ueber die
 *   Pexels-API und schreibt image_url (CDN-Hotlink, large2x) + image_attribution
 *   in Supabase. Resumierbar/idempotent: bereits befuellte Orte werden
 *   uebersprungen — bei Rate-Limits einfach spaeter erneut ausfuehren.
 *
 * Modus 2:  node database/seed/fetch_images.js --static
 *   Laedt ~15 kuratierte statische Assets (Welcome-Hero, Achsen-Pol-Bilder,
 *   Kategorie-Fallbacks) als Dateien nach frontend/public/images/ herunter und
 *   schreibt dort ATTRIBUTION.md. Bewusst public/ statt src/assets/: die App
 *   referenziert die Bilder per URL und bleibt auch OHNE die Dateien lauffaehig
 *   (Gradient-Fallback) — kein Build-Bruch vor dem ersten Lauf. Dateien sind
 *   spaeter trivial durch eigene Fotos ersetzbar (gleicher Dateiname genuegt).
 *
 * Voraussetzungen (backend/.env):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (nur Modus 1)
 *   PEXELS_API_KEY                            (beide Modi; kostenlos: pexels.com/api)
 *   Migration 003 muss ausgefuehrt sein (image_url/image_attribution-Spalten).
 */

const fs = require("fs");
const path = require("path");

// --- .env laden (gleiches Muster wie seed_destinations.js) -----------------
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

const PEXELS_KEY = process.env.PEXELS_API_KEY;
if (!PEXELS_KEY) {
  console.error(
    "PEXELS_API_KEY fehlt. Kostenlosen Key unter https://www.pexels.com/api/ erstellen " +
      "und in backend/.env eintragen."
  );
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Pexels-Suche mit Rate-Limit-Handling (429 -> warten -> retry). */
async function pexelsSearch(query, orientation = "landscape") {
  const url =
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}` +
    `&orientation=${orientation}&per_page=3`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
    if (res.status === 429) {
      const wait = Number(res.headers.get("Retry-After") ?? 60);
      console.log(`  Rate-Limit erreicht — warte ${wait}s ...`);
      await sleep(wait * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`Pexels-Fehler ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.photos?.[0] ?? null;
  }
  throw new Error("Pexels-Rate-Limit auch nach Wartezeit aktiv — spaeter erneut ausfuehren.");
}

// --- Modus 1: Destinations in Supabase befuellen ---------------------------

// Leit-Kategorie -> englischer Such-Hinweis (Pexels-Suche ist auf Englisch am
// staerksten; Ortsnamen funktionieren sprachuebergreifend).
const CATEGORY_HINTS = {
  Natur: "landscape nature", Berge: "mountains", Wandern: "mountains hiking",
  Insel: "island coast aerial", Strand: "beach turquoise", Stadt: "city",
  Skyline: "city skyline", Kultur: "historic architecture", Abenteuer: "dramatic landscape",
  Roadtrip: "scenic road landscape", Backpacking: "travel landscape",
  Wildlife: "wildlife", Winter: "winter landscape snow", Wueste: "desert dunes",
};

function cleanName(name) {
  // "Azoren - Flores" -> "Azoren Flores"; Klammerzusaetze entfernen
  return name.replace(/\(.*?\)/g, "").replace(/[&\-–]/g, " ").replace(/\s+/g, " ").trim();
}

async function runDestinations() {
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: rows, error } = await supabase
    .from("destinations")
    .select("id, name, country, categories, image_url")
    .is("image_url", null)
    .order("id");
  if (error) throw new Error(`Supabase-Abfrage fehlgeschlagen: ${error.message}`);

  console.log(`${rows.length} Orte ohne Bild.`);
  let done = 0, misses = 0;

  for (const row of rows) {
    const hint = CATEGORY_HINTS[row.categories?.[0]] ?? "landscape";
    const base = cleanName(row.name);
    // Fallback-Kaskade: Name+Hinweis -> nur Name -> Land+Hinweis
    const queries = [`${base} ${hint}`, base, `${cleanName(row.country)} ${hint}`];

    let photo = null;
    for (const q of queries) {
      photo = await pexelsSearch(q);
      if (photo) break;
      await sleep(350);
    }

    if (!photo) {
      misses++;
      console.log(`  KEIN TREFFER: ${row.id}`);
      continue; // bleibt NULL -> Frontend-Kategorie-Fallback
    }

    const { error: upError } = await supabase
      .from("destinations")
      .update({
        image_url: photo.src.large2x,
        image_attribution: `Foto: ${photo.photographer} / Pexels`,
      })
      .eq("id", row.id);
    if (upError) throw new Error(`Update ${row.id} fehlgeschlagen: ${upError.message}`);

    done++;
    if (done % 20 === 0) console.log(`  ${done}/${rows.length} ...`);
    await sleep(350); // ~170 Anfragen/h unter dem 200er-Limit halten
  }
  console.log(`Fertig. Befuellt: ${done}, ohne Treffer: ${misses}.`);
}

// --- Modus 2: statische Frontend-Assets ------------------------------------

const STATIC_ASSETS = [
  { file: "welcome-hero.jpg",    query: "dramatic mountain coastline sunrise",  orientation: "portrait" },
  { file: "pole-nature.jpg",     query: "alpine lake turquoise mountains",      orientation: "square" },
  { file: "pole-city.jpg",       query: "city skyline dusk lights",             orientation: "square" },
  { file: "pole-active.jpg",     query: "hiker mountain ridge trail",           orientation: "square" },
  { file: "pole-relax.jpg",      query: "infinity pool ocean sunset",           orientation: "square" },
  { file: "pole-iconic.jpg",     query: "machu picchu",                         orientation: "square" },
  { file: "pole-hidden.jpg",     query: "remote fjord cabin solitude",          orientation: "square" },
  { file: "pole-luxury.jpg",     query: "luxury lodge terrace view",            orientation: "square" },
  { file: "pole-authentic.jpg",  query: "local street market travel",           orientation: "square" },
  { file: "fallback-berge.jpg",  query: "dramatic mountain peaks",              orientation: "landscape" },
  { file: "fallback-strand.jpg", query: "tropical beach turquoise aerial",      orientation: "landscape" },
  { file: "fallback-stadt.jpg",  query: "european old town street evening",     orientation: "landscape" },
  { file: "fallback-natur.jpg",  query: "waterfall forest green landscape",     orientation: "landscape" },
  { file: "fallback-wueste.jpg", query: "desert dunes golden hour",             orientation: "landscape" },
  { file: "fallback-insel.jpg",  query: "island lagoon aerial",                 orientation: "landscape" },
];

async function runStatic() {
  const assetDir = path.join(__dirname, "..", "..", "frontend", "public", "images");
  fs.mkdirSync(assetDir, { recursive: true });
  const attribution = ["# Bild-Nachweise (automatisch bezogen via Pexels)", ""];

  for (const asset of STATIC_ASSETS) {
    const target = path.join(assetDir, asset.file);
    if (fs.existsSync(target)) {
      console.log(`  vorhanden, uebersprungen: ${asset.file}`);
      continue;
    }
    const photo = await pexelsSearch(asset.query, asset.orientation);
    if (!photo) {
      console.log(`  KEIN TREFFER: ${asset.file} (${asset.query})`);
      continue;
    }
    const res = await fetch(photo.src.large2x);
    if (!res.ok) throw new Error(`Download fehlgeschlagen: ${asset.file}`);
    fs.writeFileSync(target, Buffer.from(await res.arrayBuffer()));
    attribution.push(`- ${asset.file}: Foto von ${photo.photographer} / Pexels (${photo.url})`);
    console.log(`  geladen: ${asset.file} (${photo.photographer})`);
    await sleep(350);
  }

  fs.writeFileSync(path.join(assetDir, "ATTRIBUTION.md"), attribution.join("\n") + "\n");
  console.log(`Fertig. Assets in ${assetDir}`);
}

// ---------------------------------------------------------------------------

(process.argv.includes("--static") ? runStatic() : runDestinations()).catch((e) => {
  console.error(e);
  process.exit(1);
});
