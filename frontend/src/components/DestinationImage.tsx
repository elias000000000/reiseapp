// Zentrale Bild-Komponente (design-system.md §7): einzige Stelle, die
// destination.image_url interpretiert. Bildwechsel = DB-Update, kein Code.
// Kaskade: image_url -> Kategorie-Fallback (/images/fallback-*.jpg) ->
// eleganter Gradient (nie ein leerer grauer Kasten).

import { useState } from "react";

// Bewusste Ausnahme von der Token-Regel: dekorative Platzhalter-Gradienten
// pro Kategorie (keine UI-Farben, nur Bildersatz).
const CATEGORY_STYLE: Record<string, { fallback: string; gradient: string }> = {
  Berge:   { fallback: "berge",  gradient: "linear-gradient(160deg,#3d5a6c,#8ba8b5)" },
  Wandern: { fallback: "berge",  gradient: "linear-gradient(160deg,#3d5a6c,#8ba8b5)" },
  Winter:  { fallback: "berge",  gradient: "linear-gradient(160deg,#5b7c99,#c3d3de)" },
  Strand:  { fallback: "strand", gradient: "linear-gradient(160deg,#2a9d8f,#a8dadc)" },
  Insel:   { fallback: "insel",  gradient: "linear-gradient(160deg,#1d7a8c,#7fc8d6)" },
  Stadt:   { fallback: "stadt",  gradient: "linear-gradient(160deg,#4a4e69,#9a8c98)" },
  Skyline: { fallback: "stadt",  gradient: "linear-gradient(160deg,#22223b,#6d6875)" },
  Kultur:  { fallback: "stadt",  gradient: "linear-gradient(160deg,#7f5539,#ddb892)" },
  Wueste:  { fallback: "wueste", gradient: "linear-gradient(160deg,#c37d4f,#e9c46a)" },
};
const DEFAULT_STYLE = { fallback: "natur", gradient: "linear-gradient(160deg,#40695c,#95b8a6)" };

interface DestinationImageProps {
  imageUrl: string | null;
  categories: string[];
  alt: string;
  /** CSS aspect-ratio, z. B. "4 / 5" oder "16 / 10". */
  aspect: string;
  /** true fuer das erste sichtbare Bild (kein lazy). */
  eager?: boolean;
  className?: string;
  children?: React.ReactNode; // Overlay-Inhalt (Scrim + Text)
}

export function DestinationImage({
  imageUrl, categories, alt, aspect, eager = false, className = "", children,
}: DestinationImageProps) {
  const style = CATEGORY_STYLE[categories[0]] ?? DEFAULT_STYLE;
  const fallbackSrc = `/images/fallback-${style.fallback}.jpg`;

  const [src, setSrc] = useState(imageUrl ?? fallbackSrc);
  const [loaded, setLoaded] = useState(false);
  const [dead, setDead] = useState(false);

  function handleError() {
    if (src !== fallbackSrc) {
      setSrc(fallbackSrc); // Pexels-URL kaputt -> Kategorie-Fallback probieren
    } else {
      setDead(true); // auch Fallback fehlt -> Gradient bleibt
    }
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: aspect, background: style.gradient, borderRadius: "var(--radius-lg)" }}
    >
      {!dead && (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      )}
      {children}
    </div>
  );
}
