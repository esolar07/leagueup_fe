import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MapsWindow = Window & { __leagueupMapsReady?: () => void; gm_authFailure?: () => void };

async function freshLoader() {
  vi.resetModules();
  return import("./loader");
}

const scripts = () => document.querySelectorAll("script#leagueup-google-maps");

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "test-key");
  vi.stubGlobal("google", { maps: { importLibrary: vi.fn(async (name: string) => ({ name })) } });
});

afterEach(() => {
  vi.unstubAllEnvs();
  document.head.innerHTML = "";
});

describe("Google Maps loader", () => {
  it("rejects without a key and adds no script", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
    const { loadGoogleMaps } = await freshLoader();
    await expect(loadGoogleMaps()).rejects.toMatchObject({ reason: "missing-key" });
    expect(scripts()).toHaveLength(0);
  });
  it("adds the script once for any number of callers, with the async loading flag", async () => {
    const { importMapsLibrary } = await freshLoader();
    const loads = [importMapsLibrary("maps"), importMapsLibrary("places"), importMapsLibrary("maps")];
    expect(scripts()).toHaveLength(1);
    const src = new URL((scripts()[0] as HTMLScriptElement).src);
    expect(Object.fromEntries(src.searchParams)).toMatchObject({ key: "test-key", loading: "async", v: "weekly", callback: "__leagueupMapsReady" });
    (window as MapsWindow).__leagueupMapsReady?.();
    expect(await Promise.all(loads)).toEqual([{ name: "maps" }, { name: "places" }, { name: "maps" }]);
    await importMapsLibrary("marker");
    expect(scripts()).toHaveLength(1);
  });
  it("can retry after the script fails to load", async () => {
    const { loadGoogleMaps } = await freshLoader();
    const first = loadGoogleMaps();
    scripts()[0].dispatchEvent(new Event("error"));
    await expect(first).rejects.toMatchObject({ reason: "network" });
    expect(scripts()).toHaveLength(0);
    void loadGoogleMaps();
    expect(scripts()).toHaveLength(1);
  });
  it("reports a rejected key to subscribers", async () => {
    const { loadGoogleMaps, subscribeToMapsAuthFailure, hasMapsAuthFailed } = await freshLoader();
    const listener = vi.fn();
    subscribeToMapsAuthFailure(listener);
    void loadGoogleMaps();
    (window as MapsWindow).gm_authFailure?.();
    expect(listener).toHaveBeenCalledOnce();
    expect(hasMapsAuthFailed()).toBe(true);
    await expect(loadGoogleMaps()).rejects.toMatchObject({ reason: "auth" });
  });
});
