// Vercel Serverless Function: reicht alle /api/*-Requests an die Express-App
// weiter (backend/src/app.ts, kompiliert nach backend/dist/app.js durch den
// vercel-build-Schritt in der Root-package.json).
//
// Warum ein Wrapper: Vercel leitet /api/(.*) per Rewrite (vercel.json) an diese
// eine Function. Die Express-Routen sind aber ohne /api-Praefix montiert
// (/health, /recommendations, ...), damit lokal (Port 3001) und in Produktion
// (/api) derselbe Code laeuft. Deshalb hier das /api-Praefix entfernen, bevor
// Express die URL sieht.

const app = require("../backend/dist/app.js").default;

module.exports = (req, res) => {
  if (req.url === "/api") {
    req.url = "/";
  } else if (req.url.startsWith("/api/")) {
    req.url = req.url.slice("/api".length); // "/api/recommendations" -> "/recommendations"
  }
  return app(req, res);
};
