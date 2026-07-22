// Kleiner Session-Cache fuer Destination-Details: Results laedt alle IDs auf
// einmal, Detail greift ohne zweiten Request zu. Ueberlebt Reloads via
// sessionStorage (z. B. direkter Einstieg auf /destination/:id).

import { fetchDestinations } from "./api";
import type { Destination } from "./types";

const CACHE_KEY = "reiseapp_dest_cache";

function readStore(): Record<string, Destination> {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, Destination>): void {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(store));
}

export async function getDestinations(ids: string[], signal?: AbortSignal): Promise<Destination[]> {
  const store = readStore();
  const missing = ids.filter((id) => !store[id]);
  if (missing.length > 0) {
    const fetched = await fetchDestinations(missing, signal);
    for (const d of fetched) store[d.id] = d;
    writeStore(store);
  }
  return ids.map((id) => store[id]).filter(Boolean);
}

export async function getDestination(id: string, signal?: AbortSignal): Promise<Destination | null> {
  const [d] = await getDestinations([id], signal);
  return d ?? null;
}
