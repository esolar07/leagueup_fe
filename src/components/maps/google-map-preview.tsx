"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { isMapsConfigured, MAPS_REGION, type LatLng } from "@/lib/maps/config";
import { directionsUrl } from "@/lib/maps/place-selection";
import { useMapsLibrary } from "@/lib/maps/use-maps-library";
import { cn } from "@/lib/utils";
import { GoogleMap } from "./google-map";
import { GoogleMapMarker } from "./google-map-marker";

/** Opens Google Maps directions in a new tab. Works without an API key. */
export function GoogleMapDirectionsLink({ address, placeId, className }: { address: string; placeId?: string | null; className?: string }) {
  return (
    <a href={directionsUrl({ address, placeId })} target="_blank" rel="noopener noreferrer" className={cn("inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline", className)}>
      Get directions <ExternalLink className="size-3.5" aria-hidden />
      <span className="sr-only">(opens Google Maps in a new tab)</span>
    </a>
  );
}

/** Address → coordinates, cached for the session so each address is geocoded once. */
function useGeocodedAddress(address: string, known?: LatLng) {
  const { data: geocoding } = useMapsLibrary("geocoding");
  return useQuery({
    queryKey: ["geocode", address],
    queryFn: async () => {
      const { results } = await new geocoding!.Geocoder().geocode({ address, region: MAPS_REGION });
      const location = results[0]?.geometry.location;
      if (!location) throw new Error("Address not found");
      return location.toJSON();
    },
    enabled: Boolean(geocoding && address && !known),
    staleTime: Infinity,
    retry: false,
  });
}

/**
 * A small, non-interactive map of one place. Geocodes the address in the browser because
 * games don't store coordinates yet. Renders nothing if the address can't be placed: the
 * address text and directions link beside it still work.
 */
export function GoogleMapPreview({ address, label, position, className }: { address: string; label: string; position?: LatLng; className?: string }) {
  const geocoded = useGeocodedAddress(address, position);
  const center = position ?? geocoded.data;
  if (!isMapsConfigured() || geocoded.isError) return null;
  if (!center) return <div className={cn("animate-pulse rounded-lg bg-muted", className)} aria-label="Loading map" />;
  return (
    <GoogleMap center={center} zoom={15} mode="static" label={label} className={className}>
      <GoogleMapMarker position={center} title={label} variant="selected" />
    </GoogleMap>
  );
}
