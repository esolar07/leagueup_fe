/**
 * Google Maps runs entirely in the browser with a public key. Restrict that key in Google
 * Cloud to LeagueUp's HTTP referrers and to the Maps JavaScript, Places (New) and
 * Geocoding APIs. The backend never needs a Google key.
 */
export function mapsApiKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
}

/** Advanced markers need a Map ID. DEMO_MAP_ID works for local development only. */
export function mapsMapId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";
}

/** Without a key every map feature hides itself and the plain form fields still work. */
export function isMapsConfigured(): boolean {
  return mapsApiKey() !== "";
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** Biases searches when the user hasn't shared a location. */
export const DEFAULT_MAP_CENTER: LatLng = { lat: 25.7617, lng: -80.1918 };
export const SEARCH_BIAS_RADIUS_METERS = 40_000;
export const MAPS_REGION = "us";
