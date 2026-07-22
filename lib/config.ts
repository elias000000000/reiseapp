/**
 * Single source of truth for "do we have real keys, or are we mocking?"
 * When you sign up for a service later, set the env var and the app
 * picks up real data automatically.
 */
export const config = {
  hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
  // Mapbox is optional. Without a token, we use the free OpenStreetMap raster style.
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",
  hasMapbox: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
};
