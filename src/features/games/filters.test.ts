import { describe, expect, it } from "vitest";
import { filtersToSearchParams, formatLocation, GAMES_PER_PAGE, hasActiveFilters, parseFilters, parseLocationInput, toGamesQuery } from "./filters";

describe("Find Games URL state", () => {
  it("reads valid filters from the URL", () => {
    const params = new URLSearchParams("q=bowl&city=Miami&postalCode=33155&date=2026-11-26&skillLevel=BEGINNER&hasSpots=true&sort=-createdAt&page=2");
    expect(parseFilters(params)).toEqual({ q: "bowl", city: "Miami", postalCode: "33155", date: "2026-11-26", skillLevel: "BEGINNER", hasSpots: true, sort: "-createdAt", page: 2 });
  });
  it("drops empty and invalid values instead of passing them on", () => {
    const params = new URLSearchParams("q=&city=%20%20&postalCode=331&date=tomorrow&skillLevel=PRO&hasSpots=maybe&sort=random&page=0");
    expect(Object.values(parseFilters(params)).filter((value) => value !== undefined)).toEqual([]);
  });
  it("writes only set filters back to the URL and leaves out the default sort", () => {
    const params = filtersToSearchParams({ q: "bowl", city: "", hasSpots: undefined, sort: "startDateTime", skillLevel: "ADVANCED" });
    expect(params.toString()).toBe("q=bowl&skillLevel=ADVANCED");
  });
  it("round-trips filters through the URL", () => {
    const filters = { q: "turkey", date: "2026-11-26", hasSpots: true as const, page: 3 };
    expect(parseFilters(filtersToSearchParams(filters))).toMatchObject(filters);
  });
  it("knows when any filter is active", () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ sort: "-createdAt", page: 2 })).toBe(false);
    expect(hasActiveFilters({ city: "Miami" })).toBe(true);
  });
});

describe("API query", () => {
  it("omits every empty parameter, because the API answers 400 to one", () => {
    const query = toGamesQuery({ q: "", city: undefined, skillLevel: undefined });
    expect(query).toEqual({ page: "1", perPage: String(GAMES_PER_PAGE) });
    expect(Object.values(query)).not.toContain("");
  });
  it("converts a selected Miami day into from/to timestamps", () => {
    const query = toGamesQuery({ date: "2026-11-26" });
    expect(query.from).toBe("2026-11-26T05:00:00.000Z");
    expect(query.to).toBe("2026-11-27T04:59:59.999Z");
    expect(query).not.toHaveProperty("date");
  });
  it("fixes the campaign and passes filters through", () => {
    expect(toGamesQuery({ skillLevel: "BEGINNER", hasSpots: true, page: 2 }, "turkey-bowl-2026")).toEqual({
      skillLevel: "BEGINNER",
      hasSpots: "true",
      campaign: "turkey-bowl-2026",
      page: "2",
      perPage: String(GAMES_PER_PAGE),
    });
  });
});

describe("campaign filter bar helpers", () => {
  it("reads one location box as ZIP, city + state, or city", () => {
    expect(parseLocationInput("33155")).toEqual({ postalCode: "33155" });
    expect(parseLocationInput(" Miami, fl ")).toEqual({ city: "Miami", state: "FL" });
    expect(parseLocationInput("Coral Gables")).toEqual({ city: "Coral Gables" });
    expect(parseLocationInput("Miami, Florida")).toEqual({ city: "Miami" });
    expect(parseLocationInput("  ")).toEqual({});
  });
  it("shows the location back the way it was typed", () => {
    expect(formatLocation({ city: "Miami", state: "FL" })).toBe("Miami, FL");
    expect(formatLocation({ postalCode: "33155", city: "ignored" })).toBe("33155");
    expect(formatLocation({})).toBe("");
  });
  it("turns a date range into from the first morning to the last night, Miami time", () => {
    expect(toGamesQuery({ date: "2026-11-23", until: "2026-11-29" })).toMatchObject({ from: "2026-11-23T05:00:00.000Z", to: "2026-11-30T04:59:59.999Z" });
    expect(toGamesQuery({ date: "2026-11-26", until: "2026-11-20" })).toMatchObject({ to: "2026-11-27T04:59:59.999Z" });
  });
  it("keeps state and range end in the URL", () => {
    const filters = { city: "Miami", state: "FL", date: "2026-11-23", until: "2026-11-29" };
    expect(parseFilters(filtersToSearchParams(filters))).toMatchObject(filters);
  });
});
