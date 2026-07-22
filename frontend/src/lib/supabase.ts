// Supabase-Browser-Client - ausschliesslich fuer Auth (Magic Link, Session).
// Liest NIE aus der destinations/trip_requests/recommendations-Tabelle
// direkt (CLAUDE.md-Konvention: immer ueber das Backend, siehe lib/api.ts).
// Der Anon-Key ist bewusst clientseitig sichtbar (dafuer gedacht) und
// erlaubt ohne RLS-Policy ohnehin keinen Datenzugriff auf die App-Tabellen.

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY fehlen in frontend/.env (siehe frontend/.env.example)."
  );
}

export const supabase = createClient(url, anonKey);
