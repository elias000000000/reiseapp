// Express-App-Definition OHNE listen(). Bewusst getrennt vom Serverstart,
// damit dieselbe App zweifach genutzt werden kann:
//   - lokal:      index.ts ruft app.listen() (klassischer Node-Server)
//   - Produktion: api/index.js (Vercel Serverless Function) reicht Requests
//                 direkt an diese app weiter, ohne einen Port zu oeffnen.

import "dotenv/config";
import express from "express";
import cors from "cors";
import { recommendationsRouter } from "./routes/recommendations.route.js";
import { destinationsRouter } from "./routes/destinations.route.js";
import { geocodeRouter } from "./routes/geocode.route.js";

const app = express();

// CORS_ORIGIN optional als kommagetrennte Liste erlaubter Origins setzen;
// ohne gesetzte Var wird der anfragende Origin reflektiert (ok fuer lokale
// Solo-Entwicklung; Auth laeuft ueber ein Bearer-Token im Header, nicht
// ueber Cookies, daher unproblematisch mit offenem CORS - siehe docs/api-contract.md).
// In Produktion auf Vercel laeuft Frontend UND API auf derselben Origin
// (/api), CORS ist dort also gar nicht erst im Spiel.
const allowedOrigins = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim());
app.use(cors({ origin: allowedOrigins ?? true }));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/recommendations", recommendationsRouter);
app.use("/destinations", destinationsRouter);
app.use("/geocode", geocodeRouter);

export default app;
