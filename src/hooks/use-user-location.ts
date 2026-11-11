"use client";

import { useCallback, useState } from "react";

export type LocationStatus = "idle" | "locating" | "located" | "denied" | "unavailable" | "timeout" | "unsupported";

export interface UserPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

/** City-level accuracy is plenty for "near me", and it's quicker and kinder to batteries. */
export const LOCATION_OPTIONS: PositionOptions = { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 };

export const LOCATION_ERROR_COPY: Record<Exclude<LocationStatus, "idle" | "locating" | "located">, string> = {
  denied: "Location permission is off. Search by city, ZIP or park name instead.",
  unavailable: "We couldn’t find your location. Search by city, ZIP or park name instead.",
  timeout: "Finding your location took too long. Try again, or search by city or ZIP.",
  unsupported: "This browser can’t share your location. Search by city, ZIP or park name instead.",
};

const STATUS_BY_ERROR_CODE: Record<number, LocationStatus> = { 1: "denied", 2: "unavailable", 3: "timeout" };

function toPosition({ coords, timestamp }: GeolocationPosition): UserPosition {
  return { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, timestamp };
}

/**
 * One-shot browser location, only when the user asks (call `requestLocation` from a click).
 * No watching, and nothing is stored: the position lives in component state only.
 */
export function useUserLocation() {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [position, setPosition] = useState<UserPosition | null>(null);
  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return setStatus("unsupported");
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition(toPosition(result));
        setStatus("located");
      },
      (error) => setStatus(STATUS_BY_ERROR_CODE[error.code] ?? "unavailable"),
      LOCATION_OPTIONS,
    );
  }, []);
  const clearLocation = useCallback(() => {
    setPosition(null);
    setStatus("idle");
  }, []);
  const error = status in LOCATION_ERROR_COPY ? LOCATION_ERROR_COPY[status as keyof typeof LOCATION_ERROR_COPY] : null;
  return { status, ...(position ?? { latitude: null, longitude: null, accuracy: null, timestamp: null }), loading: status === "locating", error, requestLocation, clearLocation };
}
