// Typisierter API-Client. Einzige Stelle, die mit dem Backend spricht —
// das Frontend liest NIE direkt aus Supabase (CLAUDE.md-Konvention).

import type { ApiErrorCode, Destination, GeocodeResult, RecommendationResult, TripRequestInput } from "./types";
import { supabase } from "./supabase";

// Default leitet sich vom Hostnamen ab, ueber den die Seite selbst geladen
// wurde (localhost am Desktop, LAN-IP am iPhone) — dadurch funktioniert der
// Zugriff vom iPhone automatisch mit, ohne die IP manuell pflegen zu muessen.
// VITE_API_URL uebersteuert das bei Bedarf (z. B. spaeter fuers Deployment).
// Bewusst "||" statt "??": eine leer gelassene VITE_API_URL= in .env (z. B.
// aus der .env.example-Vorlage uebernommen) ist ein leerer String, kein
// undefined - "??" wuerde das faelschlich als "gesetzt" durchgehen lassen.
const API_URL: string = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode | "NETWORK",
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Aktuelles Access-Token aus der Supabase-Session anhaengen, falls
  // eingeloggt. Geschuetzte Routen (z. B. /recommendations) lehnen ohne
  // gueltiges Token mit 401 UNAUTHORIZED ab.
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...init,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiRequestError("Keine Verbindung zum Server.", "NETWORK", 0);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiRequestError(
      body?.error ?? `Serverfehler (${res.status})`,
      body?.code ?? "INTERNAL_ERROR",
      res.status
    );
  }
  return body as T;
}

export function fetchRecommendations(
  input: TripRequestInput,
  signal?: AbortSignal
): Promise<RecommendationResult> {
  return request<RecommendationResult>("/recommendations", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
}

export async function fetchDestinations(ids: string[], signal?: AbortSignal): Promise<Destination[]> {
  if (ids.length === 0) return [];
  const data = await request<{ destinations: Destination[] }>(
    `/destinations?ids=${encodeURIComponent(ids.join(","))}`,
    { signal }
  );
  return data.destinations;
}

export function geocode(query: string, signal?: AbortSignal): Promise<GeocodeResult> {
  return request<GeocodeResult>(`/geocode?q=${encodeURIComponent(query)}`, { signal });
}
