import { describe, expect, it } from "vitest";
import { ApiError } from "./client";
import { bodyFieldErrors, friendlyErrorMessage } from "./error-messages";
import type { ApiErrorCode } from "./types";

const CODES: ApiErrorCode[] = ["VALIDATION_ERROR", "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "UNPROCESSABLE", "RATE_LIMITED", "INTERNAL_ERROR", "NETWORK_ERROR", "INVALID_RESPONSE"];

describe("friendly error messages", () => {
  it.each(CODES)("has a message for %s", (code) => {
    expect(friendlyErrorMessage(new ApiError(400, code, ""))).toMatch(/\w/);
  });
  it("explains 429 instead of echoing the raw server text", () => {
    expect(friendlyErrorMessage(new ApiError(429, "RATE_LIMITED", "Too many requests. Please try again later."))).toBe("Too many attempts. Wait a few minutes, then try again.");
  });
  it("shows the server's message for duplicate/full (409) and can't-accept (422) errors", () => {
    expect(friendlyErrorMessage(new ApiError(409, "CONFLICT", "A request for this game already exists."))).toBe("A request for this game already exists.");
    expect(friendlyErrorMessage(new ApiError(422, "UNPROCESSABLE", "This game is not accepting requests."))).toBe("This game is not accepting requests.");
  });
  it("lets a screen override a code", () => {
    expect(friendlyErrorMessage(new ApiError(429, "RATE_LIMITED", "x"), { RATE_LIMITED: "Slow down" })).toBe("Slow down");
  });
  it("never leaks internal errors or non-API exceptions", () => {
    expect(friendlyErrorMessage(new ApiError(500, "INTERNAL_ERROR", "stack trace here"))).not.toContain("stack");
    expect(friendlyErrorMessage(new TypeError("boom"))).not.toContain("boom");
  });
  it("maps body.<field> validation paths to form field names", () => {
    const error = new ApiError(400, "VALIDATION_ERROR", "Invalid", [{ path: "body.title", message: "Too long" }, { path: "query.page", message: "Bad" }]);
    expect(bodyFieldErrors(error)).toEqual({ title: "Too long" });
  });
});
