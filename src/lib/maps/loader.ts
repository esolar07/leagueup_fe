import { isMapsConfigured, mapsApiKey } from "./config";

export interface MapsLibraries {
  core: google.maps.CoreLibrary;
  maps: google.maps.MapsLibrary;
  marker: google.maps.MarkerLibrary;
  places: google.maps.PlacesLibrary;
  geocoding: google.maps.GeocodingLibrary;
}

export type MapsLoadFailure = "missing-key" | "network" | "auth";

export class MapsLoadError extends Error {
  constructor(readonly reason: MapsLoadFailure) {
    super(`Google Maps failed to load (${reason}).`);
    this.name = "MapsLoadError";
  }
}

const CALLBACK = "__leagueupMapsReady";
const SCRIPT_ID = "leagueup-google-maps";
type MapsWindow = Window & { [CALLBACK]?: () => void; gm_authFailure?: () => void };

let bootstrap: Promise<void> | null = null;
let authFailed = false;
const authListeners = new Set<() => void>();

function scriptUrl(): string {
  const params = new URLSearchParams({ key: mapsApiKey(), v: "weekly", loading: "async", callback: CALLBACK, region: "US", language: "en" });
  return `https://maps.googleapis.com/maps/api/js?${params}`;
}

/** Google calls `gm_authFailure` when the key is invalid or the referrer isn't allowed. */
function listenForAuthFailure(mapsWindow: MapsWindow) {
  mapsWindow.gm_authFailure = () => {
    authFailed = true;
    authListeners.forEach((listener) => listener());
  };
}

function injectScript(): Promise<void> {
  const mapsWindow = window as MapsWindow;
  listenForAuthFailure(mapsWindow);
  return new Promise((resolve, reject) => {
    mapsWindow[CALLBACK] = () => resolve();
    const script = Object.assign(document.createElement("script"), { id: SCRIPT_ID, src: scriptUrl(), async: true });
    script.onerror = () => reject(new MapsLoadError("network"));
    document.head.append(script);
  });
}

function forgetFailedLoad(error: unknown): never {
  bootstrap = null;
  document.getElementById(SCRIPT_ID)?.remove();
  throw error;
}

/** Adds the Maps script once, however many components ask. A failed load can be retried. */
export function loadGoogleMaps(): Promise<void> {
  if (!isMapsConfigured()) return Promise.reject(new MapsLoadError("missing-key"));
  if (authFailed) return Promise.reject(new MapsLoadError("auth"));
  bootstrap ??= injectScript().catch(forgetFailedLoad);
  return bootstrap;
}

export async function importMapsLibrary<Name extends keyof MapsLibraries>(name: Name): Promise<MapsLibraries[Name]> {
  await loadGoogleMaps();
  return (await google.maps.importLibrary(name)) as MapsLibraries[Name];
}

export function subscribeToMapsAuthFailure(listener: () => void): () => void {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

export function hasMapsAuthFailed(): boolean {
  return authFailed;
}
