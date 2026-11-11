"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, LocateFixed, Loader2, Search, TriangleAlert } from "lucide-react";
import { GoogleMap } from "@/components/maps/google-map";
import { GoogleMapMarker } from "@/components/maps/google-map-marker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserLocation } from "@/hooks/use-user-location";
import { MAPS_REGION, DEFAULT_MAP_CENTER, SEARCH_BIAS_RADIUS_METERS, type LatLng } from "@/lib/maps/config";
import { PLACE_FIELDS, selectionFromPlace, type PlaceSelection } from "@/lib/maps/place-selection";
import { useMapsLibrary } from "@/lib/maps/use-maps-library";
import { cn } from "@/lib/utils";

/** Place types worth showing for "fields near me". None of them guarantees a playable, available field. */
export const SPORTS_PLACE_TYPES = ["athletic_field", "sports_complex", "stadium", "park", "sports_activity_location"];
const NEARBY_RADIUS_METERS = 10_000;
const MAX_RESULTS = 10;

interface PlacesSearchRequest {
  query: string;
  center: LatLng;
}

/** Blank query → nearby sports places around `center`; otherwise a text search biased to it. */
export async function searchSportsPlaces(places: google.maps.PlacesLibrary, { query, center }: PlacesSearchRequest): Promise<PlaceSelection[]> {
  if (!query) {
    const request = { fields: PLACE_FIELDS, locationRestriction: { center, radius: NEARBY_RADIUS_METERS }, includedTypes: SPORTS_PLACE_TYPES, maxResultCount: MAX_RESULTS };
    return (await places.Place.searchNearby(request)).places.map(selectionFromPlace);
  }
  const request = { textQuery: query, fields: PLACE_FIELDS, locationBias: { center, radius: SEARCH_BIAS_RADIUS_METERS }, maxResultCount: MAX_RESULTS, region: MAPS_REGION };
  return (await places.Place.searchByText(request)).places.map(selectionFromPlace);
}

function useSportsPlaces(request: PlacesSearchRequest | null) {
  const { data: places } = useMapsLibrary("places");
  return useQuery({
    queryKey: ["sports-places", request],
    queryFn: () => searchSportsPlaces(places!, request!),
    enabled: Boolean(places && request),
    staleTime: 10 * 60_000,
    retry: false,
  });
}

/**
 * Find a park, field or complex to play at. Searches only when asked (no request per
 * keystroke). Uses the user's location if they share it, otherwise the default map area. No <form> inside:
 * it is rendered within the game form, so Enter searches instead of submitting that form.
 */
export function PlacesSearch({ onSelect, defaultQuery = "flag football field" }: { onSelect: (selection: PlaceSelection) => void; defaultQuery?: string }) {
  const id = useId();
  const location = useUserLocation();
  const [query, setQuery] = useState(defaultQuery);
  const [request, setRequest] = useState<PlacesSearchRequest | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const results = useSportsPlaces(request);
  const userCenter = location.latitude !== null ? { lat: location.latitude, lng: location.longitude } : null;
  const center = userCenter ?? DEFAULT_MAP_CENTER;
  const places = results.data ?? [];
  const selected = places.find((place) => place.placeId === selectedId) ?? null;
  function search() {
    setSelectedId(null);
    setRequest({ query: query.trim(), center });
  }
  function searchOnEnter(event: KeyboardEvent) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    search();
  }
  return (
    <section aria-label="Search for a place to play" className="grid gap-4 rounded-lg border border-border bg-background/40 p-4">
      <div role="search" className="grid gap-2">
        <Label htmlFor={`${id}-query`}>Search parks and fields</Label>
        <div className="flex gap-2">
          <Input id={`${id}-query`} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={searchOnEnter} placeholder="Leave blank for sports places nearby" />
          <Button type="button" className="h-11" aria-label="Search places" onClick={search}><Search aria-hidden /></Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Button type="button" variant="outline" size="sm" onClick={location.requestLocation} disabled={location.loading}>
          {location.loading ? <Loader2 className="animate-spin" aria-hidden /> : <LocateFixed aria-hidden />} Use my location
        </Button>
        <span role="status">{location.error ?? (userCenter ? "Searching near you." : "Share your location to search near you.")}</span>
      </div>
      {results.isFetching && <p role="status" className="text-sm text-muted-foreground">Searching…</p>}
      {results.isError && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><TriangleAlert className="size-4" aria-hidden /> Place search isn’t working right now. Type the address in the fields below.</p>}
      {results.isSuccess && places.length === 0 && <p className="text-sm text-muted-foreground">No places found. Try another search, like a park name or neighborhood.</p>}
      {places.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          <ul className="grid max-h-72 content-start gap-2 overflow-y-auto" aria-label="Places found">
            {places.map((place) => (
              <li key={place.placeId}>
                <button
                  type="button"
                  aria-pressed={place.placeId === selectedId}
                  onClick={() => setSelectedId(place.placeId)}
                  className={cn("w-full rounded-md border border-border p-3 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none", place.placeId === selectedId && "border-primary bg-primary/10")}
                >
                  <span className="block font-semibold">{place.name}</span>
                  <span className="block text-muted-foreground">{place.formattedAddress}</span>
                </button>
              </li>
            ))}
          </ul>
          <GoogleMap center={selected ? { lat: selected.latitude, lng: selected.longitude } : (request?.center ?? center)} zoom={selected ? 15 : 12} label="Places found" className="h-64 lg:h-72">
            {userCenter && <GoogleMapMarker position={userCenter} title="Your location" variant="user" />}
            {places.map((place) => (
              <GoogleMapMarker key={place.placeId} position={{ lat: place.latitude, lng: place.longitude }} title={place.name ?? place.formattedAddress} variant={place.placeId === selectedId ? "selected" : "venue"} onSelect={() => setSelectedId(place.placeId)} />
            ))}
          </GoogleMap>
        </div>
      )}
      {selected && (
        <Button type="button" onClick={() => onSelect(selected)}>
          <Check aria-hidden /> Use {selected.name ?? "this place"}
        </Button>
      )}
      <p className="text-right text-[10px] text-muted-foreground">Powered by Google</p>
    </section>
  );
}
