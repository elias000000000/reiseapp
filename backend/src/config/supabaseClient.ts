// Supabase Client Initialisierung.
// Wird von services/ genutzt, um auf die Reiseziel Datenbank und Profildaten zuzugreifen.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt in .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
