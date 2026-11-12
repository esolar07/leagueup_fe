import { describe, expect, it } from "vitest";
import { buildGame } from "@/test/fixtures";
import { diffGameChanges, EMPTY_LISTING, gameToFormValues, guestJoinSchema, listingSchema, teamJoinSchema, toSubmitGameInput, type ListingValues } from "./schemas";

const VALID: ListingValues = {
  ...EMPTY_LISTING,
  title: "Turkey Bowl 7v7",
  date: "2099-11-26",
  startTime: "09:00",
  venueName: "Tropical Park",
  city: "Miami",
  state: "FL",
  capacity: "14",
  organizerName: "Marcus T.",
  organizerEmail: "Marcus@Example.com",
};

function errorsFor(values: Partial<ListingValues>) {
  const result = listingSchema.safeParse({ ...VALID, ...values });
  return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
}

describe("join payload", () => {
  const guest = { name: "Sofia", email: "sofia@example.com", teamName: "Gobblers" };
  it("keeps the team name for TEAM games", () => {
    expect(teamJoinSchema.parse(guest)).toEqual(guest);
  });
  it("requires a team name for TEAM games", () => {
    expect(teamJoinSchema.safeParse({ ...guest, teamName: " " }).success).toBe(false);
  });
  it("drops the team name for PLAYER games", () => {
    expect(guestJoinSchema.parse(guest)).toEqual({ name: "Sofia", email: "sofia@example.com" });
  });
});

describe("listing validation", () => {
  it("accepts a complete listing", () => {
    expect(errorsFor({})).toEqual({});
  });
  it("requires the required fields", () => {
    expect(Object.keys(errorsFor({ title: "", venueName: "", city: "", organizerName: "", organizerEmail: "", date: "", startTime: "", capacity: "" })).sort()).toEqual(
      ["capacity", "city", "date", "organizerEmail", "organizerName", "startTime", "title", "venueName"].sort(),
    );
  });
  it.each([
    [{ title: "x".repeat(121) }, "title"],
    [{ description: "x".repeat(2001) }, "description"],
    [{ capacity: "0" }, "capacity"],
    [{ capacity: "201" }, "capacity"],
    [{ capacity: "1.5" }, "capacity"],
    [{ state: "Florida" }, "state"],
    [{ postalCode: "3315" }, "postalCode"],
    [{ costType: "paid" as const, cost: "ten" }, "cost"],
    [{ costType: "paid" as const, cost: "10.999" }, "cost"],
    [{ costType: "paid" as const, cost: "" }, "cost"],
    [{ costType: "paid" as const, cost: "0" }, "cost"],
    [{ organizerEmail: "not-an-email" }, "organizerEmail"],
    [{ date: "2020-01-01" }, "startTime"],
    [{ endTime: "08:00" }, "endTime"],
  ])("rejects %o on %s", (values, field) => {
    expect(errorsFor(values)).toHaveProperty(field);
  });
});

