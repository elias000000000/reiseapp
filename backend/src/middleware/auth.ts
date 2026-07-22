// Verifiziert das Bearer-Token einer Anfrage gegen Supabase Auth und haengt
// die echte, verifizierte Nutzer-ID an req.userId. Ersetzt die fruehere,
// vom Client frei erfundene user_key - die Anfrage kann sich nicht mehr
// als anderer Nutzer ausgeben.

import type { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabaseClient.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ code: "UNAUTHORIZED", error: "Anmeldung erforderlich." });
    return;
  }

  // getUser(token) prueft das uebergebene Token direkt gegen den Auth-Server,
  // unabhaengig davon, mit welchem Key der Client selbst erstellt wurde.
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ code: "UNAUTHORIZED", error: "Sitzung abgelaufen oder ungueltig." });
    return;
  }

  req.userId = data.user.id;
  next();
}
