import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LOCATION_ERROR_COPY, LOCATION_OPTIONS, useUserLocation } from "./use-user-location";

function stubGeolocation(respond: (success: PositionCallback, failure: PositionErrorCallback) => void) {
  const getCurrentPosition = vi.fn((success: PositionCallback, failure: PositionErrorCallback, options?: PositionOptions) => (void options, respond(success, failure)));
  const watchPosition = vi.fn();
  vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition, watchPosition } });
  return { getCurrentPosition, watchPosition };
}

const position = { coords: { latitude: 25.76, longitude: -80.19, accuracy: 1200 }, timestamp: 1_700_000_000_000 } as GeolocationPosition;

describe("useUserLocation", () => {
  it("asks for nothing until the user requests it, then reads once (no tracking)", () => {
    const geo = stubGeolocation((success) => success(position));
    const { result } = renderHook(() => useUserLocation());
    expect(geo.getCurrentPosition).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
    act(() => result.current.requestLocation());
    expect(geo.getCurrentPosition).toHaveBeenCalledOnce();
    expect(geo.getCurrentPosition.mock.calls[0][2]).toEqual(LOCATION_OPTIONS);
    expect(geo.watchPosition).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ status: "located", latitude: 25.76, longitude: -80.19, accuracy: 1200, timestamp: 1_700_000_000_000, loading: false, error: null });
  });
  it.each([
    [1, "denied"],
    [2, "unavailable"],
    [3, "timeout"],
  ] as const)("maps error code %i to %s with a manual-entry hint", (code, status) => {
    stubGeolocation((_, failure) => failure({ code } as GeolocationPositionError));
    const { result } = renderHook(() => useUserLocation());
    act(() => result.current.requestLocation());
    expect(result.current.status).toBe(status);
    expect(result.current.error).toBe(LOCATION_ERROR_COPY[status]);
    expect(result.current.latitude).toBeNull();
  });
  it("reports unsupported browsers", () => {
    vi.stubGlobal("navigator", { ...navigator, geolocation: undefined });
    const { result } = renderHook(() => useUserLocation());
    act(() => result.current.requestLocation());
    expect(result.current.status).toBe("unsupported");
  });
  it("shows loading while waiting, and clears on request", () => {
    stubGeolocation(() => undefined);
    const { result } = renderHook(() => useUserLocation());
    act(() => result.current.requestLocation());
    expect(result.current.loading).toBe(true);
    act(() => result.current.clearLocation());
    expect(result.current).toMatchObject({ status: "idle", latitude: null, loading: false });
  });
  it("never writes the position to storage", () => {
    stubGeolocation((success) => success(position));
    const { result } = renderHook(() => useUserLocation());
    act(() => result.current.requestLocation());
    expect(Object.keys(localStorage)).toEqual([]);
    expect(Object.keys(sessionStorage)).toEqual([]);
  });
});
