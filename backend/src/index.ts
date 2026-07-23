// Lokaler Einstiegspunkt: startet den Express-Server auf einem Port.
// Die App-Definition selbst liegt in app.ts (damit sie auch als Vercel
// Serverless Function ohne listen() wiederverwendet werden kann).

import app from "./app.js";

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.listen(port, () => {
  console.log(`Backend laeuft auf Port ${port}`);
});
