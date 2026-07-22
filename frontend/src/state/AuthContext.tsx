// Auth-Status ueber die gesamte App: anonyme Session automatisch beim
// ersten Start, danach ueber die Supabase-Session (localStorage) persistent
// auf diesem Geraet/Browser. Kein Login-Screen, keine E-Mail, kein Rate-Limit.
//
// Warum anonym statt E-Mail-Login: fuer eine private Single-User-App reicht
// eine echte, verifizierte (nicht faelschbare) Nutzer-ID voellig aus - ein
// E-Mail-Roundtrip bringt nur Reibung (Magic-Link-Browser-Probleme,
// Rate-Limits), ohne fuer den aktuellen Anwendungsfall etwas zu gewinnen.
// Spaeter optional nachruestbar: eine anonyme Session laesst sich via
// supabase.auth.updateUser() nachtraeglich mit einer echten E-Mail
// verknuepfen, ohne den bisherigen Verlauf zu verlieren.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextValue {
  userId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
      } else {
        const { data: anon, error } = await supabase.auth.signInAnonymously();
        if (error) {
          // Sehr seltener Fall (z. B. anonyme Anmeldung im Dashboard nicht
          // aktiviert, oder Netzwerkfehler) - kein Login-Screen als Fallback
          // vorhanden, daher nur loggen. Die App bleibt ohne Session haengen;
          // /health-artige Diagnose erfolgt ueber die Server-Logs.
          console.error("Anonyme Anmeldung fehlgeschlagen:", error.message);
        }
        setSession(anon.session);
      }
      setLoading(false);
    }
    void init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      userId: session?.user.id ?? null,
      loading,
      signOut: () => supabase.auth.signOut().then(() => undefined),
    }),
    [session, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth ausserhalb des AuthProvider");
  return ctx;
}
