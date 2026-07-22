// Externe Deep-Links (reine URL-Builder, kein Backend noetig).

export function googleFlightsUrl(name: string, country: string): string {
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flüge nach ${name}, ${country}`)}`;
}

export function bookingUrl(name: string, country: string): string {
  return `https://www.booking.com/searchresults.de.html?ss=${encodeURIComponent(`${name}, ${country}`)}`;
}
