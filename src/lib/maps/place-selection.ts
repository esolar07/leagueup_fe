/** A physical location picked from Google. It is NOT a LeagueUp venue and says nothing about whether anyone may play there. */
export interface AddressComponent {
  longText: string | null;
  shortText: string | null;
  types: string[];
}

export interface PlaceSelection {
  placeId: string | null;
  name: string | null;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  addressComponents: AddressComponent[];
  types: string[];
}

/** The flat location fields LeagueUp games store today. */
export interface GameLocationFields {
  venueName?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

/** Fields requested from Places (New). Kept minimal: the field mask drives billing. */
export const PLACE_FIELDS = ["id", "displayName", "formattedAddress", "location", "addressComponents", "types"];

const CITY_TYPES = ["locality", "sublocality", "postal_town", "administrative_area_level_3"];
const ADDRESS_ONLY_TYPES = ["street_address", "premise", "subpremise", "route", "postal_code", "plus_code"];

function componentText(components: AddressComponent[], types: string[], form: "longText" | "shortText" = "longText"): string {
  for (const type of types) {
    const match = components.find((component) => component.types.includes(type));
    if (match?.[form]) return match[form] as string;
  }
  return "";
}

export function addressFromComponents(components: AddressComponent[]): Omit<GameLocationFields, "venueName"> {
  return {
    address: [componentText(components, ["street_number"]), componentText(components, ["route"])].filter(Boolean).join(" "),
    city: componentText(components, CITY_TYPES),
    state: componentText(components, ["administrative_area_level_1"], "shortText"),
    postalCode: componentText(components, ["postal_code"]),
  };
}

/** A plain street address has no venue name worth suggesting; a park or complex does. */
export function isAddressOnly(selection: Pick<PlaceSelection, "types">): boolean {
  return selection.types.length === 0 || selection.types.some((type) => ADDRESS_ONLY_TYPES.includes(type));
}

export function toGameLocationFields(selection: PlaceSelection): GameLocationFields {
  const venueName = !isAddressOnly(selection) && selection.name ? selection.name : undefined;
  return { ...addressFromComponents(selection.addressComponents), venueName };
}

/** Places (New) `Place` → selection. Requires the PLACE_FIELDS to have been fetched. */
export function selectionFromPlace(place: google.maps.places.Place): PlaceSelection {
  return {
    placeId: place.id,
    name: place.displayName ?? null,
    formattedAddress: place.formattedAddress ?? "",
    latitude: place.location?.lat() ?? 0,
    longitude: place.location?.lng() ?? 0,
    addressComponents: (place.addressComponents ?? []).map(({ longText, shortText, types }) => ({ longText, shortText, types })),
    types: place.types ?? [],
  };
}

/** Geocoder results use the legacy snake_case shape. */
export function selectionFromGeocoderResult(result: google.maps.GeocoderResult): PlaceSelection {
  return {
    placeId: result.place_id ?? null,
    name: null,
    formattedAddress: result.formatted_address,
    latitude: result.geometry.location.lat(),
    longitude: result.geometry.location.lng(),
    addressComponents: result.address_components.map((component) => ({ longText: component.long_name, shortText: component.short_name, types: component.types })),
    types: result.types ?? [],
  };
}

/** Google Maps directions to a destination. Needs no API key or quota. */
export function directionsUrl({ address, placeId }: { address: string; placeId?: string | null }): string {
  const params = new URLSearchParams({ api: "1", destination: address });
  if (placeId) params.set("destination_place_id", placeId);
  return `https://www.google.com/maps/dir/?${params}`;
}
