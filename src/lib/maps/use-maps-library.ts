"use client";

import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { isMapsConfigured } from "./config";
import { hasMapsAuthFailed, importMapsLibrary, subscribeToMapsAuthFailure, type MapsLibraries } from "./loader";

/** One cached load per library for the whole app. Disabled (never loads) without a key. */
export function useMapsLibrary<Name extends keyof MapsLibraries>(name: Name) {
  return useQuery({
    queryKey: ["google-maps-library", name],
    queryFn: () => importMapsLibrary(name),
    enabled: isMapsConfigured(),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    structuralSharing: false,
  });
}

/** True once Google rejects the key (bad key or unlisted referrer); maps then hide themselves. */
export function useMapsAuthFailed(): boolean {
  return useSyncExternalStore(subscribeToMapsAuthFailure, hasMapsAuthFailed, () => false);
}
