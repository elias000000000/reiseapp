// Einmaliges Icon-Script: erzeugt PWA-Icons aus einem font-freien SVG-Mark
// (Horizont-Motiv: Sonne + Wellenlinie auf Petrol). Ausfuehren: npm run icons

import sharp from "sharp";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
mkdirSync(pub, { recursive: true });

// padding 0 = volles Motiv, >0 = Sicherheitsrand (maskable)
function markSvg(padding = 0) {
  const p = padding;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${p > 0 ? 0 : 116}" fill="#0C6170"/>
  <g transform="translate(${p} ${p}) scale(${(512 - 2 * p) / 512})">
    <circle cx="330" cy="200" r="58" fill="#F8F7F5"/>
    <path d="M70 330 Q 160 290 256 330 T 442 330" stroke="#F8F7F5" stroke-width="26"
          stroke-linecap="round" fill="none"/>
    <path d="M110 396 Q 185 366 256 396 T 402 396" stroke="#F8F7F5" stroke-width="26"
          stroke-linecap="round" fill="none" opacity="0.55"/>
  </g>
</svg>`);
}

const jobs = [
  { file: "icon-192.png", size: 192, padding: 0 },
  { file: "icon-512.png", size: 512, padding: 0 },
  { file: "icon-maskable-512.png", size: 512, padding: 60 },
  { file: "apple-touch-icon.png", size: 180, padding: 0 },
];

for (const job of jobs) {
  await sharp(markSvg(job.padding)).resize(job.size, job.size).png().toFile(join(pub, job.file));
  console.log(`  ${job.file}`);
}
console.log("Icons erzeugt.");
