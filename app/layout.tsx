import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

export const metadata: Metadata = {
  title: "Reise.",
  description: "Persönliche Reiseplanung — leise, intelligent, eigen.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0F1923",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="sticky top-0 z-30 no-print" style={{ backgroundColor: "#0F1923" }}>
          <div className="container-prose flex items-center justify-between h-14">
            <Link
              href="/"
              className="font-display text-xl font-semibold tracking-tight text-white hover:opacity-75 transition"
            >
              Reise<span style={{ color: "#B45309" }}>.</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/8 transition"
              >
                Reisen
              </Link>
              <Link
                href="/discover"
                className="px-3 py-1.5 rounded-full text-white font-medium transition"
                style={{ backgroundColor: "#92400E" }}
              >
                Entdecken
              </Link>
            </nav>
          </div>
        </header>

        <main className="min-h-[calc(100dvh-56px)]">{children}</main>
      </body>
    </html>
  );
}
