import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // "Atlas" – warme Reise-Palette
        canvas: "#F4F1EB",    // warmes Leinen
        ink:    "#1A1714",    // warmes Anthrazit
        muted:  "#6B6560",    // warmes Mittelgrau
        line:   "#DDD9D3",    // warme Trennlinie
        accent: {
          DEFAULT: "#92400E", // Bernstein (amber-800) – Haupt-CTA
          light:   "#B45309", // Bernstein hell (amber-700)
          soft:    "#FEF3C7", // sehr helles Bernstein
        },
        nav:    "#0F1923",    // tiefes Navy (Header)
        surface: "#FFFFFF",  // Karten, Modals
      },
      borderRadius: {
        card: "16px",
        pill: "999px",
      },
      boxShadow: {
        card:  "0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.07)",
        float: "0 8px 40px rgba(0,0,0,.14)",
        inner: "inset 0 1px 3px rgba(0,0,0,.08)",
      },
      fontSize: {
        "2xs": ["0.65rem", "1"],
      },
    },
  },
  plugins: [],
};

export default config;
