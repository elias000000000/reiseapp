// Supabase-Browser-Client - ausschliesslich fuer Auth (anonyme Session).
// Liest NIE aus der destinations/trip_requests/recommendations-Tabelle
// direkt (CLAUDE.md-Konvention: immer ueber das Backend, siehe lib/api.ts).
// Der Anon-Key ist bewusst clientseitig sichtbar (dafuer gedacht) und
// erlaubt ohne RLS-Policy ohnehin keinen Datenzugriff auf die App-Tabellen.

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// WICHTIG (Release-Haertung): NICHT beim Modul-Import werfen. Ein Throw hier
// passiert waehrend der ES-Modulauswertung, noch bevor React mountet - keine
// ErrorBoundary koennte ihn fangen, das Resultat waere ein komplett weisser
// Bildschirm ohne jede Meldung (genau der Vercel-Whitescreen bei fehlenden
// VITE_-Variablen). Stattdessen den Konfigurationsfehler als Wert melden;
// AuthContext/App zeigen daraufhin eine lesbare Fehlerseite statt Blank.
export const supabaseConfigError: string | null =
  !url || !anonKey
    ? "Die App ist nicht vollstaendig konfiguriert (VITE_SUPABASE_URL und/oder VITE_SUPABASE_ANON_KEY fehlen)."
    : null;

// Platzhalter-Werte, damit createClient nicht selbst wirft, wenn die Vars
// fehlen. Der Client wird in diesem Fall ohnehin nie erfolgreich genutzt -
// App zeigt vorher die Konfig-Fehlerseite.
// Bewusst "||" statt "??": eine leer gebaute VITE_SUPABASE_URL= ist ein leerer
// String, kein undefined - "??" wuerde ihn durchlassen und createClient wuerde
// mit "supabaseUrl is required." werfen (wieder ein Whitescreen).
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key"
);
