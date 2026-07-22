// GET /geocode?q=<Stadt> - serverseitiger Proxy zu OpenStreetMap Nominatim.
// Nur fuer den "Andere Stadt"-Freitext-Fall im Startort-Schritt gebraucht;
// die drei Standard-Staedte (Zuerich/Basel/Genf) haben im Frontend fest
// hinterlegte Koordinaten und brauchen keinen Call. Oeffentlich (kein Auth-
// Bedarf, keine sensiblen Daten, App ist nicht oeffentlich deployed).

import { Router } from "express";

export const geocodeRouter = Router();

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
// Nominatim-Nutzungsrichtlinie verlangt einen aussagekraeftigen User-Agent.
const USER_AGENT = "Reiseapp/0.1 (privates Projekt, Startort-Geocoding)";

geocodeRouter.get("/", async (req, res) => {
  const q = req.query.q;
  if (typeof q !== "string" || q.trim() === "") {
    res.status(400).json({ code: "MISSING_QUERY", error: "Query-Parameter 'q' ist erforderlich." });
    return;
  }

  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(q.trim())}`;
  let response: Response;
  try {
    response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  } catch {
    res.status(500).json({ code: "INTERNAL_ERROR", error: "Geocoding-Dienst nicht erreichbar." });
    return;
  }

  if (!response.ok) {
    res.status(500).json({ code: "INTERNAL_ERROR", error: "Geocoding-Dienst antwortete fehlerhaft." });
    return;
  }

  const results = (await response.json()) as { lat: string; lon: string; display_name: string }[];
  if (results.length === 0) {
    res.status(404).json({ code: "NOT_FOUND", error: `Kein Ort gefunden fuer "${q}".` });
    return;
  }

  const [match] = results;
  res.json({
    lat: Number(match.lat),
    lng: Number(match.lon),
    label: match.display_name.split(",")[0], // kurzer Anzeigename statt voller Adresse
  });
});
