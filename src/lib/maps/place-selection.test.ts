import { describe, expect, it } from "vitest";
import { TROPICAL_PARK_COMPONENTS } from "@/test/google-maps-fake";
import { addressFromComponents, directionsUrl, isAddressOnly, selectionFromGeocoderResult, toGameLocationFields, type PlaceSelection } from "./place-selection";

const park: PlaceSelection = {
  placeId: "place_tropical",
  name: "Tropical Park",
  formattedAddress: "7900 SW 40th St, Miami, FL 33155, USA",
  latitude: 25.73,
  longitude: -80.35,
  addressComponents: TROPICAL_PARK_COMPONENTS,
  types: ["park", "point_of_interest"],
};

describe("Google place → game location fields", () => {
  it("splits address components into the flat fields games store", () => {
    expect(addressFromComponents(TROPICAL_PARK_COMPONENTS)).toEqual({ address: "7900 Southwest 40th Street", city: "Miami", state: "FL", postalCode: "33155" });
  });
  it("falls back to sublocality for unincorporated areas and tolerates missing parts", () => {
    const kendall = [{ longText: "Kendall", shortText: "Kendall", types: ["sublocality", "political"] }];
    expect(addressFromComponents(kendall)).toEqual({ address: "", city: "Kendall", state: "", postalCode: "" });
  });
  it("suggests the place name as the venue for a park, but not for a bare street address", () => {
    expect(toGameLocationFields(park).venueName).toBe("Tropical Park");
    expect(toGameLocationFields({ ...park, types: ["street_address"] }).venueName).toBeUndefined();
    expect(isAddressOnly({ types: [] })).toBe(true);
  });
  it("reads legacy Geocoder results", () => {
    const result = {
      place_id: "geo_1",
      formatted_address: "7900 SW 40th St, Miami, FL 33155, USA",
      geometry: { location: { lat: () => 25.7, lng: () => -80.3 } },
      address_components: [{ long_name: "Miami", short_name: "Miami", types: ["locality"] }],
      types: ["street_address"],
    } as unknown as google.maps.GeocoderResult;
    expect(selectionFromGeocoderResult(result)).toMatchObject({ placeId: "geo_1", name: null, latitude: 25.7, longitude: -80.3, addressComponents: [{ longText: "Miami", shortText: "Miami", types: ["locality"] }] });
  });
  it("builds a Google Maps directions link, with the place id when known", () => {
    expect(directionsUrl({ address: "Tropical Park, Miami, FL" })).toBe("https://www.google.com/maps/dir/?api=1&destination=Tropical+Park%2C+Miami%2C+FL");
    expect(directionsUrl({ address: "Tropical Park", placeId: "abc" })).toContain("destination_place_id=abc");
  });
});
