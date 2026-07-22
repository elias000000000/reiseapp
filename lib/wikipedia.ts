/**
 * Wikipedia REST — komplett frei, kein Key.
 * Gibt Kurzbeschreibung + Vorschaubild zu einem Ortsnamen zurück.
 */
export interface WikiSummary {
  title: string;
  extract: string;
  thumbnail?: string;
  url: string;
}

export async function wikiSummary(
  name: string,
  lang: "de" | "en" = "de",
): Promise<WikiSummary | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      // Server-side cache (Next.js): 7 Tage
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) {
      if (lang === "de") return wikiSummary(name, "en"); // Fallback auf EN
      return null;
    }
    const json = await res.json();
    return {
      title: json.title,
      extract: json.extract,
      thumbnail: json.thumbnail?.source,
      url: json.content_urls?.desktop?.page,
    };
  } catch {
    return null;
  }
}
