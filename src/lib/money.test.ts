import { describe, expect, it } from "vitest";
import { centsToDollars, dollarsToCents, formatCost } from "./money";

describe("cents conversion", () => {
  it.each([
    ["10", 1000],
    ["10.5", 1050],
    ["10.50", 1050],
    ["0.29", 29],
    ["0", 0],
    ["99999.99", 9999999],
  ])("dollars %s → %i cents", (dollars, cents) => {
    expect(dollarsToCents(dollars)).toBe(cents);
  });
  it("formats cents back for an input", () => {
    expect(centsToDollars(1000)).toBe("10");
    expect(centsToDollars(1050)).toBe("10.50");
    expect(centsToDollars(5)).toBe("0.05");
  });
  it("displays null as not listed and 0 as Free", () => {
    expect(formatCost(null)).toBe("Free");
    expect(formatCost(0)).toBe("Free");
    expect(formatCost(1050)).toBe("$10.50");
    expect(formatCost(2000, "PER_PLAYER")).toBe("$20 per player");
    expect(formatCost(12000, "PER_TEAM")).toBe("$120 per team");
    expect(formatCost(0, "PER_TEAM")).toBe("Free");
  });
});
