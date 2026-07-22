import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "Reiseapp",
        short_name: "Reiseapp",
        description: "Dein persoenlicher KI-Reiseberater",
        lang: "de",
        display: "standalone",
        orientation: "portrait",
        background_color: "#F8F7F5",
        theme_color: "#F8F7F5",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Pexels-CDN-Bilder zur Laufzeit cachen, App-Shell precachen
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.pexels\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "destination-images",
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  // host: true = lauscht auf allen Netzwerk-Interfaces, nicht nur localhost.
  // Noetig, damit das iPhone (im selben WLAN) den Dev-Server erreichen kann.
  server: { port: 5173, host: true },
});