describe("listing payload", () => {
  it("sends only API fields, in UTC, with cents and no empty optionals", () => {
    const input = toSubmitGameInput(listingSchema.parse({ ...VALID, costType: "paid", cost: "10.50", skillLevel: "BEGINNER", state: "fl" }));
    expect(JSON.parse(JSON.stringify(input))).toEqual({
      title: "Turkey Bowl 7v7",
      sport: "FLAG_FOOTBALL",
      startDateTime: "2099-11-26T14:00:00.000Z",
      venueName: "Tropical Park",
      city: "Miami",
      state: "FL",
      registrationType: "PLAYER",
      capacity: 14,
      skillLevel: "BEGINNER",
      costCents: 1050,
      costBasis: "PER_PLAYER",
      organizerName: "Marcus T.",
      organizerEmail: "marcus@example.com",
      campaignSlug: "turkey-bowl-2026",
    });
  });
  it("lists every game in the Turkey Bowl", () => {
    expect(toSubmitGameInput(listingSchema.parse(VALID)).campaignSlug).toBe("turkey-bowl-2026");
  });
  it("lists a TEAM game with capacity counted in teams", () => {
    expect(toSubmitGameInput(listingSchema.parse({ ...VALID, registrationType: "TEAM", capacity: "8" }))).toMatchObject({ registrationType: "TEAM", capacity: 8 });
  });
  it("lists new games as Free by default, without a cost basis", () => {
    const input = toSubmitGameInput(listingSchema.parse(VALID));
    expect(input.costCents).toBe(0);
    expect(JSON.parse(JSON.stringify(input))).not.toHaveProperty("costBasis");
  });
  it("sends the chosen basis with a price", () => {
    const input = toSubmitGameInput(listingSchema.parse({ ...VALID, costType: "paid", cost: "120", costBasis: "PER_TEAM" }));
    expect(input).toMatchObject({ costCents: 12000, costBasis: "PER_TEAM" });
  });
  it("drops the basis when a priced game is switched back to Free", () => {
    const input = toSubmitGameInput(listingSchema.parse({ ...VALID, costType: "free", cost: "12", costBasis: "PER_TEAM" }));
    expect(JSON.parse(JSON.stringify(input))).not.toHaveProperty("costBasis");
  });
  it("ignores a leftover price when the game is switched to Free", () => {
    expect(toSubmitGameInput(listingSchema.parse({ ...VALID, costType: "free", cost: "12" })).costCents).toBe(0);
  });
  it("keeps an older game's unlisted cost unlisted when editing", () => {
    const unlisted = buildGame({ costCents: null });
    expect(gameToFormValues(unlisted)).toMatchObject({ costType: "", cost: "" });
    expect(diffGameChanges(unlisted, { ...gameToFormValues(unlisted), title: "Renamed" })).toEqual({ title: "Renamed" });
  });
  it("leaves an existing game's cost alone when editing", () => {
    const paid = buildGame({ costCents: 1000 });
    expect(diffGameChanges(paid, { ...gameToFormValues(paid), title: "Renamed" })).toEqual({ title: "Renamed" });
  });
});

describe("edit payload", () => {
  const game = buildGame({ costCents: 1000, skillLevel: "INTERMEDIATE" });
  it("sends nothing when nothing changed, so an unchanged start time is never re-sent", () => {
    expect(diffGameChanges(game, gameToFormValues(game))).toEqual({});
  });
  it("sends only changed fields, flat, with null for cleared optional fields", () => {
    const values = { ...gameToFormValues(game), title: "New name", address: "", costType: "free" as const, skillLevel: "" as const, capacity: "20" };
    expect(diffGameChanges(game, values)).toEqual({ title: "New name", address: null, costCents: 0, skillLevel: null, capacity: 20 });
  });
  it("prefills the basis from the game", () => {
    expect(gameToFormValues(buildGame({ costCents: 12000, costBasis: "PER_TEAM" }))).toMatchObject({ costType: "paid", cost: "120", costBasis: "PER_TEAM" });
  });
  it("sends price and basis together when only the basis changes", () => {
    const priced = buildGame({ costCents: 2000, costBasis: "PER_PLAYER" });
    expect(diffGameChanges(priced, { ...gameToFormValues(priced), costBasis: "PER_TEAM" })).toEqual({ costCents: 2000, costBasis: "PER_TEAM" });
  });
  it("sends price and basis together when only the price changes", () => {
    const priced = buildGame({ costCents: 2000, costBasis: "PER_TEAM" });
    expect(diffGameChanges(priced, { ...gameToFormValues(priced), cost: "25" })).toEqual({ costCents: 2500, costBasis: "PER_TEAM" });
  });
  it("sends a basis when a free game gets a price", () => {
    const free = buildGame({ costCents: 0 });
    expect(diffGameChanges(free, { ...gameToFormValues(free), costType: "paid", cost: "20" })).toEqual({ costCents: 2000, costBasis: "PER_PLAYER" });
  });
  it("sends only the price when a priced game becomes free", () => {
    const priced = buildGame({ costCents: 2000, costBasis: "PER_TEAM" });
    expect(diffGameChanges(priced, { ...gameToFormValues(priced), costType: "free" })).toEqual({ costCents: 0 });
  });
  it("prefills and sends a switch between players and teams", () => {
    const team = buildGame({ registrationType: "TEAM" });
    expect(gameToFormValues(team).registrationType).toBe("TEAM");
    expect(diffGameChanges(team, { ...gameToFormValues(team), registrationType: "PLAYER" })).toEqual({ registrationType: "PLAYER" });
  });
  it("sends startDateTime only when the start changes", () => {
    const changes = diffGameChanges(game, { ...gameToFormValues(game), startTime: "10:00" });
    expect(changes).toEqual({ startDateTime: "2099-11-26T15:00:00.000Z" });
  });
});
