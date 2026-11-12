import { describe, expect, it } from "vitest";
import { participantLabel, spotsLabel } from "./game-state";

describe("spotsLabel", () => {
  it.each([
    [{ availableSpots: 12, capacity: 40, registrationType: "PLAYER" as const }, "12 of 40 players left"],
    [{ availableSpots: 3, capacity: 8, registrationType: "TEAM" as const }, "3 of 8 teams left"],
    [{ availableSpots: 1, capacity: 1, registrationType: "TEAM" as const }, "1 of 1 team left"],
    [{ availableSpots: 0, capacity: 8, registrationType: "TEAM" as const }, "Full"],
  ])("labels %o as %s", (game, label) => {
    expect(spotsLabel(game)).toBe(label);
  });
});

describe("participantLabel", () => {
  it("leads with the team on TEAM requests and the player otherwise", () => {
    expect(participantLabel({ name: "Sofia", teamName: "Gobblers" })).toBe("Gobblers");
    expect(participantLabel({ name: "Sofia", teamName: null })).toBe("Sofia");
  });
});
