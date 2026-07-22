// Einstiegspunkt des Backend Servers.
// Startet den Express Server und bindet die Routen ein.

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
const allowedOrigins = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim());
app.use(cors({ origin: allowedOrigins ?? true }));

app.use(express.json());

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/recommendations", recommendationsRouter);
app.use("/destinations", destinationsRouter);
app.use("/geocode", geocodeRouter);

app.listen(port, () => {
  console.log(`Backend laeuft auf Port ${port}`);
});
