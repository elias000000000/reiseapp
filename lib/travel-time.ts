export type TransportMode = "flight" | "train" | "car";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateTravelTime(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  mode: TransportMode,
): { hours: number; label: string; distanceKm: number } {
  const dist = Math.round(haversineKm(fromLat, fromLng, toLat, toLng));
  let hours: number;
  switch (mode) {
    case "flight":
      hours = dist < 400 ? 2.5 : dist / 750 + 3; // airport overhead
      break;
    case "train":
      hours = dist / 130 + 1; // avg speed + transfers
      break;
    case "car":
      hours = dist / 95; // highway average
      break;
  }
  hours = Math.round(hours * 2) / 2; // round to 0.5h
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const label =
    h === 0 ? `${m} Min.` : m === 0 ? `ca. ${h} Std.` : `ca. ${h}h ${m}m`;
  return { hours, label, distanceKm: dist };
}

export function travelBookingUrl(
  fromCity: string,
  toCity: string,
  mode: TransportMode,
  date?: string,
): string {
  switch (mode) {
    case "flight": {
      const q = `Flüge von ${fromCity} nach ${toCity}${date ? " " + date : ""}`;
      return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
    }
    case "train": {
      const params = new URLSearchParams({ from: fromCity, to: toCity });
      if (date) params.set("date", date);
      return `https://www.omio.de/search-frontend/?${params.toString()}`;
    }
    case "car":
      return `https://www.google.com/maps/dir/${encodeURIComponent(fromCity)}/${encodeURIComponent(toCity)}`;
  }
}
