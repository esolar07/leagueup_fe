import { describe, expect, it } from "vitest";
import { easternDayRange, easternToUtcIso, formatGameDay, formatGameTime, formatGameTimeRange, utcToEasternParts } from "./eastern-time";

describe("Miami time conversion (device timezone is America/Los_Angeles in tests)", () => {
  it("reads form input as Eastern Standard Time in November", () => {
    expect(easternToUtcIso("2026-11-26", "09:00")).toBe("2026-11-26T14:00:00.000Z");
  });
  it("reads form input as Eastern Daylight Time in summer", () => {
    expect(easternToUtcIso("2026-07-04", "09:00")).toBe("2026-07-04T13:00:00.000Z");
  });
  it("handles the day daylight saving starts", () => {
    expect(easternToUtcIso("2026-03-08", "03:30")).toBe("2026-03-08T07:30:00.000Z");
  });
  it("turns a Miami calendar day into the API's from/to bounds", () => {
    expect(easternDayRange("2026-11-26")).toEqual({ from: "2026-11-26T05:00:00.000Z", to: "2026-11-27T04:59:59.999Z" });
  });
  it("splits a UTC instant back into Miami date and time for editing", () => {
    expect(utcToEasternParts("2026-11-27T02:30:00.000Z")).toEqual({ date: "2026-11-26", time: "21:30" });
  });
  it("displays game times in Miami time, not the device's", () => {
    expect(formatGameDay("2026-11-26T14:00:00.000Z")).toBe("Thu, Nov 26");
    expect(formatGameTime("2026-11-26T14:00:00.000Z")).toBe("9:00 AM");
    expect(formatGameTimeRange("2026-11-26T14:00:00.000Z", "2026-11-26T16:30:00.000Z")).toBe("9:00 AM – 11:30 AM");
    expect(formatGameTimeRange("2026-11-26T14:00:00.000Z", null)).toBe("9:00 AM");
  });
});
