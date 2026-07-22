// GET /destinations?ids=id1,id2,... - liefert volle Destination-Details fuer
// eine Menge von IDs. Zustaendig fuer die Anzeige ("Details"), waehrend
// POST /recommendations schlank bleibt ("was & warum"). Das Frontend ruft
// diese Route nach Erhalt einer Empfehlung einmal fuer alle destination_ids auf.
//
// Existiert, damit das Frontend NIE direkt gegen Supabase liest (auch wenn
// die destinations-Tabelle eine Public-Read-RLS-Policy hat - siehe
// database/schema.md) und stattdessen konsequent ueber das Backend geht.

import { Router } from "express";
import { supabase } from "../config/supabaseClient.js";
import { DESTINATION_COLUMNS } from "../services/destinationFilter.service.js";
import { DestinationRowSchema } from "../types/qa.types.js";

export const destinationsRouter = Router();

destinationsRouter.get("/", async (req, res) => {
  const idsParam = req.query.ids;

  if (typeof idsParam !== "string" || idsParam.trim() === "") {
    res.status(400).json({
      code: "MISSING_IDS",
      error: "Query-Parameter 'ids' (kommagetrennte Liste von destination_id) ist erforderlich.",
    });
    return;
  }

  const ids = [...new Set(idsParam.split(",").map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) {
    res.status(400).json({ code: "MISSING_IDS", error: "Keine gueltigen ids uebergeben." });
    return;
  }

  const { data, error } = await supabase.from("destinations").select(DESTINATION_COLUMNS).in("id", ids);
  if (error) {
    console.error("Fehler beim Laden von destinations:", error);
    res.status(500).json({ code: "INTERNAL_ERROR", error: "Es ist ein unerwarteter Fehler aufgetreten." });
    return;
  }

  res.json({ destinations: (data ?? []).map((row) => DestinationRowSchema.parse(row)) });
});
