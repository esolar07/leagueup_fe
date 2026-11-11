import { vi } from "vitest";
import type { MapsLibraries } from "@/lib/maps/loader";

/** Minimal stand-ins for the Google Maps libraries LeagueUp uses. Enough for behaviour tests, no network. */
export const latLng = (lat: number, lng: number) => ({ lat: () => lat, lng: () => lng, toJSON: () => ({ lat, lng }) });

export const TROPICAL_PARK_COMPONENTS = [
  { longText: "7900", shortText: "7900", types: ["street_number"] },
  { longText: "Southwest 40th Street", shortText: "SW 40th St", types: ["route"] },
  { longText: "Miami", shortText: "Miami", types: ["locality", "political"] },
  { longText: "Florida", shortText: "FL", types: ["administrative_area_level_1", "political"] },
  { longText: "33155", shortText: "33155", types: ["postal_code"] },
];

export function fakePlace(overrides: Record<string, unknown> = {}) {
  const place = {
    id: "place_tropical",
    displayName: "Tropical Park",
    formattedAddress: "7900 SW 40th St, Miami, FL 33155, USA",
    location: latLng(25.7334, -80.3507),
    addressComponents: TROPICAL_PARK_COMPONENTS,
    types: ["park", "point_of_interest"],
    ...overrides,
  };
  return { ...place, fetchFields: vi.fn(async () => ({ place })) };
}

export function fakePrediction(placeId: string, main: string, secondary: string, place = fakePlace()) {
  return { placeId, text: { text: `${main}, ${secondary}` }, mainText: { text: main }, secondaryText: { text: secondary }, toPlace: () => place };
}

class FakeEventTarget extends EventTarget {
  addListener = vi.fn(() => ({ remove: vi.fn() }));
}

export function fakeMapsLibraries() {
  const sessionTokens: object[] = [];
  const places = {
    AutocompleteSessionToken: class {
      constructor() {
        sessionTokens.push(this);
      }
    },
    AutocompleteSuggestion: { fetchAutocompleteSuggestions: vi.fn() },
    Place: { searchByText: vi.fn(), searchNearby: vi.fn() },
  };
  const maps = {
    Map: class {
      panTo = vi.fn();
      setZoom = vi.fn();
      addListener = vi.fn(() => ({ remove: vi.fn() }));
    },
  };
  const marker = { AdvancedMarkerElement: class extends FakeEventTarget {} };
  const geocode = vi.fn();
  const geocoding = { Geocoder: class { geocode = geocode; } };
  const libraries = { places, maps, marker, geocoding, core: {} } as unknown as MapsLibraries;
  return { libraries, places, geocode, sessionTokens };
}
