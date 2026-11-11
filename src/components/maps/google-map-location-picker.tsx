"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { LatLng } from "@/lib/maps/config";
import { selectionFromGeocoderResult, type PlaceSelection } from "@/lib/maps/place-selection";
import { useMapsLibrary } from "@/lib/maps/use-maps-library";
import { GoogleMap } from "./google-map";
import { GoogleMapMarker } from "./google-map-marker";

function useReverseGeocode(onPick: (selection: PlaceSelection) => void) {
  const { data: geocoding } = useMapsLibrary("geocoding");
  return useMutation({
    mutationFn: async (location: LatLng) => {
      const { results } = await new geocoding!.Geocoder().geocode({ location });
      if (!results[0]) throw new Error("No address at that point");
      return selectionFromGeocoderResult(results[0]);
    },
    onSuccess: onPick,
  });
}

function hint(lookup: ReturnType<typeof useReverseGeocode>): string {
  if (lookup.isPending) return "Looking up the address…";
  if (lookup.isError) return "Couldn’t find an address there. Type it in the fields below.";
  return "Tap the map or drag the pin to adjust. The address fields update to match.";
}

/**
 * Confirms where a game is: tap or drag to move the pin, and the nearest street address is
 * looked up. Remount (via `key`) to jump to a new place.
 */
export function GoogleMapLocationPicker({ initialPosition, label, onPick }: { initialPosition: LatLng; label: string; onPick: (selection: PlaceSelection) => void }) {
  const [pin, setPin] = useState(initialPosition);
  const lookup = useReverseGeocode(onPick);
  function move(position: LatLng) {
    setPin(position);
    lookup.mutate(position);
  }
  return (
    <div className="grid gap-2">
      <GoogleMap center={pin} zoom={16} label={label} onMapClick={move} className="h-56 sm:h-64">
        <GoogleMapMarker position={pin} title="Game location. Drag to adjust." variant="selected" onDragEnd={move} />
      </GoogleMap>
      <p role="status" className="text-sm text-muted-foreground">{hint(lookup)}</p>
    </div>
  );
}
