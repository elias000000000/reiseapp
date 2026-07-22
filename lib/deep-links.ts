/**
 * Statt eigener Buchungs-API: gezielte Deep-Links in bestehende Dienste.
 * Null Abhängigkeiten, null Kosten, immer aktuell.
 */
export const bookingUrl = (city: string, checkin?: string, checkout?: string) => {
  const params = new URLSearchParams({ ss: city });
  if (checkin) params.set("checkin", checkin);
  if (checkout) params.set("checkout", checkout);
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
};

export const airbnbUrl = (city: string, checkin?: string, checkout?: string) => {
  const params = new URLSearchParams();
  if (checkin) params.set("checkin", checkin);
  if (checkout) params.set("checkout", checkout);
  return `https://www.airbnb.de/s/${encodeURIComponent(city)}/homes?${params.toString()}`;
};

export const googleFlightsUrl = (from: string, to: string, date?: string) => {
  const q = `Flüge von ${from} nach ${to}${date ? " am " + date : ""}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
};

export const omioUrl = (from: string, to: string, date?: string) => {
  const params = new URLSearchParams({ from, to });
  if (date) params.set("date", date);
  return `https://www.omio.de/search-frontend/?${params.toString()}`;
};

export const mapsDirectionsUrl = (lat: number, lng: number, name?: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` +
  (name ? `&destination_place_id=&query=${encodeURIComponent(name)}` : "");

export const mapsPlaceUrl = (name: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
