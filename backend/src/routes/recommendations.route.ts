// POST /recommendations - nimmt die 11 Q&A-Antworten entgegen und liefert
// die finalen Empfehlungen inkl. Begruendung. Erfordert Anmeldung (die
// Nutzer-Identitaet kommt aus dem verifizierten Bearer-Token, nie aus dem Body).

import { Router } from "express";
import { ZodError } from "zod";
import { TripRequestInputSchema } from "../types/qa.types.js";
import { getRecommendations } from "../services/recommend.service.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../errors.js";

export const recommendationsRouter = Router();

recommendationsRouter.post("/", requireAuth, async (req, res) => {
  let input;
  try {
    input = TripRequestInputSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ code: "VALIDATION_ERROR", error: "Ungueltige Eingabe", details: error.issues });
      return;
    }
    throw error;
  }

  try {
    const result = await getRecommendations(input, req.userId!);
    res.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({ code: error.code, error: error.message });
      return;
    }
    // Unerwarteter Fehler: volles Detail nur ins Server-Log, Client bekommt
    // nur eine generische Meldung statt roher interner Fehlertexte.
    console.error("Unerwarteter Fehler bei der Empfehlungsermittlung:", error);
    res.status(500).json({ code: "INTERNAL_ERROR", error: "Es ist ein unerwarteter Fehler aufgetreten." });
  }
});
