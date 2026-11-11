"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Info, Map } from "lucide-react";
import { AddressAutocomplete } from "@/components/locations/address-autocomplete";
import { PlacesSearch } from "@/components/locations/places-search";
import { GoogleMapLocationPicker } from "@/components/maps/google-map-location-picker";
import { Button } from "@/components/ui/button";
import { isMapsConfigured } from "@/lib/maps/config";
import { toGameLocationFields, type PlaceSelection } from "@/lib/maps/place-selection";
import type { GameFieldValues } from "../schemas";

type LocationField = "venueName" | "address" | "city" | "state" | "postalCode";

/**
 * Google helps find and pin the place; the organizer's form fields stay the source of truth.
 * Picking a place fills them in (all still editable). Moving the pin refreshes only the
 * street address fields, never the venue name the organizer may have refined.
 * Hidden entirely when Maps isn't configured.
 */
export function VenueFinder() {
  const { setValue } = useFormContext<GameFieldValues>();
  const [picked, setPicked] = useState<PlaceSelection | null>(null);
  const [browsing, setBrowsing] = useState(false);
  if (!isMapsConfigured()) return null;
  function fill(selection: PlaceSelection, includeVenueName: boolean) {
    const { venueName, ...address } = toGameLocationFields(selection);
    const fields: Partial<Record<LocationField, string>> = includeVenueName && venueName ? { ...address, venueName } : address;
    for (const [field, value] of Object.entries(fields)) setValue(field as LocationField, value, { shouldDirty: true, shouldValidate: true });
  }
  function choose(selection: PlaceSelection) {
    fill(selection, true);
    setPicked(selection);
    setBrowsing(false);
  }
  return (
    <div className="grid gap-4">
      <AddressAutocomplete id="venue-search" label="Find the park or field" description="Fills in the location below. You can still edit every field." onSelect={choose} />
      <Button type="button" variant="ghost" size="sm" className="w-fit" aria-expanded={browsing} onClick={() => setBrowsing((open) => !open)}>
        <Map aria-hidden /> {browsing ? "Hide nearby search" : "Browse fields near you"}
      </Button>
      {browsing && <PlacesSearch onSelect={choose} />}
      {picked && (
        <GoogleMapLocationPicker
          key={`${picked.placeId}-${picked.latitude}-${picked.longitude}`}
          initialPosition={{ lat: picked.latitude, lng: picked.longitude }}
          label="Game location"
          onPick={(selection) => fill(selection, false)}
        />
      )}
      <p role="note" className="flex gap-2 rounded-md bg-secondary p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-orange" aria-hidden />
        Google Maps lists parks and facilities. It doesn’t know whether a field is open or free to use, so make sure your group can play there.
      </p>
    </div>
  );
}
