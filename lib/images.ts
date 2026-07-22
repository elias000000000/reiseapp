/**
 * Bilder — einfach und zuverlässig.
 *
 * Regel: Niemals existierende URLs anfassen oder umschreiben.
 * Fallback: picsum.photos mit Name-Seed (immer verfügbar, deterministisch).
 */

/** Bereinigt einen String zu einem sicheren picsum-Seed. */
function toSeed(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40) || "reise";
}

/**
 * Gibt eine zuverlässige Bild-URL zurück.
 * - existingUrl vorhanden → direkt verwenden (unverändert)
 * - Fallback → picsum.photos (immer verfügbar)
 */
export function placeImageUrl(opts: {
  name?: string;
  imageSearch?: string;
  existingUrl?: string;
  size?: "thumb" | "full";
}): string {
  const { name, imageSearch, existingUrl, size = "thumb" } = opts;

  if (existingUrl?.trim()) return existingUrl.trim();

  const seed = toSeed(name ?? imageSearch ?? "reise");
  const [w, h] = size === "full" ? [2400, 1600] : [800, 530];
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

/** Fallback-URL wenn ein Bild nicht lädt. */
export function fallbackImageUrl(name?: string): string {
  const seed = toSeed(name ?? "reise");
  return `https://picsum.photos/seed/${seed}f/800/530`;
}
